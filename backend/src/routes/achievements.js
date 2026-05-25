import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getOctokit } from '../github.js';

export const achievementsRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');
const BADGE_STATE_FILE = join(DATA_DIR, 'badge-state.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

let io = null;
export function setAchievementsIO(socketIO) {
  io = socketIO;
}

function loadBadgeState() {
  try {
    if (existsSync(BADGE_STATE_FILE)) {
      return JSON.parse(readFileSync(BADGE_STATE_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveBadgeState(state) {
  writeFileSync(BADGE_STATE_FILE, JSON.stringify(state, null, 2));
}

function checkForNewBadges(username, progress) {
  const allState = loadBadgeState();
  const prevState = allState[username] || {};
  const newUnlocks = [];

  for (const achievement of progress) {
    const prevTier = prevState[achievement.id]?.tierName || null;
    const currentTier = achievement.currentTier?.name || null;

    if (currentTier && currentTier !== prevTier) {
      newUnlocks.push({
        achievementId: achievement.id,
        achievementName: achievement.name,
        icon: achievement.icon,
        tier: currentTier,
        tierColor: achievement.currentTier.color,
        current: achievement.current,
        timestamp: Date.now()
      });
    }
  }

  const newState = {};
  for (const achievement of progress) {
    newState[achievement.id] = {
      tierName: achievement.currentTier?.name || null,
      current: achievement.current
    };
  }
  allState[username] = newState;
  saveBadgeState(allState);

  return newUnlocks;
}

const ACHIEVEMENTS = [
  {
    id: 'pull-shark',
    name: 'Pull Shark',
    description: 'Opened a pull request that has been merged',
    icon: '🦈',
    tiers: [
      { name: 'default', threshold: 2, color: '#C0C0C0' },
      { name: 'bronze', threshold: 16, color: '#CD7F32' },
      { name: 'silver', threshold: 128, color: '#C0C0C0' },
      { name: 'gold', threshold: 1024, color: '#FFD700' }
    ]
  },
  {
    id: 'yolo',
    name: 'YOLO',
    description: 'Merged a pull request without a review',
    icon: '🤠',
    tiers: [
      { name: 'default', threshold: 1, color: '#C0C0C0' }
    ]
  },
  {
    id: 'quickdraw',
    name: 'Quickdraw',
    description: 'Closed an issue/PR within 5 minutes of opening',
    icon: '🔫',
    tiers: [
      { name: 'default', threshold: 1, color: '#C0C0C0' }
    ]
  },
  {
    id: 'pair-extraordinaire',
    name: 'Pair Extraordinaire',
    description: 'Co-authored commits on a merged pull request',
    icon: '👯',
    tiers: [
      { name: 'default', threshold: 1, color: '#C0C0C0' },
      { name: 'bronze', threshold: 10, color: '#CD7F32' },
      { name: 'silver', threshold: 24, color: '#C0C0C0' },
      { name: 'gold', threshold: 48, color: '#FFD700' }
    ]
  },
  {
    id: 'galaxy-brain',
    name: 'Galaxy Brain',
    description: 'Got an accepted answer in a discussion',
    icon: '🧠',
    tiers: [
      { name: 'default', threshold: 2, color: '#C0C0C0' },
      { name: 'bronze', threshold: 8, color: '#CD7F32' },
      { name: 'silver', threshold: 16, color: '#C0C0C0' },
      { name: 'gold', threshold: 32, color: '#FFD700' }
    ]
  },
  {
    id: 'starstruck',
    name: 'Starstruck',
    description: 'Created a repository that has many stars',
    icon: '⭐',
    tiers: [
      { name: 'default', threshold: 16, color: '#C0C0C0' },
      { name: 'bronze', threshold: 128, color: '#CD7F32' },
      { name: 'silver', threshold: 512, color: '#C0C0C0' },
      { name: 'gold', threshold: 4096, color: '#FFD700' }
    ]
  },
  {
    id: 'open-sourcerer',
    name: 'Open Sourcerer',
    description: 'PRs merged in multiple public repos you don\'t own',
    icon: '🧙',
    tiers: [
      { name: 'default', threshold: 1, color: '#C0C0C0' },
      { name: 'bronze', threshold: 3, color: '#CD7F32' },
      { name: 'silver', threshold: 10, color: '#C0C0C0' },
      { name: 'gold', threshold: 25, color: '#FFD700' }
    ]
  }
];

achievementsRouter.get('/definitions', (req, res) => {
  res.json(ACHIEVEMENTS);
});

achievementsRouter.get('/progress', async (req, res) => {
  try {
    const octokit = getOctokit(req);
    const username = req.user.username;

    const [mergedPRs, yoloPRs, quickdraws, repos, coAuthoredCommits, discussions, openSourceRepos] = await Promise.all([
      fetchMergedPRCount(octokit, username),
      fetchYoloPRCount(octokit, username),
      fetchQuickdrawCount(octokit, username),
      fetchUserRepos(octokit, username),
      fetchCoAuthoredCommits(octokit, username),
      fetchDiscussionAnswers(octokit, username),
      fetchOpenSourcererCount(octokit, username)
    ]);

    const maxStars = repos.reduce((max, repo) => Math.max(max, repo.stargazers_count), 0);

    const progress = ACHIEVEMENTS.map(achievement => {
      let current = 0;
      switch (achievement.id) {
        case 'pull-shark': current = mergedPRs; break;
        case 'yolo': current = yoloPRs; break;
        case 'quickdraw': current = quickdraws; break;
        case 'pair-extraordinaire': current = coAuthoredCommits; break;
        case 'galaxy-brain': current = discussions; break;
        case 'starstruck': current = maxStars; break;
        case 'open-sourcerer': current = openSourceRepos; break;
      }

      const currentTier = getCurrentTier(achievement.tiers, current);
      const nextTier = getNextTier(achievement.tiers, current);

      return {
        ...achievement,
        current,
        currentTier,
        nextTier,
        progress: nextTier ? (current / nextTier.threshold) * 100 : 100
      };
    });

    const newUnlocks = checkForNewBadges(username, progress);
    if (newUnlocks.length > 0 && io) {
      for (const unlock of newUnlocks) {
        io.to(`user:${username}`).emit('badge:unlocked', unlock);
      }
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error.message);
    res.status(500).json({ error: 'Failed to fetch achievement progress' });
  }
});

async function fetchMergedPRCount(octokit, username) {
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:pr is:merged`,
      per_page: 1
    });
    return data.total_count;
  } catch { return 0; }
}

async function fetchYoloPRCount(octokit, username) {
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:pr is:merged review:none`,
      per_page: 1
    });
    return data.total_count;
  } catch { return 0; }
}

async function fetchQuickdrawCount(octokit, username) {
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} is:closed`,
      per_page: 100,
      sort: 'updated',
      order: 'desc'
    });

    let quickdraws = 0;
    for (const item of data.items) {
      if (item.closed_at && item.created_at) {
        const created = new Date(item.created_at).getTime();
        const closed = new Date(item.closed_at).getTime();
        if ((closed - created) / (1000 * 60) <= 5) quickdraws++;
      }
    }
    return quickdraws;
  } catch { return 0; }
}

async function fetchUserRepos(octokit, username) {
  try {
    const { data } = await octokit.rest.repos.listForUser({
      username, per_page: 100, sort: 'stars', direction: 'desc'
    });
    return data;
  } catch { return []; }
}

async function fetchCoAuthoredCommits(octokit, username) {
  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 10, sort: 'pushed', direction: 'desc'
    });

    let coAuthored = 0;
    for (const repo of repos.slice(0, 5)) {
      try {
        const { data: commits } = await octokit.rest.repos.listCommits({
          owner: repo.owner.login, repo: repo.name, author: username, per_page: 100
        });
        for (const commit of commits) {
          if (commit.commit.message.toLowerCase().includes('co-authored-by:')) coAuthored++;
        }
      } catch {}
    }
    return coAuthored;
  } catch { return 0; }
}

async function fetchDiscussionAnswers(octokit, username) {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          repositoryDiscussionComments(first: 100, onlyAnswers: true) {
            totalCount
          }
        }
      }
    `;
    const result = await octokit.graphql(query, { username });
    return result.user?.repositoryDiscussionComments?.totalCount || 0;
  } catch { return 0; }
}

async function fetchOpenSourcererCount(octokit, username) {
  try {
    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:pr is:merged -user:${username}`,
      per_page: 100
    });
    const uniqueRepos = new Set(data.items.map(item => item.repository_url));
    return uniqueRepos.size;
  } catch { return 0; }
}

function getCurrentTier(tiers, current) {
  let result = null;
  for (const tier of tiers) {
    if (current >= tier.threshold) result = tier;
  }
  return result;
}

function getNextTier(tiers, current) {
  for (const tier of tiers) {
    if (current < tier.threshold) return tier;
  }
  return null;
}
