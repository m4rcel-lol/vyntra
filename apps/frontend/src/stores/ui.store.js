import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  previewDevice: 'desktop', // 'desktop' | 'mobile'
  editorTab: 'identity',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebar: (v) => set({ sidebarCollapsed: v }),
  setMobileNav: (v) => set({ mobileNavOpen: v }),
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  setEditorTab: (editorTab) => set({ editorTab }),
}));
