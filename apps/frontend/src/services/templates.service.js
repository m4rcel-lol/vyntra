import { templateApi } from '@/services/backend';

export const templatesService = {
  getTemplates: (query) => templateApi.list(query),
  getTemplate: async (id) => (await templateApi.list()).find((template) => template.id === id),
  createFromProfile: (payload) => templateApi.createFromProfile(payload),
  importTemplate: (id) => templateApi.import(id),
  likeTemplate: (id) => templateApi.like(id),
};
