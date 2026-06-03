import { authApi } from '@/services/backend';

export const authService = {
  login: (payload) => authApi.login(payload),
  register: (payload) => authApi.register(payload),
  logout: () => authApi.logout(),
  getCurrentUser: () => authApi.me(),
  getSessions: () => authApi.sessions(),
};
