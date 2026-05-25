import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

export default function ActivityLog({ logs }) {
  const { isDark } = useTheme();

  const exportCSV = () => {
    const headers = ['Timestamp', 'Level', 'Message', 'Session ID'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.level,
      `"${log.message.replace(/"/g, '""')}"`,
      log.sessionId || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, 'farm-activity-log.csv', 'text/csv');
  };

  const exportJSON = () => {
    const json = JSON.stringify(logs, null, 2);
    downloadFile(json, 'farm-activity-log.json', 'application/json');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (logs.length === 0) {
    return (
      <div className={`p-10 text-center ${isDark ? 'retro-card rounded' : 'rounded-2xl border bg-white border-gray-200'}`}>
        <div className={`w-14 h-14 rounded flex items-center justify-center mx-auto mb-3 ${isDark ? 'border border-[#1a3a1a]' : 'rounded-2xl bg-gray-100'}`}>
          <span className="text-2xl">📋</span>
        </div>
        <h3 className={`text-lg mb-1 ${isDark ? 'text-[#00ff41] font-mono' : 'text-gray-900 font-semibold'}`}>
          {isDark ? 'NO ACTIVITY LOGGED' : 'No activity yet'}
        </h3>
        <p className={`text-xs ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
          {isDark ? '> Awaiting farm session data...' : 'Start farming to see your activity log here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${isDark ? 'text-[#00ff41] glow-green font-mono' : 'text-gray-900 font-bold'}`}>
            {isDark ? '> ACTIVITY_LOG' : 'Activity Log'}
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
            {isDark ? `// Last ${logs.length} entries` : `Last ${logs.length} actions`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className={`btn-press px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              isDark ? 'retro-btn' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium'
            }`}
          >
            {isDark ? '[ CSV ]' : 'CSV'}
          </button>
          <button
            onClick={exportJSON}
            className={`btn-press px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all ${
              isDark ? 'retro-btn-cyan' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium'
            }`}
          >
            {isDark ? '[ JSON ]' : 'JSON'}
          </button>
        </div>
      </div>

      <div className={`overflow-hidden ${isDark ? 'retro-card rounded' : 'rounded-2xl border bg-white border-gray-200'}`}>
        {/* Terminal header */}
        {isDark && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a3a1a]">
            <div className="terminal-dots"><span></span><span></span><span></span></div>
            <span className="text-[10px] font-mono text-[#4a7a4a]">farm-log@system — {logs.length} entries</span>
          </div>
        )}

        <div className={`max-h-[600px] overflow-y-auto ${isDark ? 'p-3' : ''}`}>
          {logs.map((log, i) => (
            <motion.div
              key={`${log.timestamp}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              className={isDark
                ? `flex items-start gap-2 px-2 py-1.5 font-mono text-xs hover:bg-[#00ff4106] rounded transition-colors ${i < logs.length - 1 ? 'border-b border-[#1a3a1a]/50' : ''}`
                : `flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 ${i < logs.length - 1 ? 'border-b border-gray-100' : ''}`
              }
            >
              {isDark ? (
                <>
                  {/* Timestamp */}
                  <span className="text-[#4a7a4a] text-[10px] flex-shrink-0 w-16">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {/* Level indicator */}
                  <span className={`flex-shrink-0 text-[10px] w-5 ${
                    log.level === 'error' ? 'text-[#ff0055]' : 'text-[#00ff41]'
                  }`}>
                    {log.level === 'error' ? 'ERR' : ' OK'}
                  </span>
                  {/* Prompt */}
                  <span className="text-[#00ff41] flex-shrink-0">{'>'}</span>
                  {/* Message */}
                  <span className={`flex-1 min-w-0 break-words ${
                    log.level === 'error' ? 'text-[#ff0055]' : 'text-[#b8ffb8]'
                  }`}>
                    {log.message}
                  </span>
                </>
              ) : (
                <>
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    log.level === 'error' ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${
                      log.level === 'error' ? 'text-red-600' : 'text-gray-700'
                    }`}>{log.message}</p>
                    <p className="text-[11px] font-mono mt-1 text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Terminal footer */}
        {isDark && (
          <div className="px-4 py-2 border-t border-[#1a3a1a] flex items-center gap-2">
            <span className="text-[#00ff41] text-xs font-mono">{'>'}</span>
            <span className="text-[#4a7a4a] text-[10px] font-mono">END OF LOG</span>
            <span className="typing-cursor">&nbsp;</span>
          </div>
        )}
      </div>
    </div>
  );
}
