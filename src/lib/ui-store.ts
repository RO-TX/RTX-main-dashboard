'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean; // mobile drawer
  collapsed: boolean; // desktop icon-rail
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleCollapsed: () => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      collapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    {
      name: 'rtx-admin-ui',
      // Only the desktop collapse preference persists.
      partialize: (s) => ({ collapsed: s.collapsed }),
    },
  ),
);
