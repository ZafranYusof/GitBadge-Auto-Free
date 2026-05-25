import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';
import { useSocket } from '../hooks/useSocket';
import AchievementCard from './AchievementCard';
import ActivityLog from './ActivityLog';
import FarmControls from './FarmControls';
import FarmHistory from './FarmHistory';
import FarmQueue from './FarmQueue';
import ThemeSelector from './ThemeSelector';
import ThemeToggle from './ThemeToggle';
import BadgeRoadmap from './BadgeRoadmap';
import BadgeToast from './BadgeToast';
import ContributionGraph from './ContributionGraph';
import AccountSwitcher from './AccountSwitcher';
import RateLimitIndicator from './RateLimitIndicator';
import SafetyDashboard from './SafetyDashboard';
import ErrorBoundary from './ErrorBoundary';

const navSections = [
  {
    label: 'Overview',
    items: [
      { id: 'achievements', icon: '🏅', label: 'Badges' },
      { id: 'roadmap', icon: '🗺️', label: 'Roadmap' },
      { id: 'contributions', icon: '📅', label: 'Graph' },
    ]
  },
  {
    label: 'Farming',
    items: [
      { id: 'farm', icon: '🌾', label: 'Farm' },
      { id: 'queue', icon: '📦', label: 'Queue' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'history', icon: '📜', label: 'History' },
      { id: 'themes', icon: '🎨', label: 'Themes' },
      { id: 'safety', icon: '🛡️', label: 'Safety' },
      { id: 'log', icon: '📝', label: 'Log' },
    ]
  }
];

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 }
};

