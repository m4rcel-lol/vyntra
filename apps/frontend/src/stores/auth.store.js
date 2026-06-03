import { create } from 'zustand';
import { authService } from '@/services/auth.service';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  checked: false,
  error: null,

  async refresh() {
    set({ loading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: !!user, checked: true, loading: false, error: null });
      return user;
    } catch (e) {
      set({ user: null, isAuthenticated: false, checked: true, loading: false, error: e.message || 'Session check failed' });
      return null;
    }
  },

  async login(payload) {
    set({ loading: true, error: null });
    try {
      const { user } = await authService.login(payload);
      set({ user, isAuthenticated: true, checked: true, loading: false });
      return user;
    } catch (e) {
      set({ loading: false, error: e.message || 'Login failed' });
      throw e;
    }
  },

  async register(payload) {
    set({ loading: true, error: null });
    try {
      const { user } = await authService.register(payload);
      set({ user, isAuthenticated: true, checked: true, loading: false });
      return user;
    } catch (e) {
      set({ loading: false, error: e.message || 'Registration failed' });
      throw e;
    }
  },

  async logout() {
    await authService.logout();
    set({ user: null, isAuthenticated: false, checked: true });
  },

  clearError: () => set({ error: null }),
}));
