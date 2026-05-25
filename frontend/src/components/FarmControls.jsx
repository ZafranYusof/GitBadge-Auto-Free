import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { useTheme } from '../hooks/useTheme';
import ProcessLog from './ProcessLog';

const FARM_TYPES = [
  { id: 'pull-shark', name: 'Pull Shark', icon: '🦈', description: 'Create & merge PRs' },
  { id: 'yolo', name: 'YOLO', icon: '🤠', description: 'Merge PRs without review' },
  { id: 'quickdraw', name: 'Quickdraw', icon: '🔫', description: 'Close issues within 5 min' },
];

export default function FarmControls({ farmProgress }) {
  const [selectedType, setSelectedType] = useState('pull-shark');
  const [settings, setSettings] = useState({
    count: 5,
    delay: 2000,
    repo: '',
    visibility: 'private'
  });
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { isDark } = useTheme();

  const startFarm = async () => {
    setIsRunning(true);
    setIsProcessing(true);
    setResult(null);
    setLogs([]);
    try {
      const res = await api.post(`/api/farm/${selectedType}`, settings, { withCredentials: true });
      setResult({ success: true, message: res.data.message, sessionId: res.data.sessionId });
      if (res.data.logs) setLogs(res.data.logs);
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.error || 'Farm failed' });
    } finally {
      setIsRunning(false);
      setIsProcessing(false);
    }
  };

  const progress = farmProgress;

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
            <p>1. Select badge type (Pull Shark / YOLO / Quickdraw)</p>
            <p>2. Choose target repo or leave empty to auto-create</p>
            <p>3. Set farm count and delay between actions</p>
            <p>4. Click Start Farm</p>
            <p>5. Monitor progress in real-time below</p>
          </div>
        )}
      </div>

      <div>
        <h2 className={`text-2xl ${isDark ? 'text-[var(--retro-green)] font-mono font-bold' : 'text-gray-900 font-bold'}`}>
          {isDark ? '> FARM_CONTROL' : 'Farm Control'}
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[var(--retro-text-muted)] font-mono' : 'text-gray-500'}`}>
          {isDark ? '// select badge type and configure farming parameters' : 'Select badge type and configure farming parameters'}
        </p>
      </div>

      {/* Badge Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FARM_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedType === type.id
                ? isDark ? 'border-[var(--retro-green)]/50 bg-[var(--retro-green)]/5 shadow-[0_0_15px_var(--retro-border-glow)]' : 'border-green-300 bg-green-50'
                : isDark ? 'border-[var(--retro-border)] bg-[var(--retro-surface)] hover:border-[var(--retro-green)]/20' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">{type.icon}</span>
            <p className={`text-sm font-mono mt-2 ${isDark ? 'text-[var(--retro-text)]' : 'text-gray-900'}`}>{type.name}</p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-400'}`}>{type.description}</p>
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className={`p-5 rounded-xl border ${isDark ? 'border-[var(--retro-border)] bg-[var(--retro-surface)]' : 'border-gray-200 bg-white'}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-600 text-xs font-medium'}`}>
              {isDark ? 'COUNT' : 'Count'}
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.count}
              onChange={e => setSettings(s => ({ ...s, count: parseInt(e.target.value) || 1 }))}
              className={isDark ? 'retro-input w-full rounded' : 'w-full rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500'}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-600 text-xs font-medium'}`}>
              {isDark ? 'DELAY_MS' : 'Delay (ms)'}
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              value={settings.delay}
              onChange={e => setSettings(s => ({ ...s, delay: parseInt(e.target.value) || 2000 }))}
              className={isDark ? 'retro-input w-full rounded' : 'w-full rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500'}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-600 text-xs font-medium'}`}>
            {isDark ? 'TARGET_REPO' : 'Target Repo (optional)'}
          </label>
          <input
            type="text"
            value={settings.repo}
            onChange={e => setSettings(s => ({ ...s, repo: e.target.value }))}
            placeholder="owner/repo (leave empty to auto-create)"
            className={isDark ? 'retro-input w-full rounded' : 'w-full rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500'}
          />
        </div>

        {/* Start Button */}
        <button
          onClick={startFarm}
          disabled={isRunning}
          className={`w-full mt-5 py-3 rounded-lg font-mono text-sm transition-all ${
            isDark
              ? 'bg-[var(--retro-green)]/10 border border-[var(--retro-green)]/30 text-[var(--retro-green)] hover:bg-[var(--retro-green)]/20 disabled:opacity-30'
              : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-30 rounded-xl'
          }`}
        >
          {isRunning ? (isDark ? '[ FARMING... ]' : 'Farming...') : (isDark ? '[ START FARM ]' : '🌾 Start Farm')}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${isDark ? 'border-[var(--retro-border)] bg-[var(--retro-surface)]' : 'border-gray-200 bg-white'}`}
        >
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className={isDark ? 'text-[var(--retro-green)]' : 'text-green-700'}>{progress.message}</span>
            <span className={isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-400'}>[{progress.completed}/{progress.total}]</span>
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[var(--retro-border)]' : 'bg-gray-200'}`}>
            <div
              className={`h-full transition-all duration-300 ${isDark ? 'bg-[var(--retro-green)]' : 'bg-green-500'}`}
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Process Log */}
      <ProcessLog logs={logs} isRunning={isProcessing} />

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-4 rounded-xl border ${
            result.success
              ? isDark ? 'border-green-500/30 bg-green-500/5' : 'border-green-200 bg-green-50'
              : isDark ? 'border-red-500/30 bg-red-500/5' : 'border-red-200 bg-red-50'
          }`}
        >
          <p className={`text-sm font-mono ${result.success ? (isDark ? 'text-green-400' : 'text-green-700') : (isDark ? 'text-red-400' : 'text-red-700')}`}>
            {result.message}
          </p>
        </motion.div>
      )}
    </div>
  );
}

