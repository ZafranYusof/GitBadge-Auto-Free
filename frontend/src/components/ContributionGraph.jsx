import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTheme } from '../hooks/useTheme';

export default function ContributionGraph({ farmProgress }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [commitsPerDay, setCommitsPerDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filling, setFilling] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => { fetchGraph(); }, []);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/contributions/graph', { withCredentials: true });
      setGraphData(res.data);
    } catch (err) {
      console.error('Failed to fetch graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDate = (date) => {
    setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const selectEmptyDays = () => {
    if (!graphData) return;
    const emptyDates = [];
    for (const week of graphData.weeks) {
      for (const day of week.contributionDays) {
        if (day.contributionCount === 0) emptyDates.push(day.date);
      }
    }
    setSelectedDates(emptyDates);
  };

  const clearSelection = () => setSelectedDates([]);

  const startFilling = async () => {
    if (selectedDates.length === 0) return;
    setFilling(true);
    try {
      await axios.post('/api/contributions/fill', {
        dates: selectedDates,
        commitsPerDay,
        repoVisibility: 'public'
      }, { withCredentials: true });
    } catch (err) {
      console.error('Failed to start filling:', err);
    }
  };

  useEffect(() => {
    if (farmProgress?.type === 'contribution-graph' && farmProgress?.status === 'completed') {
      setFilling(false);
      fetchGraph();
    }
  }, [farmProgress]);

  const generateCalendar = () => {
    if (!graphData?.weeks) return [];
    return graphData.weeks.slice(-52);
  };

  const getContribColor = (count, isSelected) => {
    if (isSelected) return isDark ? '#00ffff' : '#a78bfa';
    if (count === 0) return isDark ? '#1a3a1a' : '#ebedf0';
    if (isDark) {
      if (count <= 3) return '#00ff4130';
      if (count <= 6) return '#00ff4160';
      if (count <= 9) return '#00ff4190';
      return '#00ff41';
    }
    if (count <= 3) return '#9be9a8';
    if (count <= 6) return '#40c463';
    if (count <= 9) return '#30a14e';
    return '#216e39';
  };

  const weeks = generateCalendar();

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-2xl ${isDark ? 'text-[#00ff41] glow-green font-mono' : 'text-gray-900 font-bold'}`}>
          {isDark ? '> CONTRIBUTION_GRAPH' : 'Contribution Graph'}
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[#4a7a4a] font-mono' : 'text-gray-500'}`}>
          {isDark ? '// fill gaps in contribution history' : 'Fill gaps in your contribution history'}
        </p>
      </div>

      {/* Graph */}
      <div className={isDark ? 'retro-card rounded' : 'rounded-2xl border bg-white border-gray-200'}>
        {isDark && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a3a1a]">
            <span className="text-[10px] font-mono text-[#b8ffb8]">
              {graphData ? `${graphData.totalContributions} CONTRIBUTIONS` : 'LOADING...'}
            </span>
            <div className="flex gap-2">
              <button onClick={selectEmptyDays} className="retro-btn px-2 py-1 rounded text-[9px]">[ SELECT EMPTY ]</button>
              <button onClick={clearSelection} className="retro-btn-amber px-2 py-1 rounded text-[9px]">[ CLEAR ]</button>
            </div>
          </div>
        )}
        {!isDark && (
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="font-semibold text-sm text-gray-900">
              {graphData ? `${graphData.totalContributions} contributions` : 'Loading...'}
            </h3>
            <div className="flex gap-2">
              <button onClick={selectEmptyDays} className="btn-press px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Select Empty</button>
              <button onClick={clearSelection} className="btn-press px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">Clear</button>
            </div>
          </div>
        )}

        <div className="p-5">
          {loading ? (
            <div className={`h-28 skeleton ${isDark ? 'bg-[#0a0a0f] rounded' : 'rounded-xl bg-gray-100'}`} />
          ) : graphData ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-[2px] min-w-fit">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[2px]">
                    {week.contributionDays.map((day) => {
                      const isSelected = selectedDates.includes(day.date);
                      return (
                        <div
                          key={day.date}
                          onClick={() => toggleDate(day.date)}
                          className={`w-[11px] h-[11px] cursor-pointer transition-all hover:scale-125 ${isDark ? 'rounded-none hover:ring-1 hover:ring-[#00ff4150]' : 'rounded-[2px] hover:ring-1 hover:ring-white/30'}`}
                          style={{
                            backgroundColor: getContribColor(day.contributionCount, isSelected),
                            boxShadow: isDark && (day.contributionCount > 6 || isSelected) ? `0 0 3px ${isSelected ? '#00ffff60' : '#00ff4140'}` : 'none'
                          }}
                          title={`${day.date}: ${day.contributionCount} contributions${isSelected ? ' (selected)' : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className={`flex items-center gap-2 mt-3 text-[9px] font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}`}>
                <span>Less</span>
                {[0, 3, 6, 9, 12].map(level => (
                  <div key={level} className={`w-[10px] h-[10px] ${isDark ? '' : 'rounded-[2px]'}`}
                    style={{ backgroundColor: getContribColor(level, false) }} />
                ))}
                <span>More</span>
                {selectedDates.length > 0 && (
                  <>
                    <span className="mx-1">|</span>
                    <div className={`w-[10px] h-[10px] ${isDark ? '' : 'rounded-[2px]'}`} style={{ backgroundColor: isDark ? '#00ffff' : '#a78bfa' }} />
                    <span>Selected ({selectedDates.length})</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-6 text-center ${isDark ? '' : 'rounded-xl bg-gray-50'}`}>
              <p className={`text-xs font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-500'}`}>
                {isDark ? '> ERROR: Failed to load graph' : 'Failed to load contribution graph'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fill Controls */}
      <div className={isDark ? 'retro-card rounded' : 'rounded-2xl border bg-white border-gray-200'}>
        {isDark && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1a3a1a]">
            <span className="text-[10px] font-mono text-[#00ffff]">{'>'}</span>
            <span className="text-[11px] font-mono text-[#b8ffb8]">FILL_CONTROLLER</span>
          </div>
        )}
        {!isDark && (
          <div className="flex items-center gap-2 p-6 pb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50"><span className="text-sm">🎯</span></div>
            <h3 className="font-semibold text-sm text-gray-900">Fill Selected Dates</h3>
          </div>
        )}

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#4a7a4a]' : 'text-gray-600 text-xs font-medium'}`}>
                {isDark ? 'SELECTED_DATES' : 'Selected Dates'}
              </label>
              <p className={`text-2xl font-bold font-mono ${isDark ? 'text-[#00ffff]' : 'text-gray-900'}`}
                style={isDark ? { textShadow: '0 0 8px #00ffff60' } : undefined}>
                {selectedDates.length}
              </p>
              <p className={`text-[10px] mt-1 font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}`}>
                {isDark ? '// click squares to select' : 'Click squares above to select'}
              </p>
            </div>
            <div>
              <label className={`block text-[10px] font-mono uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#4a7a4a]' : 'text-gray-600 text-xs font-medium'}`}>
                {isDark ? 'COMMITS_PER_DAY' : 'Commits per Day'}
              </label>
              <input
                type="number" min="1" max="10"
                value={commitsPerDay}
                onChange={e => setCommitsPerDay(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className={isDark ? 'retro-input w-full rounded' : 'w-full rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500'}
              />
            </div>
          </div>

          {/* Progress */}
          {filling && farmProgress?.type === 'contribution-graph' && (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className={isDark ? 'text-[#00ffff]' : 'text-purple-600 font-medium'}>{farmProgress.message}</span>
                <span className={isDark ? 'text-[#4a7a4a]' : 'text-gray-400'}>[{farmProgress.completed}/{farmProgress.total}]</span>
              </div>
              {isDark ? (
                <div className="retro-progress rounded-sm">
                  <div className="retro-progress-bar" style={{ color: '#00ffff', width: `${(farmProgress.completed / farmProgress.total) * 100}%` }} />
                </div>
              ) : (
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${(farmProgress.completed / farmProgress.total) * 100}%` }} />
                </div>
              )}
            </div>
          )}

          <button
            onClick={startFilling}
            disabled={selectedDates.length === 0 || filling}
            className={`btn-press w-full py-2.5 px-4 rounded text-xs font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark ? 'retro-btn-cyan' : 'bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium text-sm'
            }`}
          >
            {filling ? (
              <span className="flex items-center justify-center gap-2">
                <span className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-[#00ffff]' : 'border-white'}`} />
                {isDark ? 'FILLING...' : 'Filling...'}
              </span>
            ) : (
              isDark
                ? `[ FILL ${selectedDates.length} DAYS — ${selectedDates.length * commitsPerDay} COMMITS ]`
                : `Fill ${selectedDates.length} Days (${selectedDates.length * commitsPerDay} commits)`
            )}
          </button>

          <p className={`text-[10px] mt-3 font-mono ${isDark ? 'text-[#4a7a4a]' : 'text-gray-400 leading-relaxed'}`}>
            {isDark ? '// creates backdated commits. ~5 API calls per commit.' : 'Creates backdated commits in a new repo. Each commit uses ~5 API calls.'}
          </p>
        </div>
      </div>
    </div>
  );
}
