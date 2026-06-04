import { filesApi } from '@/services/backend';

const kindFromLabel = (label = '') => {
  const value = label.toLowerCase();
  if (value.includes('avatar')) return 'AVATAR';
  if (value.includes('banner')) return 'BANNER';
  if (value.includes('background')) return 'BACKGROUND_IMAGE';
  if (value.includes('video')) return 'BACKGROUND_VIDEO';
  if (value.includes('cover') || value.includes('album art')) return 'MUSIC_COVER';
  if (value.includes('audio') || value.includes('music')) return 'AUDIO';
  if (value.includes('cursor')) return 'CURSOR';
  if (value.includes('badge')) return 'BADGE_ICON';
  if (value.includes('template')) return 'TEMPLATE_PREVIEW';
  if (value.includes('og') || value.includes('metadata')) return 'METADATA_IMAGE';
  return 'OTHER';
};

export const filesService = {
  listFiles: () => filesApi.list(),
  deleteFile: (id) => filesApi.remove(id),
  uploadFile: (file, kind) => filesApi.upload(file, kind),
  async uploadAssetFile(file, label = 'Asset') {
    const asset = await filesApi.upload(file, kindFromLabel(label));
    return { ...asset, name: asset.originalName, size: asset.sizeBytes };
  },
  async uploadMockFile(file, label = 'Asset') {
    return this.uploadAssetFile(file, label);
  },
};
