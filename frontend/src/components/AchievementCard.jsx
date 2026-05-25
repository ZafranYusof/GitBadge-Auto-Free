import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

const tierConfig = {
  bronze: { color: '#CD7F32', glow: 'rgba(205, 127, 50, 0.3)', label: 'BRONZE' },
  silver: { color: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.3)', label: 'SILVER' },
  gold: { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.35)', label: 'GOLD' },
  diamond: { color: '#B9F2FF', glow: 'rgba(185, 242, 255, 0.35)', label: 'DIAMOND' }
};

export default function AchievementCard({ achievement, index }) {
  const { name, icon, description, current, currentTier, nextTier, progress, tiers } = achievement;
  const { isDark } = useTheme();

  const tierColor = currentTier ? tierConfig[currentTier.name]?.color || '#4a7a4a' : '#4a7a4a';
  const nextTierColor = nextTier ? tierConfig[nextTier.name]?.color || tierColor : tierColor;
  const tierGlow = currentTier ? tierConfig[currentTier.name]?.glow || 'transparent' : 'transparent';
  const clampedProgress = Math.min(progress, 100);

  if (!isDark) {
    // Light theme - clean modern card
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="relative overflow-hidden rounded-2xl border bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg p-5 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-gray-100">{icon}</div>
            <div>
              <h3 className="font-semibold text-[15px] text-gray-900">{name}</h3>
              <p className="text-xs mt-0.5 text-gray-500">{description}</p>
            </div>
          </div>
        </div>
        {currentTier && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md"
              style={{ color: tierColor, background: `${tierColor}15`, border: `1px solid ${tierColor}25` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColor }} />
              {currentTier.name}
            </span>
          </div>
        )}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-sm font-mono font-medium text-gray-700">{current}<span className="text-gray-400"> / {nextTier ? nextTier.threshold : 'MAX'}</span></span>
            <span className="text-xs font-semibold text-gray-500">{Math.round(clampedProgress)}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100">
            <motion.div initial={{ width: 0 }} animate={{ width: `${clampedProgress}%` }} transition={{ delay: index * 0.08 + 0.3, duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: nextTierColor }} />
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {tiers.map((tier, i) => {
            const achieved = current >= tier.threshold;
            const config = tierConfig[tier.name] || {};
            return (
              <div key={tier.name} className="flex items-center gap-1" title={`${tier.name}: ${tier.threshold}`}>
                <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] ${achieved ? 'scale-100' : 'scale-90 opacity-30'}`}
                  style={{ backgroundColor: achieved ? config.color : 'transparent', borderColor: config.color }} />
                {i < tiers.length - 1 && <div className="w-3 h-px bg-gray-200" />}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Dark retro theme - arcade high-score style
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      className="relative overflow-hidden retro-card rounded achievement-shine group"
      style={{
        borderColor: currentTier ? `${tierColor}30` : '#1a3a1a',
      }}
    >
      {/* Top tier accent line */}
      {currentTier && (
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)`, boxShadow: `0 0 10px ${tierGlow}` }} />
      )}

      {/* Card header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a3a1a]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#4a7a4a]">{'>'}</span>
          <span className="text-[10px] font-mono text-[#b8ffb8] uppercase tracking-wider">{name}</span>
        </div>
        {currentTier && (
          <span className="arcade-score px-2 py-0.5 rounded-sm"
            style={{ color: tierColor, background: `${tierColor}12`, border: `1px solid ${tierColor}30`, textShadow: `0 0 5px ${tierGlow}` }}>
            {tierConfig[currentTier.name]?.label || currentTier.name.toUpperCase()}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Icon and description */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded flex items-center justify-center text-xl border border-[#1a3a1a]"
            style={{ background: `${tierColor}08`, boxShadow: currentTier ? `0 0 10px ${tierGlow}` : 'none' }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono text-[#4a7a4a] leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Score display - arcade style */}
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-mono">
            <span className="text-lg font-bold text-[#00ff41]" style={{ textShadow: '0 0 8px #00ff4160' }}>
              {current}
            </span>
            <span className="text-xs text-[#4a7a4a]"> / {nextTier ? nextTier.threshold : 'MAX'}</span>
          </div>
          <span className="arcade-score" style={{ color: nextTierColor, textShadow: `0 0 5px ${nextTierColor}60` }}>
            {Math.round(clampedProgress)}%
          </span>
        </div>

        {/* Retro progress bar */}
        <div className="retro-progress rounded-sm mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
            className="retro-progress-bar"
            style={{ color: nextTierColor }}
          />
        </div>

        {/* Tier progression dots */}
        <div className="flex items-center gap-1.5 pt-1">
          {tiers.map((tier, i) => {
            const achieved = current >= tier.threshold;
            const config = tierConfig[tier.name] || {};
            return (
              <div key={tier.name} className="flex items-center gap-1" title={`${tier.name}: ${tier.threshold}`}>
                <div
                  className={`w-3 h-3 rounded-sm border transition-all ${achieved ? '' : 'opacity-30'}`}
                  style={{
                    backgroundColor: achieved ? config.color : 'transparent',
                    borderColor: config.color,
                    boxShadow: achieved ? `0 0 6px ${config.glow}` : 'none'
                  }}
                />
                {i < tiers.length - 1 && (
                  <div className="w-2 h-px" style={{ background: achieved ? config.color : '#1a3a1a' }} />
                )}
              </div>
            );
          })}
          <span className="ml-auto text-[9px] font-mono text-[#4a7a4a]">
            LVL {tiers.filter(t => current >= t.threshold).length}/{tiers.length}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
