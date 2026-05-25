# GitBadge-Auto Free

Open-source GitHub badge farming tool. Automate your way to Pull Shark, YOLO, and Quickdraw badges.

![GitHub](https://img.shields.io/badge/GitHub-Badge_Farmer-green?style=for-the-badge&logo=github)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-3.0.0-purple?style=for-the-badge)

## Live Demo

https://gitbadge-auto-free.onrender.com

## Features

- **Pull Shark** — Auto-create branches, PRs, and merge them
- **YOLO** — Merge PRs without review for the YOLO badge
- **Quickdraw** — Open and close issues within 5 minutes
- **Badge Tracker** — Real-time progress across all GitHub achievements
- **Badge Roadmap** — Visual progress toward next tier
- **Contribution Graph** — View your GitHub contribution history
- **Farm Queue** — Queue multiple farm jobs
- **4 Themes** — Hacker, Light, Dark, Midnight
- **Account Switcher** — Link and switch between GitHub accounts
- **Safety Dashboard** — Monitor farming activity
- **Farm History** — Track all past farming sessions
- **Real-time Progress** — Live updates via WebSocket

## Setup

### Prerequisites
- Node.js 18+
- GitHub OAuth App ([create one here](https://github.com/settings/developers))

### 1. Clone

```bash
git clone https://github.com/ZafranYusof/GitBadge-Auto-Free.git
cd GitBadge-Auto-Free
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment

Create `backend/.env`:

```env
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret
SESSION_SECRET=any_random_string
BASE_URL=http://localhost:5005
FRONTEND_URL=http://localhost:5173
```

### 4. Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 and login with GitHub.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS + Framer Motion
- **Backend:** Express + Passport (GitHub OAuth) + Socket.io
- **Database:** SQLite (better-sqlite3)
- **API:** GitHub REST + GraphQL via Octokit

## Deploy to Render

1. Fork this repo
2. Create a new Web Service on [Render](https://render.com)
3. Connect your fork
4. Set environment variables (see `render.yaml`)
5. Deploy!

**Contact:** Discord `revice7463`

## Want More

**GitBadge-Auto Pro** unlocks 47+ features:

- Galaxy Brain, Starstruck, Pair Extraordinaire farming
- Token Hunter (scan leaked tokens)
- Ghost Followers & Star Boost
- Shadow Network (multi-account coordination)
- Graph Painter (pixel art on contribution graph)
- Fake Maintainer (auto-respond issues, auto-merge PRs)
- Social Proof Generator
- Invisible Repo (hidden repos that count for badges)
- Fingerprint Spoofer (avoid account linking detection)
- Repo Insurance (auto-backup to GitLab/branches)
- Account Health Score (ban risk assessment)
- SEO Backlinks & GitHub SEO Optimizer
- Stalker Dashboard & Repo Necromancy
- Commit Rewriter & Laundering
- Actions Farm (automated CI farming)
- Smart Farm AI & Scheduler
- 18 Themes with full design system
- And much more...

## License

MIT — do whatever you want with it.

## Contributing

PRs welcome! Open an issue first to discuss what you'd like to change.
