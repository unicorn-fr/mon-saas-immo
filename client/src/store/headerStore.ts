import { create } from 'zustand'

interface HeaderStore {
  isDark: boolean
  setDark: (v: boolean) => void
}

export const useHeaderStore = create<HeaderStore>((set) => ({
  isDark: false,
  setDark: (isDark) => set({ isDark }),
}))
