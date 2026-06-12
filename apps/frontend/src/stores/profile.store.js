import { create } from 'zustand';
import { createDefaultProfile } from '@/mocks/profiles.mock';
import { profileService } from '@/services/profile.service';

const nid = () => `tmp_${Math.random().toString(36).slice(2, 9)}`;
const initial = createDefaultProfile({ username: 'loading', displayName: 'Loading profile' });

export const useProfileStore = create((set, get) => ({
  profile: initial,
  loading: false,
  saving: false,
  error: null,
  dirty: false,

  async loadCurrentProfile() {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.getProfile();
      set({ profile, loading: false, dirty: false });
      return profile;
    } catch (e) {
      set({ loading: false, error: e.message || 'Could not load profile' });
      throw e;
    }
  },

  async saveProfile() {
    set({ saving: true, error: null });
    try {
      const profile = await profileService.updateProfile(get().profile);
      set({ profile, saving: false, dirty: false });
      return profile;
    } catch (e) {
      set({ saving: false, error: e.message || 'Could not save profile' });
      throw e;
    }
  },

  setProfile: (profile) => set({ profile, dirty: true }),

  reset: () => set({ profile: createDefaultProfile(), dirty: true }),

  setField: (key, value) =>
    set((s) => ({
      profile: { ...s.profile, [key]: value },
      dirty: true,
    })),

  setNested: (group, key, value) =>
    set((s) => ({
      profile: { ...s.profile, [group]: { ...s.profile[group], [key]: value } },
      dirty: true,
    })),

  toggleEffect: (key) =>
    set((s) => ({
      profile: { ...s.profile, effects: { ...s.profile.effects, [key]: !s.profile.effects[key] } },
      dirty: true,
    })),

  setEffect: (key, value) =>
    set((s) => ({
      profile: { ...s.profile, effects: { ...s.profile.effects, [key]: value } },
      dirty: true,
    })),

  addLink: (link = {}) => {
    const tempLink = { id: nid(), label: 'New Link', url: 'https://example.com', icon: 'Link', style: 'glass', ...link };
    set((s) => ({ profile: { ...s.profile, links: [...s.profile.links, tempLink] }, dirty: true }));
    profileService.createLink(tempLink)
      .then((saved) => {
        set((s) => ({
          profile: {
            ...s.profile,
            links: s.profile.links.map((item) => (item.id === tempLink.id ? saved : item)),
          },
        }));
      })
      .catch((e) => set({ error: e.message || 'Could not create link' }));
  },

  updateLink: (id, patch) => {
    set((s) => ({
      profile: { ...s.profile, links: s.profile.links.map((link) => (link.id === id ? { ...link, ...patch } : link)) },
      dirty: true,
    }));
    if (!String(id).startsWith('tmp_')) {
      profileService.updateLink(id, patch).catch((e) => set({ error: e.message || 'Could not update link' }));
    }
  },

  removeLink: (id) => {
    set((s) => ({
      profile: { ...s.profile, links: s.profile.links.filter((link) => link.id !== id) },
      dirty: true,
    }));
    if (!String(id).startsWith('tmp_')) {
      profileService.deleteLink(id).catch((e) => set({ error: e.message || 'Could not delete link' }));
    }
  },

  reorderLinks: (from, to) => {
    let orderedIds = [];
    set((s) => {
      const links = [...s.profile.links];
      if (from < 0 || to < 0 || from >= links.length || to >= links.length || from === to) {
        orderedIds = links.map((link) => link.id);
        return s;
      }
      const [moved] = links.splice(from, 1);
      links.splice(to, 0, moved);
      orderedIds = links.map((link) => link.id);
      return { profile: { ...s.profile, links }, dirty: true };
    });
    if (orderedIds.length && orderedIds.every((id) => !String(id).startsWith('tmp_'))) {
      profileService.reorderLinks(orderedIds).catch((e) => set({ error: e.message || 'Could not reorder links' }));
    }
  },

  addBadge: (badge) =>
    set((s) => ({
      profile: {
        ...s.profile,
        badges: [...s.profile.badges, { id: nid(), label: 'Badge', color: '0 0% 80%', tooltip: '', glow: false, icon: 'Star', ...badge }],
      },
      dirty: true,
    })),

  updateBadge: (id, patch) =>
    set((s) => ({
      profile: { ...s.profile, badges: s.profile.badges.map((badge) => (badge.id === id ? { ...badge, ...patch } : badge)) },
      dirty: true,
    })),

  removeBadge: (id) =>
    set((s) => ({
      profile: { ...s.profile, badges: s.profile.badges.filter((badge) => badge.id !== id) },
      dirty: true,
    })),

  applyTemplate: (template) =>
    set((s) => ({
      profile: {
        ...s.profile,
        accent: template.accent,
        layout: 'minimal',
        background: { ...s.profile.background, type: 'image', image: template.preview, overlay: 55, blur: 4 },
      },
      dirty: true,
    })),
}));
