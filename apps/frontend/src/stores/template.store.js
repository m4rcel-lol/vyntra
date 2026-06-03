import { create } from 'zustand';
import { storage } from '@/utils/storage';

const liked = storage.get('liked-templates') || [];
const imported = storage.get('imported-templates') || [];

export const useTemplateStore = create((set, get) => ({
  likedIds: liked,
  importedIds: imported,
  search: '',
  category: 'All',
  style: 'All',
  sort: 'popular',

  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setStyle: (style) => set({ style }),
  setSort: (sort) => set({ sort }),

  toggleLike: (id) =>
    set((s) => {
      const likedIds = s.likedIds.includes(id)
        ? s.likedIds.filter((x) => x !== id)
        : [...s.likedIds, id];
      storage.set('liked-templates', likedIds);
      return { likedIds };
    }),

  markImported: (id) =>
    set((s) => {
      if (s.importedIds.includes(id)) return s;
      const importedIds = [...s.importedIds, id];
      storage.set('imported-templates', importedIds);
      return { importedIds };
    }),

  isLiked: (id) => get().likedIds.includes(id),
}));
