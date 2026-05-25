import { useState, useEffect } from 'react';
import api from './api';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/user', { withCredentials: true })
      .then(res => {
        if (res.data.authenticated) {
          setUser(res.data.user);
          setLinkedAccounts(res.data.linkedAccounts || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await api.post('/auth/logout', {}, { withCredentials: true });
    setUser(null);
    setLinkedAccounts([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="text-[#00ff41] font-mono text-sm" style={{ textShadow: '0 0 8px #00ff4180' }}>
            {'>'} INITIALIZING...
          </div>
          <div className="w-48 h-2 bg-[#1a3a1a] rounded-none overflow-hidden">
            <div className="h-full bg-[#00ff41] animate-pulse" style={{ width: '60%', boxShadow: '0 0 6px #00ff41' }} />
          </div>
          <p className="text-[10px] text-[#4a7a4a] font-mono">GITBADGE-AUTO FREE v3.0</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-mono text-[#00ff41]" style={{ textShadow: '0 0 10px #00ff4160' }}>
            GitBadge-Auto Free
          </h1>
          <p className="text-sm text-[#4a7a4a] font-mono">Open-source GitHub badge farming tool</p>
          <a
            href="/auth/github"
            className="inline-block px-6 py-3 bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] font-mono text-sm rounded-lg hover:bg-[#00ff41]/20 transition-all"
          >
            [ LOGIN WITH GITHUB ]
          </a>
          <p className="text-xs text-[#4a7a4a] font-mono mt-4">
            Free: Pull Shark • YOLO • Quickdraw
          </p>
          <a href="https://gitbadge-auto.onrender.com" className="text-xs text-[#ff9f1c] font-mono hover:underline">
            Want 40+ features? Try Pro →
          </a>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} linkedAccounts={linkedAccounts} onLogout={handleLogout} />;
}

export default App;

