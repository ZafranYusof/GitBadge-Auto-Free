import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProcessLog({ logs = [], isRunning = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0 && !isRunning) return null;

  return (
    <div className="mt-4 rounded-lg border border-[#1a3a1a] bg-[#0a0a0f] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1a3a1a] bg-[#0d1117]">
        <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#00ff41] animate-pulse' : 'bg-[#4a7a4a]'}`} />
        <span className="text-[10px] font-mono text-[#4a7a4a]">
          {isRunning ? 'PROCESSING...' : `COMPLETED (${logs.length} steps)`}
        </span>
      </div>
      <div ref={scrollRef} className="max-h-48 overflow-y-auto p-3 space-y-1">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-2"
            >
              <span className="text-[#00ff41] text-[10px] font-mono mt-0.5">{'>'}</span>
              <span className="text-[10px] font-mono text-[#b8ffb8] leading-relaxed">{log}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {isRunning && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-[10px] font-mono text-[#00ff41]"
          >
            {'>'} _
          </motion.div>
        )}
      </div>
    </div>
  );
}
