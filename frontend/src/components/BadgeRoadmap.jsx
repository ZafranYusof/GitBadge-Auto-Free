import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

const BADGE_DATA = [
  {
    id: 'pull-shark',
    name: 'Pull Shark',
    icon: '🦈',
    description: 'PRs merged',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
      { name: 'bronze', threshold: 16, color: '#cd7f32' },
      { name: 'silver', threshold: 128, color: '#c0c0c0' },
      { name: 'gold', threshold: 512, color: '#ffd700' },
    ],
    farmable: true,
    farmType: 'pull-shark',
  },
  {
    id: 'yolo',
    name: 'YOLO',
    icon: '🤠',
    description: 'Merge without review',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
    ],
    farmable: true,
    farmType: 'yolo',
  },
  {
    id: 'quickdraw',
    name: 'Quickdraw',
    icon: '⚡',
    description: 'Close issue/PR within 5min of opening',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
    ],
    farmable: true,
    farmType: 'quickdraw',
  },
  {
    id: 'pair-extraordinaire',
    name: 'Pair Extraordinaire',
    icon: '👯',
    description: 'Co-authored commits on merged PR',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
      { name: 'bronze', threshold: 10, color: '#cd7f32' },
      { name: 'silver', threshold: 24, color: '#c0c0c0' },
      { name: 'gold', threshold: 48, color: '#ffd700' },
    ],
    farmable: true,
    farmType: 'pair-extraordinaire',
  },
  {
    id: 'galaxy-brain',
    name: 'Galaxy Brain',
    icon: '🧠',
    description: 'Accepted discussion answer',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
      { name: 'bronze', threshold: 8, color: '#cd7f32' },
      { name: 'silver', threshold: 16, color: '#c0c0c0' },
      { name: 'gold', threshold: 32, color: '#ffd700' },
    ],
    farmable: true,
    farmType: 'galaxy-brain',
  },
  {
    id: 'starstruck',
    name: 'Starstruck',
    icon: '🌟',
    description: 'Repo with many stars',
    tiers: [
      { name: 'default', threshold: 16, color: '#4a7a4a' },
      { name: 'bronze', threshold: 128, color: '#cd7f32' },
      { name: 'silver', threshold: 512, color: '#c0c0c0' },
      { name: 'gold', threshold: 4096, color: '#ffd700' },
    ],
    farmable: true,
    farmType: 'starstruck',
  },
  {
    id: 'open-sourcerer',
    name: 'Open Sourcerer',
    icon: '🧙',
    description: "PRs merged in other people's repos",
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
    ],
    farmable: true,
    farmType: 'open-sourcerer',
  },
  {
    id: 'heart-on-your-sleeve',
    name: 'Heart On Your Sleeve',
    icon: '❤️',
    description: 'React to something on GitHub',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
    ],
    farmable: false,
  },
  {
    id: 'arctic-code-vault',
    name: 'Arctic Code Vault Contributor',
    icon: '🧊',
    description: 'Contributed to 2020 Arctic Code Vault',
    tiers: [],
    farmable: false,
    special: true,
  },
  {
    id: 'mars-2020',
    name: 'Mars 2020 Contributor',
    icon: '🚀',
    description: 'Contributed to Mars 2020 Helicopter Mission',
    tiers: [],
    farmable: false,
    special: true,
  },
  {
    id: 'public-sponsor',
    name: 'Public Sponsor',
    icon: '💖',
    description: 'Sponsor an open source contributor',
    tiers: [
      { name: 'default', threshold: 1, color: '#4a7a4a' },
    ],
    farmable: false,
  },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unlocked', label: 'Unlocked' },
  { id: 'locked', label: 'Locked' },
  { id: 'farmable', label: 'Farmable' },
];

function matchAchievement(badge, achievements) {
  if (!achievements || !achievements.length) return null;
  return achievements.find(a =>
    a.name.toLowerCase().replace(/[\s-_]/g, '') === badge.name.toLowerCase().replace(/[\s-_]/g, '')
  );
}

