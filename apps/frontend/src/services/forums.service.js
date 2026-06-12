import { forumApi } from '@/services/backend';

export const forumsService = {
  list: () => forumApi.list(),
  createThread: (payload) => forumApi.createThread(payload),
  getThread: (slug) => forumApi.getThread(slug),
  reply: (threadId, bodyMarkdown) => forumApi.reply(threadId, bodyMarkdown),
  updateThread: (id, patch) => forumApi.updateThread(id, patch),
};
