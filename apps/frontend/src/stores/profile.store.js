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
  deletedLinkIds: [],

  async loadCurrentProfile() {
    set({ loading: true, error: null });
    try {
      const profile = await profileService.getProfile();
      set({ profile, loading: false, dirty: false, deletedLinkIds: [] });
      return profile;
    } catch (e) {
      set({ loading: false, error: e.message || 'Could not load profile' });
      throw e;
    }
  },

  async saveProfile() {
    set({ saving: true, error: null });
    try {
      const draft = get().profile;
      const deletedLinkIds = get().deletedLinkIds;
      validateProfileLinks(draft.links);
      await profileService.updateProfile(draft);
      await syncProfileLinks(draft.links, deletedLinkIds);
      const profile = await profileService.getProfile();
      set({ profile, saving: false, dirty: false, deletedLinkIds: [] });
      return profile;
    } catch (e) {
      set({ saving: false, error: e.message || 'Could not save profile' });
      throw e;
    }
  },

  setProfile: (profile) => set({ profile, dirty: true }),

  reset: () =>
    set((s) => {
      const defaults = createDefaultProfile();
      const assetIds = {
        ...(s.profile.assetIds ?? {}),
        backgroundFileId: null,
        audioFileId: null,
        musicCoverFileId: null,
        cursorFileId: null,
        metadataFileId: null,
      };
      return {
        profile: {
          ...defaults,
          id: s.profile.id,
          username: s.profile.username,
          uid: s.profile.uid,
          joinDate: s.profile.joinDate,
          views: s.profile.views,
          avatar: s.profile.avatar,
          banner: s.profile.banner,
          links: s.profile.links,
          badges: s.profile.badges,
          music: { enabled: false, title: '', artist: '', cover: '', coverFileId: null, loop: true, volume: 45, src: '' },
          metadata: { title: '', description: '', ogImage: '' },
          assetIds,
        },
        dirty: true,
      };
    }),

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
  },

  updateLink: (id, patch) => {
    set((s) => ({
      profile: { ...s.profile, links: s.profile.links.map((link) => (link.id === id ? { ...link, ...patch } : link)) },
      dirty: true,
    }));
  },

  removeLink: (id) => {
    set((s) => ({
      profile: { ...s.profile, links: s.profile.links.filter((link) => link.id !== id) },
      deletedLinkIds: String(id).startsWith('tmp_')
        ? s.deletedLinkIds
        : [...new Set([...s.deletedLinkIds, id])],
      dirty: true,
    }));
  },

  reorderLinks: (from, to) => {
    set((s) => {
      const links = [...s.profile.links];
      if (from < 0 || to < 0 || from >= links.length || to >= links.length || from === to) {
        return s;
      }
      const [moved] = links.splice(from, 1);
      links.splice(to, 0, moved);
      return { profile: { ...s.profile, links }, dirty: true };
    });
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

async function syncProfileLinks(links = [], deletedLinkIds = []) {
  validateProfileLinks(links);

  await Promise.all([...new Set(deletedLinkIds)].map((id) => profileService.deleteLink(id)));

  const savedLinks = [];
  for (const link of links) {
    const payload = {
      label: String(link.label || '').trim(),
      url: String(link.url || '').trim(),
      icon: link.icon || 'Globe',
      style: link.style || 'glass',
      isVisible: link.isVisible !== false,
    };
    const saved = String(link.id).startsWith('tmp_')
      ? await profileService.createLink(payload)
      : await profileService.updateLink(link.id, payload);
    savedLinks.push(saved);
  }

  const orderedIds = savedLinks.map((link) => link.id).filter(Boolean);
  if (orderedIds.length > 1) {
    await profileService.reorderLinks(orderedIds);
  }
}

function validateProfileLinks(links = []) {
  for (const link of links) {
    if (!String(link.label || '').trim()) {
      throw new Error('Every link needs a title before saving.');
    }
    if (!String(link.url || '').trim()) {
      throw new Error('Every link needs a URL before saving.');
    }
    if (!isAllowedUrl(link.url)) {
      throw new Error(`"${link.label || 'Link'}" needs a valid URL before saving.`);
    }
  }
}

function isAllowedUrl(value) {
  const normalized = !value || value === 'https://' ? 'https://example.com' : String(value).trim();
  try {
    const url = new URL(normalized);
    return ['http:', 'https:', 'mailto:', 'bitcoin:', 'ethereum:'].includes(url.protocol);
  } catch {
    return false;
  }
}
