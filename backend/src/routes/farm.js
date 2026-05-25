import { Router } from 'express';
import { getOctokitFromToken } from '../github.js';
import { createSession, getSessionOptions, updateSessionStatus } from '../db.js';

export const farmRouter = Router();

let workerPool = null;
let farmQueue = null;

export function setFarmWorkerPool(pool) { workerPool = pool; }
export function setFarmQueue(queue) { farmQueue = queue; }

// Pull Shark
farmRouter.post('/pull-shark', (req, res) => {
  const { count = 5, delay = 2000, repo = '', visibility = 'private' } = req.body;
  const username = req.user.username;
  const sessionId = `${username}-pullshark-${Date.now()}`;

  if (workerPool) workerPool.setUserToken(username, req.user.accessToken);

  const session = createSession({
    id: sessionId,
    type: 'pull-shark',
    username,
    count,
    delay,
    repoVisibility: visibility,
    useExistingRepo: !!repo,
    existingRepo: repo,
    options: { repo: repo || null }
  });

  if (farmQueue) farmQueue.enqueue(sessionId);

  res.json({ sessionId, message: `Queued Pull Shark farm: ${count} PRs`, session });
});

// YOLO
farmRouter.post('/yolo', (req, res) => {
  const { count = 5, delay = 2000, repo = '', visibility = 'private' } = req.body;
  const username = req.user.username;
  const sessionId = `${username}-yolo-${Date.now()}`;

  if (workerPool) workerPool.setUserToken(username, req.user.accessToken);

  const session = createSession({
    id: sessionId,
    type: 'yolo',
    username,
    count,
    delay,
    repoVisibility: visibility,
    useExistingRepo: !!repo,
    existingRepo: repo,
    options: { repo: repo || null }
  });

  if (farmQueue) farmQueue.enqueue(sessionId);

  res.json({ sessionId, message: `Queued YOLO farm: ${count} PRs`, session });
});

// Quickdraw
farmRouter.post('/quickdraw', (req, res) => {
  const { count = 5, delay = 2000, repo = '', visibility = 'private' } = req.body;
  const username = req.user.username;
  const sessionId = `${username}-quickdraw-${Date.now()}`;

  if (workerPool) workerPool.setUserToken(username, req.user.accessToken);

  const session = createSession({
    id: sessionId,
    type: 'quickdraw',
    username,
    count,
    delay,
    repoVisibility: visibility,
    useExistingRepo: !!repo,
    existingRepo: repo,
    options: { repo: repo || null }
  });

  if (farmQueue) farmQueue.enqueue(sessionId);

  res.json({ sessionId, message: `Queued Quickdraw farm: ${count} issues`, session });
});

// Cancel a session
farmRouter.post('/cancel/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (farmQueue) farmQueue.cancel(sessionId);
  updateSessionStatus(sessionId, 'cancelled');
  res.json({ success: true });
});

// Pause a session
farmRouter.post('/pause/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (farmQueue) farmQueue.pause(sessionId);
  updateSessionStatus(sessionId, 'paused');
  res.json({ success: true });
});

// Resume a session
farmRouter.post('/resume/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  updateSessionStatus(sessionId, 'queued');
  if (farmQueue) farmQueue.enqueue(sessionId);
  res.json({ success: true });
});
