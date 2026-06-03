import { create } from 'zustand';
import { storage } from '@/utils/storage';

const saved = storage.get('settings') || {};

const defaults = {
  account: { displayName: 'Nova Sterling', email: 'nova@vyntra.bio', language: 'en' },
  appearance: { reduceMotion: false, glassIntensity: 70, accent: '0 0% 98%', compact: false },
  notifications: { profileViews: true, linkClicks: false, newFollowers: true, productUpdates: true, weeklyDigest: false },
  privacy: { searchable: true, showViewCount: true, showJoinDate: true, allowMessages: true, analyticsSharing: false },
  security: { twoFactor: false, loginAlerts: true },
};

export const useSettingsStore = create((set) => ({
  ...defaults,
  ...saved,
  setGroup: (group, patch) =>
    set((s) => {
      const next = { ...s, [group]: { ...s[group], ...patch } };
      storage.set('settings', {
        account: next.account,
        appearance: next.appearance,
        notifications: next.notifications,
        privacy: next.privacy,
        security: next.security,
      });
      return { [group]: next[group] };
    }),
}));
