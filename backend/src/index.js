import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Strategy as GitHubStrategy } from 'passport-github2';
import sessionFileStore from 'session-file-store';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { farmRouter, setFarmQueue, setFarmWorkerPool } from './routes/farm.js';
import { FarmQueue } from './queue.js';
import { WorkerPool } from './workers.js';
import './db.js';
import { achievementsRouter, setAchievementsIO } from './routes/achievements.js';
import { accountsRouter } from './routes/accounts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.BACKEND_PORT || 5005;
const BASE_URL = (process.env.BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', FRONTEND_URL, BASE_URL].filter(Boolean),
    credentials: true
  }
});

setAchievementsIO(io);

// Initialize queue and worker pool
const farmQueue = new FarmQueue({ maxWorkers: 2 });
const workerPool = new WorkerPool(farmQueue, io);
setFarmQueue(farmQueue);
setFarmWorkerPool(workerPool);

// Log queue events
farmQueue.on('enqueued', (id) => console.log(`[Queue] Enqueued: ${id}`));
farmQueue.on('started', (id) => console.log(`[Queue] Started: ${id}`));
farmQueue.on('completed', (id) => console.log(`[Queue] Completed: ${id}`));
farmQueue.on('error', (id, err) => console.log(`[Queue] Error: ${id} - ${err}`));

// Middleware
app.use(express.json());

const FileStore = sessionFileStore(session);

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', FRONTEND_URL, BASE_URL].filter(Boolean),
  credentials: true
}));

const isProduction = process.env.NODE_ENV === 'production';

const sessionMiddleware = session({
  store: new FileStore({
    path: './data/sessions',
    ttl: 86400,
    retries: 0
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Share session with Socket.io
io.engine.use(sessionMiddleware);

// Passport GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${BASE_URL}/auth/github/callback`,
  scope: ['repo', 'delete_repo']
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName || profile.username,
    avatar: profile._json.avatar_url,
    accessToken
  };
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Auth routes
app.get('/auth/github', (req, res, next) => {
  if (req.query.link === 'true' && req.isAuthenticated()) {
    req.session.linkMode = true;
    req.session.primaryUser = { ...req.user };
  }
  passport.authenticate('github')(req, res, next);
});

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    if (req.session.linkMode) {
      delete req.session.linkMode;
      const newAccount = { ...req.user };

      if (req.session.primaryUser) {
        const primary = req.session.primaryUser;
        delete req.session.primaryUser;

        if (!req.session.linkedAccounts) req.session.linkedAccounts = [];
        const exists = req.session.linkedAccounts.find(a => a.username === newAccount.username);
        if (!exists && newAccount.username !== primary.username) {
          req.session.linkedAccounts.push({
            id: newAccount.id,
            username: newAccount.username,
            avatar: newAccount.avatar,
            accessToken: newAccount.accessToken
          });
        }

        req.login(primary, (err) => {
          if (err) return res.redirect(`${FRONTEND_URL}/dashboard?error=link_failed`);
          res.redirect(`${FRONTEND_URL}/dashboard?linked=${newAccount.username}`);
        });
        return;
      }
    }
    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    const { accessToken, ...user } = req.user;
    const accounts = req.session.linkedAccounts || [];
    const safeAccounts = accounts.map(({ accessToken: _, ...a }) => a);
    res.json({ authenticated: true, user, linkedAccounts: safeAccounts });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// API routes
app.use('/api/achievements', requireAuth, achievementsRouter);
app.use('/api/farm', requireAuth, farmRouter);
app.use('/api/accounts', requireAuth, accountsRouter);

// Serve static frontend in production
const publicDir = join(__dirname, '..', 'public');

if (process.env.NODE_ENV === 'production' && existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/health') {
      return next();
    }
    res.sendFile(join(publicDir, 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const req = socket.request;
  if (req.session?.passport?.user) {
    const user = req.session.passport.user;
    socket.join(`user:${user.username}`);
    workerPool.setUserToken(user.username, user.accessToken);
  }

  socket.on('join', (username) => {
    socket.join(`user:${username}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`GitBadge-Auto Free running on http://localhost:${PORT}`);
});
