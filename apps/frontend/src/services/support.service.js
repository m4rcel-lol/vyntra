import { supportApi } from '@/services/backend';

export const supportService = {
  myConversations: () => supportApi.myConversations(),
  adminConversations: () => supportApi.adminConversations(),
  create: (payload) => supportApi.create(payload),
  get: (id) => supportApi.get(id),
  sendMessage: (id, body) => supportApi.sendMessage(id, body),
  escalate: (id) => supportApi.escalate(id),
  accept: (id) => supportApi.accept(id),
  close: (id) => supportApi.close(id),
};
