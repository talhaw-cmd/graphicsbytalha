import { create } from 'zustand'
export const useStore = create((set) => ({
  loaded: false,
  panel: null,          // 'chapters' | 'packages' | 'contact' | 'menu' | null
  mode: 'desk',         // 'desk' | 'book'
  bookPages: [null, 0], // printed pages currently visible [left, right]
  req: { page: null, n: 0 }, // page jump request: goToPage(n)
  contactPref: null, // set by Packages: which package the visitor wants to ask about
  busy: false, phase: 'idle', step: { d: 0, n: 0 },
  hover: null, evening: true, cubeSolved: true, cubeWin: 0, lite: false,
  setHover: (hover) => set({ hover }),
  setEvening: (evening) => set({ evening }),
  setLite: () => set({ lite: true }),
  setCubeSolved: (v, win) => set((s) => ({ cubeSolved: v, cubeWin: win ? s.cubeWin + 1 : s.cubeWin })),
  setMode: (mode) => set({ mode }),
  stepBook: (d) => set((s) => ({ step: { d, n: s.step.n + 1 } })),
  setLoaded: () => set({ loaded: true }),
  openPanel: (p) => set((s) => ({ panel: s.panel === p ? null : p })),
  closePanel: () => set({ panel: null }),
  setBookPages: (bookPages) => set({ bookPages }),
  goToPage: (page) => set((s) => ({ req: { page, n: s.req.n + 1 }, panel: null })),
}))
