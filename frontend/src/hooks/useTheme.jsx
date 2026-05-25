import { useState, useEffect } from 'react';

const THEMES = [
  { id: 'hacker', name: 'Hacker', dark: true },
  { id: 'light', name: 'Light', dark: false },
  { id: 'dark', name: 'Dark', dark: true },
  { id: 'midnight', name: 'Midnight', dark: true },
];

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'hacker';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const isDark = THEMES.find(t => t.id === theme)?.dark ?? true;

  return { theme, setTheme, isDark, themes: THEMES };
}