function getBadgeStatus(badge, achievements) {
  const match = matchAchievement(badge, achievements);
  if (!match) return { unlocked: false, current: 0, currentTier: null, nextTier: badge.tiers[0] || null, progress: 0 };

  const current = match.current || 0;
  const unlocked = current > 0 || badge.special;

  let currentTier = null;
  let nextTier = null;

  for (let i = badge.tiers.length - 1; i >= 0; i--) {
    if (current >= badge.tiers[i].threshold) {
      currentTier = badge.tiers[i];
      nextTier = badge.tiers[i + 1] || null;
      break;
    }
  }

  if (!currentTier && badge.tiers.length > 0) {
    nextTier = badge.tiers[0];
  }

  let progress = 0;
  if (nextTier) {
    progress = Math.min((current / nextTier.threshold) * 100, 100);
  } else if (currentTier) {
    progress = 100;
  }

  return { unlocked, current, currentTier, nextTier, progress };
}

export default function BadgeRoadmap({ achievements }) {
  const [filter, setFilter] = useState('all');
  const [showGuide, setShowGuide] = useState(false);
  const { isDark } = useTheme();

  const badgesWithStatus = useMemo(() => {
    return BADGE_DATA.map(badge => ({
      ...badge,
      status: getBadgeStatus(badge, achievements),
    }));
  }, [achievements]);

  const filteredBadges = useMemo(() => {
    switch (filter) {
      case 'unlocked':
        return badgesWithStatus.filter(b => b.status.unlocked);
      case 'locked':
        return badgesWithStatus.filter(b => !b.status.unlocked);
      case 'farmable':
        return badgesWithStatus.filter(b => b.farmable);
      default:
        return badgesWithStatus;
    }
  }, [badgesWithStatus, filter]);

  const stats = useMemo(() => ({
    total: badgesWithStatus.length,
    unlocked: badgesWithStatus.filter(b => b.status.unlocked).length,
    maxed: badgesWithStatus.filter(b => b.status.progress === 100 && b.tiers.length > 0).length,
  }), [badgesWithStatus]);

  return (
    <div className="space-y-5">
      {/* How to Use Guide */}
      <div className="mb-4 rounded-lg border border-[#1a3a1a] bg-[#0d1117]">
        <button onClick={() => setShowGuide(!showGuide)} className="w-full px-4 py-2 text-left text-sm font-medium flex items-center justify-between text-[#00ff41]">
          <span>📖 How to Use</span>
          <span>{showGuide ? '▲' : '▼'}</span>
        </button>
        {showGuide && (
          <div className="px-4 pb-3 text-xs space-y-1 text-[#b8ffb8]">
            <p>1. View all GitHub badges and their tier requirements</p>
            <p>2. See your current progress toward each badge</p>
            <p>3. Click a badge for detailed tier breakdown</p>
            <p>4. Track progress over time as you farm</p>
          </div>
        )}
      </div>

      {/* Page header */}
      <div>
        <h2 className={`text-2xl ${isDark ? 'text-[#00ff41] glow-green font-mono' : 'text-gray-900 font-bold'}`}>
          {isDark ? '> BADGE_ROADMAP' : 'Badge Roadmap'}
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
          {isDark ? '// track progress towards all GitHub achievements' : 'Track progress towards all GitHub achievements'}
        </p>
      </div>

      {/* Stats bar */}
      <div className={`flex items-center gap-4 p-3 rounded-xl ${isDark ? 'bg-[#0d0d12] border border-[#1a3a1a]' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isDark ? 'text-[#00ff41] font-mono' : 'text-green-600'}`}>{stats.unlocked}</span>
          <span className={`text-[11px] ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
            {isDark ? '/ ' + stats.total + ' UNLOCKED' : `/ ${stats.total} unlocked`}
          </span>
        </div>
        <div className={`w-px h-5 ${isDark ? 'bg-[#1a3a1a]' : 'bg-gray-200'}`} />
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isDark ? 'text-[#ffd700] font-mono' : 'text-yellow-600'}`}>{stats.maxed}</span>
          <span className={`text-[11px] ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
            {isDark ? 'MAXED' : 'maxed out'}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={`flex gap-1 p-1 rounded-lg ${isDark ? 'bg-[#0d0d12] border border-[#1a3a1a]' : 'bg-gray-100'}`}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              filter === f.id
                ? isDark
                  ? 'bg-[#00ff4115] text-[#00ff41] border border-[#00ff4130] font-mono'
                  : 'bg-white text-gray-900 shadow-sm'
                : isDark
                  ? 'text-[#4a7a4a] hover:text-[#b8ffb8] font-mono'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isDark ? f.label.toUpperCase() : f.label}
          </button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge, i) => (
            <BadgeCard key={badge.id} badge={badge} index={i} isDark={isDark} />
          ))}
        </AnimatePresence>
      </div>

      {filteredBadges.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
          {isDark ? '> NO_RESULTS_FOUND' : 'No badges match this filter'}
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge, index, isDark }) {
  const { status, farmable, special } = badge;
  const { unlocked, current, currentTier, nextTier, progress } = status;

  const tierColor = currentTier?.color || '#4a7a4a';
  const nextTierColor = nextTier?.color || tierColor;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
        isDark
          ? `bg-[#0a0a0f] border-[#1a3a1a] ${!unlocked ? 'opacity-60' : ''}`
          : `bg-white border-gray-200 ${!unlocked ? 'opacity-60 grayscale-[30%]' : ''}`
      }`}
      style={isDark && unlocked ? { borderColor: `${tierColor}30` } : undefined}
    >
      {/* Unlocked indicator */}
      {unlocked && (
        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${
          isDark ? 'bg-[#00ff41]' : 'bg-green-500'
        }`}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Special badge indicator */}
      {special && (
        <div className={`absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded ${
          isDark ? 'bg-[#ffd70020] text-[#ffd700] font-mono' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {isDark ? 'SPECIAL' : 'Special'}
        </div>
      )}

      {/* Badge header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
          isDark ? 'border border-[#1a3a1a]' : 'bg-gray-100'
        }`} style={isDark ? { background: `${tierColor}08` } : undefined}>
          {badge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-[#e0ffe0] font-mono' : 'text-gray-900'}`}>
            {badge.name}
          </h3>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
            {badge.description}
          </p>
        </div>
      </div>

      {/* Current tier */}
      {currentTier && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
            isDark ? 'font-mono' : ''
          }`} style={{ color: tierColor, background: `${tierColor}15`, border: `1px solid ${tierColor}25` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColor }} />
            {currentTier.name}
          </span>
        </div>
      )}

      {/* Progress section */}
      {badge.tiers.length > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className={`text-xs font-mono ${isDark ? 'text-[#b8ffb8]' : 'text-gray-700'}`}>
              {current}
              <span className={isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}> / {nextTier ? nextTier.threshold : 'MAX'}</span>
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}`}>
              {Math.round(progress)}%
            </span>
          </div>
          {isDark ? (
            <div className="retro-progress rounded-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: index * 0.04 + 0.2, duration: 0.6 }}
                className="retro-progress-bar"
                style={{ color: nextTierColor }}
              />
            </div>
          ) : (
            <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: index * 0.04 + 0.2, duration: 0.6 }}
                className="h-full rounded-full"
                style={{ backgroundColor: nextTierColor }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tier dots */}
      {badge.tiers.length > 1 && (
        <div className="flex items-center gap-1.5 mb-3">
          {badge.tiers.map((tier, i) => {
            const achieved = current >= tier.threshold;
            return (
              <div key={tier.name} className="flex items-center gap-1" title={`${tier.name}: ${tier.threshold}`}>
                <div
                  className={`w-3 h-3 rounded-full border-[1.5px] transition-all ${achieved ? '' : 'opacity-30'}`}
                  style={{
                    backgroundColor: achieved ? tier.color : 'transparent',
                    borderColor: tier.color,
                  }}
                />
                {i < badge.tiers.length - 1 && (
                  <div className={`w-3 h-px ${isDark ? 'bg-[#1a3a1a]' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Next tier requirement */}
      {nextTier && (
        <p className={`text-[10px] mb-3 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
          {isDark ? `> NEXT: ${nextTier.name.toUpperCase()} @ ${nextTier.threshold}` : `Next: ${nextTier.name} at ${nextTier.threshold}`}
        </p>
      )}

      {/* Farm button */}
      {farmable && !special && (
        <button
          onClick={() => {
            // Navigate to farm tab
            const event = new CustomEvent('navigate-tab', { detail: 'farm' });
            window.dispatchEvent(event);
          }}
          className={`w-full py-2 px-3 rounded-lg text-[11px] font-medium transition-all ${
            isDark
              ? 'bg-[#00ff4108] border border-[#00ff4130] text-[#00ff41] hover:bg-[#00ff4115] font-mono'
              : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
          }`}
        >
          {isDark ? '[ FARM THIS ]' : '🌾 Farm this badge'}
        </button>
      )}
    </motion.div>
  );
}
