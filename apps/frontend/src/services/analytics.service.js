import { analyticsApi } from '@/services/backend';

export const analyticsService = {
  getAnalytics: (range = '30d') => analyticsApi.summary(range),
};
