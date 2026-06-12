import { profileApi } from '@/services/backend';

export const profileService = {
  getProfile: () => profileApi.current(),
  getPublicProfile: (username) => profileApi.public(username),
  updateProfile: (profile) => profileApi.update(profile),
  recordView: (username) => profileApi.recordView(username),
  recordLinkClick: (id) => profileApi.recordLinkClick(id),
  createLink: (link) => profileApi.createLink(link),
  updateLink: (id, patch) => profileApi.updateLink(id, patch),
  deleteLink: (id) => profileApi.deleteLink(id),
  reorderLinks: (ids) => profileApi.reorderLinks(ids),
  listProfiles: () => profileApi.leaderboard(),
};
