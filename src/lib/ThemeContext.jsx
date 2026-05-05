import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const COLOR_THEMES = [
  { id: 'green',      label: 'Forest',     color: '#2d7d53' },
  { id: 'blue',       label: 'Ocean',      color: '#1a72c7' },
  { id: 'lavender',   label: 'Lavender',   color: '#7c5cbf' },
  { id: 'terracotta', label: 'Terracotta', color: '#b85530' },
  { id: 'rose',       label: 'Rose',       color: '#c23460' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'light');
  const [colorTheme, setColorThemeState] = useState(() => localStorage.getItem('colorTheme') || 'green');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === 'green') {
      root.removeAttribute('data-color');
    } else {
      root.setAttribute('data-color', colorTheme);
    }
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);

  const toggleTheme = () => setThemeState((t) => (t === 'light' ? 'dark' : 'light'));
  const setTheme = (t) => setThemeState(t);
  const setColorTheme = (c) => setColorThemeState(c);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colorTheme, setColorTheme, COLOR_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
