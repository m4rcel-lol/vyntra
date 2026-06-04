import { adminApi } from '@/services/backend';

export const adminService = {
  getAdminStats: () => adminApi.stats(),
  getUsers: () => adminApi.users(),
  getBadges: () => adminApi.badges(),
  getReports: () => adminApi.reports(),
  updateUser: (id, patch) => adminApi.updateUser(id, patch),
  upsertBadge: (payload) => adminApi.upsertBadge(payload),
  assignBadge: (profileId, badgeId) => adminApi.assignBadge(profileId, badgeId),
  removeBadge: (profileId, badgeId) => adminApi.removeBadge(profileId, badgeId),
  resetProfileViews: (profileId, mode) => adminApi.resetProfileViews(profileId, mode),
  async getModerationQueue() {
    return { profiles: [], templates: [] };
  },
  async getAnnouncements() {
    return [];
  },
  async getAuditLog() {
    return [];
  },
};
