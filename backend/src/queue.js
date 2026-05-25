import { getQueuedSessions, getSessionsByStatus, updateSessionStatus, getSession } from './db.js';
import { EventEmitter } from 'events';

export class FarmQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxWorkers = options.maxWorkers || 2;
    this.running = new Map(); // sessionId -> worker reference
    this.paused = new Map(); // sessionId -> progress state
  }

  get runningCount() {
    return this.running.size;
  }

  get hasCapacity() {
    return this.running.size < this.maxWorkers;
  }

  setMaxWorkers(count) {
    this.maxWorkers = Math.max(1, Math.min(5, count));
    // Try to fill new capacity
    this.processNext();
  }

  enqueue(sessionId) {
    // Session is already in DB as 'queued', just trigger processing
    this.emit('enqueued', sessionId);
    this.processNext();
  }

  processNext() {
    if (!this.hasCapacity) return;

    const queued = getQueuedSessions();
    for (const session of queued) {
      if (!this.hasCapacity) break;
      if (this.running.has(session.id)) continue;

      // Mark as ready to run - the worker pool will pick it up
      this.emit('ready', session.id);
    }
  }

  markRunning(sessionId, workerRef) {
    this.running.set(sessionId, workerRef);
    this.emit('started', sessionId);
  }

  markCompleted(sessionId) {
    this.running.delete(sessionId);
    this.emit('completed', sessionId);
    // Process next in queue
    this.processNext();
  }

  markError(sessionId, error) {
    this.running.delete(sessionId);
    this.emit('error', sessionId, error);
    this.processNext();
  }

  pause(sessionId) {
    const session = getSession(sessionId);
    if (!session || session.status !== 'running') return false;

    updateSessionStatus(sessionId, 'paused');
    // The worker checks session status each iteration and will stop
    this.running.delete(sessionId);
    this.emit('paused', sessionId);
    this.processNext();
    return true;
  }

  resume(sessionId) {
    const session = getSession(sessionId);
    if (!session || session.status !== 'paused') return false;

    updateSessionStatus(sessionId, 'queued', { skipStartedAt: true });
    this.emit('resumed', sessionId);
    this.processNext();
    return true;
  }

  cancel(sessionId) {
    const session = getSession(sessionId);
    if (!session) return false;
    if (!['queued', 'running', 'paused'].includes(session.status)) return false;

    updateSessionStatus(sessionId, 'cancelled');
    this.running.delete(sessionId);
    this.emit('cancelled', sessionId);
    this.processNext();
    return true;
  }

  getStatus() {
    const queued = getSessionsByStatus('queued');
    const running = getSessionsByStatus('running');
    const paused = getSessionsByStatus('paused');

    return {
      maxWorkers: this.maxWorkers,
      running: running.length,
      queued: queued.length,
      paused: paused.length,
      sessions: {
        running,
        queued,
        paused
      }
    };
  }
}
