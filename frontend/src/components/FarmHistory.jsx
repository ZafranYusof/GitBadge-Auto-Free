import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

export default function FarmHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/farm/history', { withCredentials: true });
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const typeIcons = {
    'pull-shark': '🦈',
    'yolo': '🤠',
    'quickdraw': '⚡',
    'pair-extraordinaire': '👯'
  };

  const typeLabels = {
    'pull-shark': 'Pull Shark',
    'yolo': 'YOLO',
    'quickdraw': 'Quickdraw',
    'pair-extraordinaire': 'Pair Extraordinaire'
  };

  const statusColors = {
    completed: isDark ? 'text-[#00ff41]' : 'text-green-600',
    error: isDark ? 'text-[#ff0055]' : 'text-red-600',
    stopped: isDark ? 'text-[#ff9f1c]' : 'text-yellow-600'
  };

  const formatDuration = (start, end) => {
    const diff = end - start;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-white/[0.03]' : 'bg-gray-100'}`} />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`p-10 text-center rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
        <div className="text-4xl mb-3">📜</div>
        <h3 className={`text-lg mb-1 ${isDark ? 'text-[#00ff41] font-mono' : 'text-gray-900 font-semibold'}`}>
          {isDark ? 'NO HISTORY' : 'No farm history yet'}
        </h3>
        <p className={`text-xs ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
          {isDark ? '> Complete a farm session to see it here' : 'Complete a farm session to see it here'}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white border-gray-200'}`}>
      <div className={`px-5 py-3.5 border-b ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${isDark ? 'text-[#b8ffb8] font-mono' : 'text-gray-900'}`}>
            {isDark ? '> FARM_HISTORY' : 'Farm History'}
          </h3>
          <span className={`text-[10px] font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}`}>
            {history.length} sessions
          </span>
        </div>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        {history.map((entry, i) => (
          <motion.div
            key={entry.sessionId || i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`px-5 py-3 flex items-center gap-3 transition-colors ${
              isDark ? 'hover:bg-white/[0.02] border-b border-white/[0.03]' : 'hover:bg-gray-50 border-b border-gray-100'
            } ${i === history.length - 1 ? 'border-b-0' : ''}`}
          >
            <span className="text-lg w-7 text-center">{typeIcons[entry.type] || '🌾'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${isDark ? 'text-[#e0ffe0] font-mono' : 'text-gray-900'}`}>
                  {isDark ? (typeLabels[entry.type] || entry.type).toUpperCase() : typeLabels[entry.type] || entry.type}
                </p>
                <span className={`text-[10px] font-mono ${statusColors[entry.status] || ''}`}>
                  {entry.status === 'completed' ? '✓' : entry.status === 'error' ? '✗' : '⏸'}
                  {' '}{entry.status}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
                {entry.completed}/{entry.total} completed
                {entry.startTime && entry.endTime && ` · ${formatDuration(entry.startTime, entry.endTime)}`}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}`}>
                {entry.endTime ? new Date(entry.endTime).toLocaleDateString() : ''}
              </p>
              <p className={`text-[10px] font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}`}>
                {entry.endTime ? new Date(entry.endTime).toLocaleTimeString() : ''}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
