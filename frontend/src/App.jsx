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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4 py-12">
        <div className="text-center space-y-6 mb-12">
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
        </div>

        {/* Pricing */}
        <div className="max-w-4xl w-full">
          <p className="text-[#00ff41] font-mono text-xs mb-6" style={{ textShadow: '0 0 5px #00ff4180' }}>{'>'} UPGRADE_TO_PRO</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'FREE', price: '$0', interval: '', desc: '// current plan', features: ['Pull Shark, YOLO, Quickdraw', '3 farms/day', '4 themes', 'Badge tracking'] },
              { label: 'MONTHLY', price: '$10', interval: '/mo', desc: '// full access', features: ['All 47+ features', 'Unlimited farming', 'All 18 themes', 'Token Hunter', 'Priority queue'] },
              { label: 'YEARLY', price: '$50', interval: '/yr', desc: '// save 58%', badge: 'POPULAR', features: ['Everything in Monthly', '12 months access', 'Save $70/year'] },
              { label: 'LIFETIME', price: '$100', interval: '', desc: '// pay once', badge: 'BEST', features: ['Pro forever', 'All future updates', 'Never pay again'] },
            ].map((plan) => (
              <div key={plan.label} className="border border-[#1a3a1a] rounded-md p-4 bg-[#0d1117]">
                {plan.badge && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 mb-2 inline-block">{plan.badge}</span>
                )}
                <p className="text-[10px] font-mono text-[#4a7a4a] mb-1">{plan.label}</p>
                <p className="text-xl font-mono font-bold text-[#00ff41]" style={{ textShadow: '0 0 8px #00ff4140' }}>{plan.price}<span className="text-[10px] text-[#4a7a4a]">{plan.interval}</span></p>
                <p className="text-[9px] font-mono text-[#4a7a4a] mb-2">{plan.desc}</p>
                <ul className="space-y-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-[10px] font-mono text-[#b8ffb8] flex items-center gap-1.5">
                      <span className="text-[#00ff41]">+</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <p className="text-[11px] font-mono text-[#4a7a4a]">SOURCE_CODE: <span className="text-[#00ff41]">$150</span> (includes lifetime pro)</p>
            <p className="text-[10px] font-mono text-[#4a7a4a] mt-2">// contact: Discord <span className="text-[#00ff41]">revice7463</span></p>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} linkedAccounts={linkedAccounts} onLogout={handleLogout} />;
}

export default App;

