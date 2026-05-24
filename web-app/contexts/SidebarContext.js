'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext({
  sidebarMode: 'expanded', // 'expanded', 'collapsed', 'hover'
  setSidebarMode: () => {},
  isHovered: false,
  setIsHovered: () => {},
});

/**
 * SidebarProvider
 * Mengelola preferensi tampilan sidebar (Expanded, Collapsed, Expand on Hover).
 * Nilai disimpan secara otomatis di localStorage untuk retensi preferensi user.
 */
export function SidebarProvider({ children }) {
  const [sidebarMode, setSidebarModeState] = useState('expanded');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Muat preferensi dari localStorage saat dimuat di client-side
    const savedMode = localStorage.getItem('athena-sidebar-mode');
    if (savedMode && ['expanded', 'collapsed', 'hover'].includes(savedMode)) {
      setSidebarModeState(savedMode);
    }
  }, []);

  const setSidebarMode = (mode) => {
    if (['expanded', 'collapsed', 'hover'].includes(mode)) {
      setSidebarModeState(mode);
      localStorage.setItem('athena-sidebar-mode', mode);
    }
  };

  return (
    <SidebarContext.Provider value={{ sidebarMode, setSidebarMode, isHovered, setIsHovered }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
