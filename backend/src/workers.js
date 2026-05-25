import { getSession, getSessionOptions, updateSessionStatus, incrementSessionCompleted, addSessionLog, getSetting } from './db.js';
import { getOctokitFromToken, withRateLimit, sleep } from './github.js';

export class WorkerPool {
  constructor(queue, io) {
    this.queue = queue;
    this.io = io;
    this.workers = new Map();

    this.queue.on('ready', (sessionId) => {
      this.startWorker(sessionId);
    });

    this.queue.on('cancelled', (sessionId) => {
      const worker = this.workers.get(sessionId);
      if (worker) worker.abort = true;
    });

    this.queue.on('paused', (sessionId) => {
      const worker = this.workers.get(sessionId);
      if (worker) worker.abort = true;
    });
  }

  async startWorker(sessionId) {
    const session = getSession(sessionId);
    if (!session) return;

    const userToken = this._getUserToken(session.username);
    if (!userToken) {
      updateSessionStatus(sessionId, 'error', { errorMessage: 'No auth token available' });
      addSessionLog(sessionId, 'No auth token available - user must be logged in', 'error');
      this.queue.markError(sessionId, 'No auth token');
      return;
    }

    updateSessionStatus(sessionId, 'running');
    const workerState = { abort: false };
    this.workers.set(sessionId, workerState);
    this.queue.markRunning(sessionId, workerState);
    this.emitProgress(session.username, sessionId);

    try {
      switch (session.type) {
        case 'pull-shark':
          await this.farmPullShark(session, userToken, workerState);
          break;
        case 'yolo':
          await this.farmYolo(session, userToken, workerState);
          break;
        case 'quickdraw':
          await this.farmQuickdraw(session, userToken, workerState);
          break;
        default:
          throw new Error(`Unknown farm type: ${session.type}`);
      }

      const finalSession = getSession(sessionId);
      if (finalSession.status === 'running') {
        updateSessionStatus(sessionId, 'completed');
        addSessionLog(sessionId, `Completed: ${finalSession.completed}/${finalSession.count}`, 'info');
      }
      this.emitProgress(session.username, sessionId);
      this.queue.markCompleted(sessionId);
    } catch (error) {
      updateSessionStatus(sessionId, 'error', { errorMessage: error.message });
      addSessionLog(sessionId, `Fatal error: ${error.message}`, 'error');
      this.emitProgress(session.username, sessionId);
      this.queue.markError(sessionId, error.message);
    } finally {
      this.workers.delete(sessionId);
    }
  }

  _userTokens = new Map();

  setUserToken(username, token) {
    this._userTokens.set(username, token);
  }

  removeUserToken(username) {
    this._userTokens.delete(username);
  }

  _getUserToken(username) {
    return this._userTokens.get(username);
  }

  emitProgress(username, sessionId) {
    if (!this.io) return;
    const session = getSession(sessionId);
    if (!session) return;

    this.io.to(`user:${username}`).emit('farm:progress', {
      sessionId: session.id,
      type: session.type,
      status: session.status,
      completed: session.completed,
      total: session.count,
      message: this._getProgressMessage(session)
    });
  }

  _getProgressMessage(session) {
    switch (session.status) {
      case 'queued': return `Queued: ${session.type}`;
      case 'running': return `${session.type} ${session.completed}/${session.count}`;
      case 'paused': return `Paused at ${session.completed}/${session.count}`;
      case 'completed': return `Finished: ${session.completed}/${session.count}`;
      case 'error': return `Error: ${session.error_message || 'Unknown'}`;
      case 'cancelled': return `Cancelled at ${session.completed}/${session.count}`;
      default: return session.status;
    }
  }

  _shouldStop(sessionId, workerState) {
    if (workerState.abort) return true;
    const session = getSession(sessionId);
    if (!session || !['running'].includes(session.status)) return true;
    return false;
  }

  async _cleanupRepo(octokit, username, repoName, sessionId) {
    try {
      await octokit.rest.repos.delete({ owner: username, repo: repoName });
      addSessionLog(sessionId, `Auto-cleaned repo: ${repoName}`, 'info');
      if (this.io) {
        this.io.to(`user:${username}`).emit('farm:repo-deleted', { name: repoName });
      }
    } catch (err) {
      addSessionLog(sessionId, `Failed to cleanup ${repoName}: ${err.message}`, 'error');
    }
  }

  _getAutoCleanup(username) {
    try {
      return getSetting(username, 'autoCleanup');
    } catch {
      return false;
    }
  }

