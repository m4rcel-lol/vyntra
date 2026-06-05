import { notificationApi } from '@/services/backend';

export const notificationsService = {
  list: () => notificationApi.list(),
  clear: () => notificationApi.clear(),
  markRead: (id) => notificationApi.markRead(id),
};
