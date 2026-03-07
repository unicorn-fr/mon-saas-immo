import { create } from 'zustand'

interface SidebarStore {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggle: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
  toggle: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
}))
