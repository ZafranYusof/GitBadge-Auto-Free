import { Router } from 'express';

export const accountsRouter = Router();

// Get linked accounts
accountsRouter.get('/', (req, res) => {
  const accounts = req.session.linkedAccounts || [];
  const safeAccounts = accounts.map(({ accessToken, ...a }) => a);
  res.json({ primary: { username: req.user.username, avatar: req.user.avatar }, linked: safeAccounts });
});

// Link a new account
accountsRouter.post('/link', (req, res) => {
  const { username, avatar, accessToken, id } = req.body;
  if (!username || !accessToken) {
    return res.status(400).json({ error: 'Missing account data' });
  }

  if (!req.session.linkedAccounts) {
    req.session.linkedAccounts = [];
  }

  const exists = req.session.linkedAccounts.find(a => a.username === username);
  if (exists) {
    return res.status(400).json({ error: 'Account already linked' });
  }

  req.session.linkedAccounts.push({ id, username, avatar, accessToken });
  res.json({ success: true });
});

// Remove a linked account
accountsRouter.delete('/:username', (req, res) => {
  const { username } = req.params;
  if (!req.session.linkedAccounts) {
    return res.status(404).json({ error: 'No linked accounts' });
  }

  req.session.linkedAccounts = req.session.linkedAccounts.filter(a => a.username !== username);
  res.json({ success: true });
});

// Switch active account
accountsRouter.post('/switch/:username', (req, res) => {
  const { username } = req.params;

  if (username === req.user.username) {
    return res.json({ success: true, active: req.user.username });
  }

  const linked = (req.session.linkedAccounts || []).find(a => a.username === username);
  if (!linked) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const currentUser = { ...req.user };
  req.session.linkedAccounts = req.session.linkedAccounts.filter(a => a.username !== username);
  req.session.linkedAccounts.push({
    id: currentUser.id,
    username: currentUser.username,
    avatar: currentUser.avatar,
    accessToken: currentUser.accessToken
  });

  req.user.id = linked.id;
  req.user.username = linked.username;
  req.user.avatar = linked.avatar;
  req.user.accessToken = linked.accessToken;
  req.user.displayName = linked.username;

  req.login(req.user, (err) => {
    if (err) return res.status(500).json({ error: 'Switch failed' });
    res.json({ success: true, active: linked.username });
  });
});
