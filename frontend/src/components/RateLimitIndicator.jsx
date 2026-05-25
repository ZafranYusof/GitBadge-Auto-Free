import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

export default function RateLimitIndicator() {
  const [rateLimit, setRateLimit] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchRateLimit();
    const interval = setInterval(fetchRateLimit, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRateLimit = async () => {
    try {
      const res = await axios.get('/api/ratelimit', { withCredentials: true });
      setRateLimit(res.data);
    } catch {}
  };

  if (!rateLimit) return null;

  const percentage = (rateLimit.remaining / rateLimit.limit) * 100;
  const isLow = percentage < 20;
  const isCritical = percentage < 5;

  const resetDate = new Date(rateLimit.reset * 1000);
  const resetIn = Math.max(0, Math.ceil((resetDate - Date.now()) / 60000));

  let colorClasses, dotColor;
  if (isCritical) {
    colorClasses = isDark ? 'bg-red-500/[0.08] border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600';
    dotColor = 'bg-red-500';
  } else if (isLow) {
    colorClasses = isDark ? 'bg-amber-500/[0.08] border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600';
    dotColor = 'bg-amber-500';
  } else {
    colorClasses = isDark ? 'bg-white/[0.03] border-white/[0.06] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600';
    dotColor = 'bg-green-500';
  }

  return (
    <div
      className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${colorClasses}`}
      title={`API rate limit - Resets in ${resetIn}m`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isLow ? 'animate-pulse' : ''}`} />
      <span className="font-mono text-[11px]">{rateLimit.remaining.toLocaleString()}</span>
      {isLow && <span className="text-[10px] opacity-70">{resetIn}m</span>}
    </div>
  );
}
