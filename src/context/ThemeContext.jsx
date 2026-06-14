import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // viewMode state: 'classic' | 'gamified'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('chongzi_dashboard_mode') || 'classic';
  });

  // theme preference for classic view: 'light' | 'dark'
  const [classicTheme, setClassicTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Automatically apply corresponding classes to documentElement
  useEffect(() => {
    if (viewMode === 'gamified') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('gamified-active');
    } else {
      document.documentElement.classList.remove('gamified-active');
      if (classicTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [viewMode, classicTheme]);

  const toggleViewMode = () => {
    const next = viewMode === 'classic' ? 'gamified' : 'classic';
    setViewMode(next);
    localStorage.setItem('chongzi_dashboard_mode', next);
  };

  const updateClassicTheme = (theme) => {
    setClassicTheme(theme);
    localStorage.setItem('theme', theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        viewMode,
        setViewMode,
        toggleViewMode,
        classicTheme,
        setClassicTheme: updateClassicTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
