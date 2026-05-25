import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';
import { useSocket } from '../hooks/useSocket';

export default function SafetyDashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/safety/status', { withCredentials: true });
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch safety status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleReset = async () => {
    try {
      const res = await axios.post('/api/safety/reset', {}, { withCredentials: true });
      setStatus(res.data.status);
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  const handlePauseAll = async () => {
    try {
      await axios.post('/api/safety/pause-all', {}, { withCredentials: true });
    } catch (err) {
      console.error('Failed to pause:', err);
    }
  };

  const handleToggleAutoPause = async () => {
    if (!status) return;
    try {
      const res = await axios.post('/api/safety/auto-pause', {
        enabled: !status.autoPauseEnabled
      }, { withCredentials: true });
      setStatus(prev => ({ ...prev, autoPauseEnabled: res.data.autoPauseEnabled }));
    } catch (err) {
      console.error('Failed to toggle auto-pause:', err);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'safe': return isDark ? '#00ff41' : '#10b981';
      case 'caution': return isDark ? '#ff9f1c' : '#f59e0b';
      case 'danger': return isDark ? '#ff0055' : '#ef4444';
      default: return isDark ? '#4a7a4a' : '#9ca3af';
    }
  };

  const getRiskBg = (level) => {
    switch (level) {
      case 'safe': return isDark ? 'bg-[#00ff4115]' : 'bg-green-50';
      case 'caution': return isDark ? 'bg-[#ff9f1c15]' : 'bg-amber-50';
      case 'danger': return isDark ? 'bg-[#ff005515]' : 'bg-red-50';
      default: return isDark ? 'bg-[#1a1a2e]' : 'bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-[#00ff41]' : 'border-green-500'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h2 className={`text-2xl ${isDark ? 'text-[#00ff41] glow-green font-mono' : 'text-gray-900 font-bold'}`}>
          {isDark ? '> SAFETY_MONITOR' : 'Safety Monitor'}
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
          {isDark ? '// anti-detection & rate limit protection' : 'Anti-detection & rate limit protection'}
        </p>
      </div>

      {/* Risk Level Indicator */}
      <div className={`rounded-xl border p-5 ${isDark ? 'retro-card' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${getRiskBg(status?.riskLevel)}`}
              style={{ boxShadow: isDark ? `0 0 20px ${getRiskColor(status?.riskLevel)}30` : 'none' }}
            >
              <div
                className="w-8 h-8 rounded-full animate-pulse"
                style={{ backgroundColor: getRiskColor(status?.riskLevel) }}
              />
            </div>
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
                {isDark ? 'RISK_LEVEL' : 'Risk Level'}
              </p>
              <p className={`text-xl font-bold uppercase ${isDark ? 'font-mono' : ''}`} style={{ color: getRiskColor(status?.riskLevel) }}>
                {status?.riskLevel || 'unknown'}
              </p>
            </div>
          </div>

          {/* Emergency buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePauseAll}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                isDark
                  ? 'bg-[#ff005515] border border-[#ff005540] text-[#ff0055] hover:bg-[#ff005525] font-mono'
                  : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
              }`}
            >
              {isDark ? '[ PAUSE ALL ]' : '⏸ Pause All Farms'}
            </button>
            <button
              onClick={handleReset}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                isDark
                  ? 'bg-[#00ff4108] border border-[#00ff4130] text-[#00ff41] hover:bg-[#00ff4115] font-mono'
                  : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isDark ? '[ RESET ]' : '↺ Reset Metrics'}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'API Calls/hr', value: status?.metrics?.apiCallsThisHour || 0, max: 5000, icon: '📡' },
          { label: 'Rate Limit Left', value: status?.metrics?.rateLimitRemaining || 0, max: 5000, icon: '⏱️' },
          { label: 'Errors/hr', value: status?.metrics?.errorsThisHour || 0, max: 50, icon: '⚠️' },
          { label: '403 Streak', value: status?.metrics?.consecutive403s || 0, max: 5, icon: '🚫' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-4 ${isDark ? 'retro-card' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{metric.icon}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
                {metric.label}
              </span>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-[#e0ffe0] font-mono' : 'text-gray-900'}`}>
              {metric.value.toLocaleString()}
            </p>
            <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1a3a1a]' : 'bg-gray-100'}`}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((metric.value / metric.max) * 100, 100)}%`,
                  backgroundColor: metric.value / metric.max > 0.8 ? getRiskColor('danger') : metric.value / metric.max > 0.5 ? getRiskColor('caution') : getRiskColor('safe')
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cooldown Timer & Auto-Pause */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Cooldown */}
        <div className={`rounded-xl border p-4 ${isDark ? 'retro-card' : 'bg-white border-gray-200'}`}>
          <p className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
            {isDark ? 'COOLDOWN_TIMER' : 'Cooldown Timer'}
          </p>
          {status?.cooldownMs > 0 ? (
            <div>
              <p className={`text-xl font-bold ${isDark ? 'text-[#ff9f1c] font-mono' : 'text-amber-600'}`}>
                {Math.ceil(status.cooldownMs / 60000)} min
              </p>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
                {isDark ? '// recommended wait before resuming' : 'Recommended wait before resuming'}
              </p>
            </div>
          ) : (
            <div>
              <p className={`text-xl font-bold ${isDark ? 'text-[#00ff41] font-mono' : 'text-green-600'}`}>
                {isDark ? 'CLEAR' : 'No cooldown'}
              </p>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
                {isDark ? '// safe to proceed' : 'Safe to proceed'}
              </p>
            </div>
          )}
        </div>

        {/* Auto-Pause Toggle */}
        <div className={`rounded-xl border p-4 ${isDark ? 'retro-card' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
                {isDark ? 'AUTO_PAUSE' : 'Auto-Pause'}
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-[#b8ffb8] font-mono' : 'text-gray-700'}`}>
                {isDark ? '// pause farms on danger' : 'Pause farms when danger detected'}
              </p>
            </div>
            <button
              onClick={handleToggleAutoPause}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                status?.autoPauseEnabled
                  ? isDark ? 'bg-[#00ff41]' : 'bg-green-500'
                  : isDark ? 'bg-[#1a3a1a]' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                status?.autoPauseEnabled ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className={`rounded-xl border p-4 ${isDark ? 'retro-card' : 'bg-white border-gray-200'}`}>
        <p className={`text-[10px] uppercase font-bold tracking-wider mb-3 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
          {isDark ? '> RECOMMENDATIONS' : 'Recommendations'}
        </p>
        <div className="space-y-2">
          {(status?.recommendations || []).map((rec, i) => (
            <div key={i} className={`text-sm ${isDark ? 'text-[#b8ffb8] font-mono' : 'text-gray-700'}`}>
              {isDark ? `  ${rec}` : rec}
            </div>
          ))}
        </div>
      </div>

      {/* Event History */}
      <div className={`rounded-xl border p-4 ${isDark ? 'retro-card' : 'bg-white border-gray-200'}`}>
        <p className={`text-[10px] uppercase font-bold tracking-wider mb-3 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
          {isDark ? '> EVENT_LOG [last 20]' : 'Event History (last 20)'}
        </p>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {(status?.history || []).length === 0 ? (
            <p className={`text-xs ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-400'}`}>
              {isDark ? '// no events recorded' : 'No events recorded'}
            </p>
          ) : (
            status.history.map((event, i) => (
              <div key={i} className={`flex items-start gap-2 text-[11px] ${isDark ? 'font-mono' : ''}`}>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: getRiskColor(event.level) }}
                />
                <span className={isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={isDark ? 'text-[#b8ffb8]' : 'text-gray-700'}>
                  {event.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
