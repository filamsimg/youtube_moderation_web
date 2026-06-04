'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
});

/**
 * ThemeProvider Component
 * Menyediakan state tema global yang murni otomatis tersinkronisasi
 * dengan preferensi tema sistem operasi (OS) pengguna secara real-time,
 * serta mendukung override manual dari menu pengaturan/preferensi.
 */
export function ThemeProvider({ children }) {
  // Default ke 'dark' saat inisialisasi awal di client side
  const [theme, setThemeState] = useState('dark');

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (isDark) => {
      const activeTheme = isDark ? 'dark' : 'light';
      setTheme(activeTheme);
    };

    // Terapkan tema berdasarkan setelan OS saat ini
    applyTheme(mediaQuery.matches);

    // Dengarkan perubahan tema OS secara dinamis (sunset-to-sunrise/manual OS switches)
    const handleOsChange = (e) => {
      applyTheme(e.matches);
    };

    mediaQuery.addEventListener('change', handleOsChange);
    return () => mediaQuery.removeEventListener('change', handleOsChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