export default function Dashboard({ user, linkedAccounts, onLogout }) {
  const [achievements, setAchievements] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('achievements');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const { farmProgress, badgeUnlock } = useSocket(user?.username);

  useEffect(() => {
    fetchAchievements();
    const achievementInterval = setInterval(fetchAchievements, 30000);
    const logInterval = setInterval(fetchLogs, 5000);
    return () => { clearInterval(achievementInterval); clearInterval(logInterval); };
  }, []);

  useEffect(() => {
    if (farmProgress?.completed > 0) {
      fetchAchievements();
    }
  }, [farmProgress?.completed]);

  const fetchAchievements = async () => {
    try {
      const res = await axios.get('/api/achievements/progress', { withCredentials: true });
      setAchievements(res.data);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/farm/logs', { withCredentials: true });
      setLogs(res.data || []);
    } catch {}
  };

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[var(--retro-bg)]' : 'bg-gray-50'}`}>
      {/* Badge Toast */}
      <BadgeToast unlock={badgeUnlock} />

      {/* Mobile header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 ${isDark ? 'bg-[var(--retro-surface)] border-b border-[var(--retro-border)]' : 'bg-white border-b border-gray-200'}`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          <span className="text-xl">☰</span>
        </button>
        <span className={`text-sm font-mono ${isDark ? 'text-[var(--retro-green)]' : 'text-gray-900'}`}>GitBadge-Auto Free</span>
        <ThemeToggle />
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 overflow-y-auto z-40 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-[var(--retro-surface)] border-r border-[var(--retro-border)]' : 'bg-white border-r border-gray-200'}`}>
        <div className="p-4">
          {/* User info */}
          <div className={`flex items-center gap-3 mb-6 p-3 rounded-lg ${isDark ? 'bg-[var(--retro-bg)]' : 'bg-gray-50'}`}>
            {user?.avatar && <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-mono truncate ${isDark ? 'text-[var(--retro-text)]' : 'text-gray-900'}`}>{user?.username}</p>
              <p className={`text-xs ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-400'}`}>Free</p>
            </div>
          </div>

          <AccountSwitcher linkedAccounts={linkedAccounts} />
          <RateLimitIndicator />

          {/* Navigation */}
          <nav className="mt-4 space-y-4">
            {navSections.map(section => (
              <div key={section.label}>
                <p className={`text-[10px] font-mono uppercase tracking-wider mb-1.5 px-2 ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-400'}`}>
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        activeTab === item.id
                          ? isDark ? 'bg-[var(--retro-green)]/10 text-[var(--retro-green)] border border-[var(--retro-green)]/20' : 'bg-green-50 text-green-700 border border-green-200'
                          : isDark ? 'text-[var(--retro-text-dim)] hover:bg-[var(--retro-bg)] hover:text-[var(--retro-text)]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Pro upsell */}
          <div className={`mt-6 p-3 rounded-lg border ${isDark ? 'border-[var(--retro-border)] bg-[var(--retro-bg)]' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs font-mono mb-1 ${isDark ? 'text-[var(--retro-amber)]' : 'text-amber-600'}`}>
              {isDark ? '> UPGRADE_TO_PRO' : '⭐ Upgrade to Pro'}
            </p>
            <p className={`text-[10px] ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-400'}`}>
              Unlock 40+ features, unlimited farming, all themes
            </p>
            <a href="https://gitbadge-auto.onrender.com" target="_blank" rel="noopener noreferrer" className={`block mt-2 text-center text-xs py-1.5 rounded ${isDark ? 'bg-[var(--retro-amber)]/10 text-[var(--retro-amber)] border border-[var(--retro-amber)]/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              Learn More →
            </a>
          </div>

          {/* Logout */}
          <button onClick={onLogout} className={`w-full mt-4 text-xs font-mono py-2 rounded-lg ${isDark ? 'text-[var(--retro-text-muted)] hover:text-[var(--retro-red)]' : 'text-gray-400 hover:text-red-500'}`}>
            {isDark ? '[ LOGOUT ]' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <ErrorBoundary>
          <AnimatePresence mode="wait">
            {activeTab === 'achievements' && (
              <motion.div key="achievements" {...pageTransition}>
                <div className="mb-6">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-[var(--retro-green)] font-mono' : 'text-gray-900'}`}>
                    {isDark ? '> BADGE_TRACKER' : 'Badge Tracker'}
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-[var(--retro-text-muted)] font-mono' : 'text-gray-500'}`}>
                    {isDark ? '// Track progress across all GitHub achievements' : 'Track progress across all GitHub achievements'}
                  </p>
                </div>
                {loading ? (
                  <p className={`text-sm ${isDark ? 'text-[var(--retro-text-muted)] font-mono' : 'text-gray-400'}`}>Loading...</p>
                ) : achievements.length === 0 ? (
                  <p className={`text-sm ${isDark ? 'text-[var(--retro-text-muted)] font-mono' : 'text-gray-400'}`}>No achievements data</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, i) => (
                      <AchievementCard key={achievement.id} achievement={achievement} index={i} />
                    ))}
                  </div>
                )}
                <BadgeRoadmap achievements={achievements} />
              </motion.div>
            )}

            {activeTab === 'roadmap' && (
              <motion.div key="roadmap" {...pageTransition}>
                <BadgeRoadmap achievements={achievements} />
              </motion.div>
            )}

            {activeTab === 'contributions' && (
              <motion.div key="contributions" {...pageTransition}>
                <ContributionGraph />
              </motion.div>
            )}

            {activeTab === 'farm' && (
              <motion.div key="farm" {...pageTransition}>
                <FarmControls farmProgress={farmProgress} />
              </motion.div>
            )}

            {activeTab === 'queue' && (
              <motion.div key="queue" {...pageTransition}>
                <FarmQueue />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" {...pageTransition}>
                <FarmHistory />
              </motion.div>
            )}

            {activeTab === 'themes' && (
              <motion.div key="themes" {...pageTransition}>
                <ThemeSelector />
              </motion.div>
            )}

            {activeTab === 'safety' && (
              <motion.div key="safety" {...pageTransition}>
                <SafetyDashboard />
              </motion.div>
            )}

            {activeTab === 'log' && (
              <motion.div key="log" {...pageTransition}>
                <ActivityLog logs={logs} />
              </motion.div>
            )}
          </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