  // --- Pull Shark ---
  async farmPullShark(session, token, workerState) {
    const octokit = getOctokitFromToken(token);
    const { id: sessionId, username, count, delay, use_existing_repo, existing_repo, repo_visibility } = session;
    const startFrom = session.completed;

    let repoName = null;
    let repoOwner = username;
    let createdRepo = false;

    if (use_existing_repo && existing_repo) {
      const parts = existing_repo.split('/');
      repoOwner = parts[0];
      repoName = parts[1];
      addSessionLog(sessionId, `Using existing repo: ${existing_repo}`);
    } else {
      repoName = `badge-farm-${Date.now()}`;
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        auto_init: true,
        private: repo_visibility === 'private',
        description: 'Auto-generated for badge farming'
      });
      createdRepo = true;
      addSessionLog(sessionId, `Created repo: ${repoName}`);
      updateSessionStatus(sessionId, 'running', { repoName, repoOwner });
    }

    this.emitProgress(username, sessionId);

    let defaultBranch = 'main';
    try {
      const { data: repoData } = await octokit.rest.repos.get({ owner: repoOwner, repo: repoName });
      defaultBranch = repoData.default_branch;
    } catch (e) {
      addSessionLog(sessionId, `Warning: couldn't detect default branch, using 'main'`, 'warn');
    }

    for (let i = startFrom; i < count; i++) {
      if (this._shouldStop(sessionId, workerState)) break;

      try {
        const refResult = await withRateLimit(octokit, () =>
          octokit.rest.git.getRef({ owner: repoOwner, repo: repoName, ref: `heads/${defaultBranch}` }),
          this.io, username);

        if (!refResult.success) {
          addSessionLog(sessionId, 'Rate limit retry failed, stopping', 'error');
          break;
        }

        const branchName = `farm-${i}-${Date.now()}`;
        await withRateLimit(octokit, () =>
          octokit.rest.git.createRef({
            owner: repoOwner, repo: repoName,
            ref: `refs/heads/${branchName}`,
            sha: refResult.data.data.object.sha
          }), this.io, username);

        await withRateLimit(octokit, () =>
          octokit.rest.repos.createOrUpdateFileContents({
            owner: repoOwner, repo: repoName,
            path: `farm-${i}-${Date.now()}.md`,
            message: `Add farm file ${i}`,
            content: Buffer.from(`# Farm ${i}\nTimestamp: ${new Date().toISOString()}`).toString('base64'),
            branch: branchName
          }), this.io, username);

        const prResult = await withRateLimit(octokit, () =>
          octokit.rest.pulls.create({
            owner: repoOwner, repo: repoName,
            title: `Farm PR #${i + 1}`,
            head: branchName,
            base: defaultBranch
          }), this.io, username);

        if (!prResult.success) {
          addSessionLog(sessionId, `Failed to create PR ${i + 1}`, 'error');
          continue;
        }

        await withRateLimit(octokit, () =>
          octokit.rest.pulls.merge({
            owner: repoOwner, repo: repoName,
            pull_number: prResult.data.data.number,
            merge_method: 'merge'
          }), this.io, username);

        incrementSessionCompleted(sessionId);
        addSessionLog(sessionId, `Merged PR #${prResult.data.data.number} (${i + 1}/${count})`);
        this.emitProgress(username, sessionId);

        if (i < count - 1) await sleep(delay);
      } catch (error) {
        addSessionLog(sessionId, `Error on PR ${i + 1}: ${error.message}`, 'error');
        this.emitProgress(username, sessionId);
      }
    }

    if (createdRepo && repoName) {
      const settings = this._getAutoCleanup(username);
      if (settings) {
        await this._cleanupRepo(octokit, username, repoName, sessionId);
      }
    }
  }

  // --- YOLO ---
  async farmYolo(session, token, workerState) {
    const octokit = getOctokitFromToken(token);
    const { id: sessionId, username, count, delay, use_existing_repo, existing_repo, repo_visibility } = session;
    const startFrom = session.completed;

    let repoName = null;
    let repoOwner = username;
    let createdRepo = false;

    if (use_existing_repo && existing_repo) {
      const parts = existing_repo.split('/');
      repoOwner = parts[0];
      repoName = parts[1];
      addSessionLog(sessionId, `Using existing repo: ${existing_repo}`);
    } else {
      repoName = `yolo-farm-${Date.now()}`;
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        auto_init: true,
        private: repo_visibility === 'private',
        description: 'YOLO badge farming'
      });
      createdRepo = true;
      addSessionLog(sessionId, `Created repo: ${repoName}`);
      updateSessionStatus(sessionId, 'running', { repoName, repoOwner });
    }

    this.emitProgress(username, sessionId);

    let defaultBranch = 'main';
    try {
      const { data: repoData } = await octokit.rest.repos.get({ owner: repoOwner, repo: repoName });
      defaultBranch = repoData.default_branch;
    } catch (e) {}

    for (let i = startFrom; i < count; i++) {
      if (this._shouldStop(sessionId, workerState)) break;

      try {
        const refResult = await withRateLimit(octokit, () =>
          octokit.rest.git.getRef({ owner: repoOwner, repo: repoName, ref: `heads/${defaultBranch}` }),
          this.io, username);

        if (!refResult.success) break;

        const branchName = `yolo-${i}-${Date.now()}`;
        await withRateLimit(octokit, () =>
          octokit.rest.git.createRef({
            owner: repoOwner, repo: repoName,
            ref: `refs/heads/${branchName}`,
            sha: refResult.data.data.object.sha
          }), this.io, username);

        await withRateLimit(octokit, () =>
          octokit.rest.repos.createOrUpdateFileContents({
            owner: repoOwner, repo: repoName,
            path: `yolo-${i}-${Date.now()}.md`,
            message: `YOLO ${i}`,
            content: Buffer.from(`YOLO #${i}`).toString('base64'),
            branch: branchName
          }), this.io, username);

        const prResult = await withRateLimit(octokit, () =>
          octokit.rest.pulls.create({
            owner: repoOwner, repo: repoName,
            title: `YOLO #${i + 1}`,
            head: branchName,
            base: defaultBranch
          }), this.io, username);

        if (!prResult.success) continue;

        await withRateLimit(octokit, () =>
          octokit.rest.pulls.merge({
            owner: repoOwner, repo: repoName,
            pull_number: prResult.data.data.number,
            merge_method: 'merge'
          }), this.io, username);

        incrementSessionCompleted(sessionId);
        addSessionLog(sessionId, `YOLO merged PR #${prResult.data.data.number} (${i + 1}/${count})`);
        this.emitProgress(username, sessionId);

        if (i < count - 1) await sleep(delay);
      } catch (error) {
        addSessionLog(sessionId, `Error on YOLO ${i + 1}: ${error.message}`, 'error');
        this.emitProgress(username, sessionId);
      }
    }

    if (createdRepo && repoName) {
      const settings = this._getAutoCleanup(username);
      if (settings) {
        await this._cleanupRepo(octokit, username, repoName, sessionId);
      }
    }
  }

  // --- Quickdraw ---
  async farmQuickdraw(session, token, workerState) {
    const octokit = getOctokitFromToken(token);
    const { id: sessionId, username, count, delay, use_existing_repo, existing_repo, repo_visibility } = session;
    const startFrom = session.completed;

    let repoName = null;
    let repoOwner = username;
    let createdRepo = false;

    if (use_existing_repo && existing_repo) {
      const parts = existing_repo.split('/');
      repoOwner = parts[0];
      repoName = parts[1];
      addSessionLog(sessionId, `Using existing repo: ${existing_repo}`);
    } else {
      repoName = `quickdraw-farm-${Date.now()}`;
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        auto_init: true,
        private: repo_visibility === 'private',
        description: 'Quickdraw badge farming',
        has_issues: true
      });
      createdRepo = true;
      addSessionLog(sessionId, `Created repo: ${repoName}`);
      updateSessionStatus(sessionId, 'running', { repoName, repoOwner });
    }

    this.emitProgress(username, sessionId);

    for (let i = startFrom; i < count; i++) {
      if (this._shouldStop(sessionId, workerState)) break;

      try {
        const issueResult = await withRateLimit(octokit, () =>
          octokit.rest.issues.create({
            owner: repoOwner, repo: repoName,
            title: `Quickdraw #${i + 1}`,
            body: 'Speed farming'
          }), this.io, username);

        if (!issueResult.success) continue;

        await withRateLimit(octokit, () =>
          octokit.rest.issues.update({
            owner: repoOwner, repo: repoName,
            issue_number: issueResult.data.data.number,
            state: 'closed'
          }), this.io, username);

        incrementSessionCompleted(sessionId);
        addSessionLog(sessionId, `Quickdraw issue #${issueResult.data.data.number} (${i + 1}/${count})`);
        this.emitProgress(username, sessionId);

        if (i < count - 1) await sleep(delay);
      } catch (error) {
        addSessionLog(sessionId, `Error on issue ${i + 1}: ${error.message}`, 'error');
        this.emitProgress(username, sessionId);
      }
    }

    if (createdRepo && repoName) {
      const settings = this._getAutoCleanup(username);
      if (settings) {
        await this._cleanupRepo(octokit, username, repoName, sessionId);
      }
    }
  }
}
