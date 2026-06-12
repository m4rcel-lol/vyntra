import { blogApi } from '@/services/backend';

export const blogService = {
  listPosts: () => blogApi.list(),
  getPost: (slug) => blogApi.get(slug),
  createPost: (payload) => blogApi.create(payload),
  updatePost: (id, payload) => blogApi.update(id, payload),
  deletePost: (id) => blogApi.remove(id),
  toggleLike: (id) => blogApi.toggleLike(id),
  setPinned: (id, isPinned) => blogApi.pin(id, isPinned),
};
