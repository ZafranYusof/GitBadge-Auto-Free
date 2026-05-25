import { useTheme } from '../hooks/useTheme';

export default function ThemeSelector() {
  const { theme, setTheme, isDark, themes } = useTheme();

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-2xl ${isDark ? 'text-[var(--retro-green)] font-mono font-bold' : 'text-gray-900 font-bold'}`}>
          {isDark ? '> THEMES' : 'Themes'}
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[var(--retro-text-muted)] font-mono' : 'text-gray-500'}`}>
          {isDark ? '// customize your dashboard appearance' : 'Customize your dashboard appearance'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`p-4 rounded-xl border text-center transition-all ${
              theme === t.id
                ? isDark ? 'border-[var(--retro-green)]/50 bg-[var(--retro-green)]/10' : 'border-green-300 bg-green-50'
                : isDark ? 'border-[var(--retro-border)] bg-[var(--retro-surface)] hover:border-[var(--retro-green)]/20' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-8 h-8 mx-auto rounded-full mb-2 ${
              t.id === 'hacker' ? 'bg-green-500' :
              t.id === 'light' ? 'bg-gray-100 border border-gray-300' :
              t.id === 'dark' ? 'bg-gray-800' :
              'bg-blue-900'
            }`} />
            <p className={`text-xs font-mono ${isDark ? 'text-[var(--retro-text)]' : 'text-gray-900'}`}>{t.name}</p>
            {theme === t.id && (
              <span className={`text-[10px] ${isDark ? 'text-[var(--retro-green)]' : 'text-green-600'}`}>Active</span>
            )}
          </button>
        ))}
      </div>

      {/* Pro themes teaser */}
      <div className={`p-4 rounded-xl border ${isDark ? 'border-[var(--retro-border)] bg-[var(--retro-surface)]' : 'border-gray-200 bg-white'}`}>
        <p className={`text-sm font-mono mb-2 ${isDark ? 'text-[var(--retro-amber)]' : 'text-amber-600'}`}>
          {isDark ? '> 14 MORE THEMES IN PRO' : '⭐ 14 More Themes in Pro'}
        </p>
        <p className={`text-xs ${isDark ? 'text-[var(--retro-text-muted)]' : 'text-gray-400'}`}>
          Cyberpunk, Dracula, Nord, Matrix, Synthwave, Catppuccin, Tokyo Night, Monokai, Gruvbox, Abyss, Solarized, GitHub, Paper, Rose Pine — each with unique design system.
        </p>
        <a href="https://gitbadge-auto.onrender.com" target="_blank" rel="noopener noreferrer" className={`inline-block mt-2 text-xs px-3 py-1.5 rounded ${isDark ? 'bg-[var(--retro-amber)]/10 text-[var(--retro-amber)] border border-[var(--retro-amber)]/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          Upgrade →
        </a>
      </div>
    </div>
  );
}
