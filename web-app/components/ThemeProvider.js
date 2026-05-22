'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  // null = belum diinisialisasi (menghindari flash sebelum OS preference terbaca)
  const [theme, setThemeState] = useState(null);

  useEffect(() => {
    // Prioritas: 1) localStorage, 2) OS preference, 3) dark sebagai fallback
    const saved = localStorage.getItem('athena-theme');
    if (saved) {
      applyTheme(saved);
    } else {
      // Baca preferensi sistem OS
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen perubahan preferensi OS (saat user ubah di sistem)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOsChange = (e) => {
      // Hanya ikut OS jika user belum punya preferensi tersimpan
      if (!localStorage.getItem('athena-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleOsChange);
    return () => mediaQuery.removeEventListener('change', handleOsChange);
  }, []);

  const applyTheme = (newTheme) => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('athena-theme', next);
    applyTheme(next);
  };

  const setTheme = (newTheme) => {
    localStorage.setItem('athena-theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
