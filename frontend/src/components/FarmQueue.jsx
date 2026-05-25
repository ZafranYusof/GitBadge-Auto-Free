import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useTheme } from '../hooks/useTheme';

export default function FarmQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/api/farm/sessions', { withCredentials: true });
      setQueue(res.data || []);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (sessionId) => {
    try {
      await api.post(`/api/farm/stop/${sessionId}`, {}, { withCredentials: true });
      fetchQueue();
    } catch (err) {}
  };

  const handleCancel = async (sessionId) => {
    try {
      await api.post(`/api/farm/stop/${sessionId}`, {}, { withCredentials: true });
      fetchQueue();
    } catch (err) {}
  };

  const getStatusColor = (status) => {
    if (isDark) {
      switch (status) {
        case 'running': return 'text-[#00ff41]';
        case 'completed': return 'text-[#4a7a4a]';
        case 'error': return 'text-[#ff0055]';
        case 'cancelled': return 'text-[#ff9f1c]';
        default: return 'text-[#4a7a4a]';
      }
    }
    switch (status) {
      case 'running': return 'text-green-600';
      case 'completed': return 'text-gray-500';
      case 'error': return 'text-red-500';
      case 'cancelled': return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pull-shark': return '🦈';
      case 'yolo': return '🤠';
      case 'quickdraw': return '⚡';
      case 'pair-extraordinaire': return '👯';
      default: return '🌾';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-20 ${isDark ? 'retro-card rounded animate-pulse' : 'rounded-xl bg-gray-100 animate-pulse'}`} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* How to Use Guide */}
      <div className="mb-4 rounded-lg border border-[#1a3a1a] bg-[#0d1117]">
        <button onClick={() => setShowGuide(!showGuide)} className="w-full px-4 py-2 text-left text-sm font-medium flex items-center justify-between text-[#00ff41]">
          <span>📖 How to Use</span>
          <span>{showGuide ? '▲' : '▼'}</span>
        </button>
        {showGuide && (
          <div className="px-4 pb-3 text-xs space-y-1 text-[#b8ffb8]">
            <p>1. Queue multiple farm jobs from Farm Control</p>
            <p>2. Jobs run sequentially to avoid rate limits</p>
            <p>3. Monitor progress of each job in real-time</p>
            <p>4. Pause or cancel jobs as needed</p>
          </div>
        )}
      </div>

      <div className="mb-5">
        <h2 className={`text-2xl ${isDark ? 'text-[#00ff41] glow-green font-mono' : 'text-gray-900 font-bold'}`}>
          {isDark ? '> FARM_QUEUE' : 'Farm Queue'}
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
          {isDark ? '// active and recent farm sessions' : 'Active and recent farm sessions'}
        </p>
      </div>

      {queue.length === 0 ? (
        <div className={`p-10 text-center ${isDark ? 'retro-card rounded' : 'rounded-2xl border bg-white border-gray-200'}`}>
          <div className="text-4xl mb-3">📭</div>
          <h3 className={`text-lg mb-1 ${isDark ? 'text-[#00ff41] font-mono' : 'text-gray-900 font-semibold'}`}>
            {isDark ? 'QUEUE EMPTY' : 'No sessions'}
          </h3>
          <p className={`text-xs ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
            {isDark ? '> start a farm to see sessions here' : 'Start a farm to see sessions here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {queue.map((session, i) => (
              <motion.div
                key={session.sessionId || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded ${isDark ? 'retro-card' : 'bg-white border border-gray-200 rounded-xl'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getTypeIcon(session.type)}</span>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-[#b8ffb8] font-mono' : 'text-gray-900'}`}>
                        {session.type?.replace('-', ' ').toUpperCase()}
                      </p>
                      <p className={`text-[10px] ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
                        {session.completed}/{session.total} completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono uppercase ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                    {session.status === 'running' && (
                      <button
                        onClick={() => handlePause(session.sessionId)}
                        className={`px-2 py-1 text-[10px] rounded ${isDark ? 'bg-[#ff9f1c20] text-[#ff9f1c] border border-[#ff9f1c40] hover:bg-[#ff9f1c30]' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                      >
                        {isDark ? 'STOP' : 'Stop'}
                      </button>
                    )}
                  </div>
                </div>

                {session.status === 'running' && (
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1a3a1a]' : 'bg-gray-100'}`}>
                    <motion.div
                      className={`h-full rounded-full ${isDark ? 'bg-[#00ff41]' : 'bg-green-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(session.completed / session.total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

