import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

function ToastItem({ unlock, onDismiss, isDark }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss(unlock.timestamp);
    }, 3000);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`pointer-events-auto max-w-sm rounded-xl border p-4 shadow-2xl backdrop-blur-sm cursor-pointer ${
        isDark
          ? 'bg-[#0a0a0f]/95 border-[#00ff4140] shadow-[0_0_30px_rgba(0,255,65,0.15)]'
          : 'bg-white/95 border-gray-200 shadow-xl'
      }`}
      onClick={() => onDismiss(unlock.timestamp)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isDark ? 'bg-[#00ff4115] border border-[#00ff4130]' : 'bg-green-50 border border-green-100'
        }`}>
          <span className="text-2xl">{unlock.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${
              isDark ? 'text-[#00ff41] font-mono' : 'text-green-600'
            }`}>
              {isDark ? '🏆 BADGE UNLOCKED' : '🏆 Badge Unlocked!'}
            </span>
          </div>
          <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-[#e0ffe0] font-mono' : 'text-gray-900'}`}>
            {unlock.achievementName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: unlock.tierColor }}
            />
            <span className={`text-xs capitalize ${isDark ? 'text-[#b8ffb8] font-mono' : 'text-gray-600'}`}>
              {unlock.tier} tier
            </span>
            <span className={`text-[10px] ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
              · {unlock.current} total
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(unlock.timestamp); }}
          className={`p-1 rounded transition-colors flex-shrink-0 ${
            isDark ? 'hover:bg-white/[0.05] text-[#4a7a4a]' : 'hover:bg-gray-100 text-gray-400'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function BadgeToast({ unlocks, onDismiss }) {
  const { isDark } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {unlocks.map((unlock) => (
          <ToastItem key={unlock.timestamp} unlock={unlock} onDismiss={onDismiss} isDark={isDark} />
        ))}
      </AnimatePresence>
    </div>
  );
}
