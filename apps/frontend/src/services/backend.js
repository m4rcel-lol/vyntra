import { ABSTRACT, WALLPAPERS } from '@/mocks/assets';

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? '';

let csrfToken = window.localStorage.getItem('vyntra_csrf') ?? '';

export function setCsrfToken(token) {
  csrfToken = token ?? '';
  if (csrfToken) window.localStorage.setItem('vyntra_csrf', csrfToken);
  else window.localStorage.removeItem('vyntra_csrf');
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (csrfToken && !headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', csrfToken);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export const authApi = {
  async login({ identifier, password }) {
    const result = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    setCsrfToken(result.csrfToken);
    return { token: result.csrfToken, user: mapUser(result.user) };
  },

  async register({ username, email, password }) {
    const result = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email: email || undefined, password }),
    });
    setCsrfToken(result.csrfToken);
    return { token: result.csrfToken, user: mapUser(result.user) };
  },

  async me() {
    try {
      const result = await api('/api/auth/me');
      setCsrfToken(result.csrfToken);
      return mapUser(result.user);
    } catch {
      setCsrfToken(null);
      return null;
    }
  },

  async logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setCsrfToken(null);
    }
  },

  async sessions() {
    const result = await api('/api/auth/sessions');
    return result.sessions.map((session, index) => ({
      id: session.id,
      device: parseUserAgent(session.userAgent),
      current: index === 0,
      createdAt: session.createdAt,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
    }));
  },
};

export const profileApi = {
  async current() {
    return mapProfileResponse(await api('/api/profiles/me'));
  },

  async public(username) {
    return mapProfileResponse(await api(`/api/profiles/public/${encodeURIComponent(username)}`));
  },

  async update(profile) {
    return mapProfileResponse(await api('/api/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(profileToPatch(profile)),
    }));
  },

  async recordView(username) {
    return api(`/api/profiles/${encodeURIComponent(username)}/view`, { method: 'POST' });
  },

  async createLink(link) {
    const result = await api('/api/links', {
      method: 'POST',
      body: JSON.stringify({
        title: link.label || 'New Link',
        url: normalizeUrl(link.url),
        kind: iconToKind(link.icon),
        isVisible: true,
        style: { style: link.style ?? 'glass' },
      }),
    });
    return mapLink(result.link);
  },

  async updateLink(id, patch) {
    const body = {};
    if (patch.label !== undefined) body.title = patch.label;
    if (patch.url !== undefined) body.url = normalizeUrl(patch.url);
    if (patch.icon !== undefined) body.kind = iconToKind(patch.icon);
    if (patch.style !== undefined) body.style = { style: patch.style };
    if (patch.isVisible !== undefined) body.isVisible = patch.isVisible;

    const result = await api(`/api/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapLink(result.link);
  },

  async deleteLink(id) {
    await api(`/api/links/${id}`, { method: 'DELETE' });
  },

  async reorderLinks(ids) {
    await api('/api/links/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  async recordLinkClick(id) {
    await api(`/api/links/${id}/click`, { method: 'POST' });
  },

  async leaderboard() {
    const result = await api('/api/leaderboard');
    return result.profiles.map((profile) => ({
      ...profile,
      avatar: profile.avatar?.url || fallbackAvatar(profile.username),
      views: profile.viewCount,
    }));
  },
};

export const analyticsApi = {
  async summary(range = '30d') {
    const result = await api(`/api/analytics/summary?range=${encodeURIComponent(range)}`);
    return mapAnalytics(result, range);
  },
};

export const templateApi = {
  async list({ q = '', style = 'All' } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (style && style !== 'All') params.set('style', style.toLowerCase());
    const suffix = params.toString() ? `?${params}` : '';
    const result = await api(`/api/templates${suffix}`);
    return result.templates.map(mapTemplate);
  },

  async like(id) {
    return api(`/api/templates/${id}/like`, { method: 'POST' });
  },

  async import(id) {
    return api(`/api/templates/${id}/import`, { method: 'POST' });
  },

  async createFromProfile(payload) {
    const result = await api('/api/templates/from-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return result.template;
  },
};

export const blogApi = {
  async list() {
    const result = await api('/api/blog');
    return {
      posts: (result.posts ?? []).map(mapBlogPost),
      canManage: !!result.canManage,
    };
  },

  async get(slug) {
    const result = await api(`/api/blog/${encodeURIComponent(slug)}`);
    return {
      post: mapBlogPost(result.post),
      canManage: !!result.canManage,
    };
  },

  async create(payload) {
    const result = await api('/api/blog', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBlogPost(result.post);
  },

  async update(id, payload) {
    const result = await api(`/api/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapBlogPost(result.post);
  },

  async remove(id) {
    return api(`/api/blog/${id}`, { method: 'DELETE' });
  },

  async toggleLike(id) {
    return api(`/api/blog/${id}/like`, { method: 'POST' });
  },

  async pin(id, isPinned) {
    const result = await api(`/api/blog/${id}/pin`, {
      method: 'POST',
      body: JSON.stringify({ isPinned }),
    });
    return mapBlogPost(result.post);
  },
};

export const notificationApi = {
  async list() {
    const result = await api('/api/notifications');
    return result.notifications ?? [];
  },

  async clear() {
    return api('/api/notifications/clear', { method: 'POST' });
  },

  async markRead(id) {
    return api(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },
};

export const socialApi = {
  async myFriends() {
    const result = await api('/api/friends/me');
    return {
      friends: (result.friends ?? []).map(mapSocialUser),
      incomingCount: result.incomingCount ?? 0,
      outgoingCount: result.outgoingCount ?? 0,
    };
  },

  async publicFriends(username) {
    const result = await api(`/api/users/${encodeURIComponent(username)}/friends`);
    return {
      count: result.count ?? 0,
      state: result.state ?? 'guest',
      friends: (result.friends ?? []).map(mapSocialUser),
    };
  },

  async addFriend(username) {
    return api(`/api/users/${encodeURIComponent(username)}/friend`, { method: 'POST' });
  },

  async removeFriend(username) {
    return api(`/api/users/${encodeURIComponent(username)}/friend`, { method: 'DELETE' });
  },

  async conversations() {
    const result = await api('/api/messages/conversations');
    return (result.conversations ?? []).map(mapConversationSummary);
  },

  async conversation(id) {
    const result = await api(`/api/messages/conversations/${id}`);
    return {
      conversation: {
        ...result.conversation,
        friend: mapSocialUser(result.conversation?.friend),
      },
      messages: (result.messages ?? []).map(mapDirectMessage),
    };
  },

  async sendMessage(username, payload) {
    const messagePayload = typeof payload === 'string' ? { body: payload } : payload;
    const result = await api(`/api/messages/${encodeURIComponent(username)}`, {
      method: 'POST',
      body: JSON.stringify(messagePayload),
    });
    return {
      conversationId: result.conversationId,
      message: mapDirectMessage(result.message),
    };
  },
};

export const forumApi = {
  async list() {
    const result = await api('/api/forums');
    return (result.categories ?? []).map((category) => ({
      ...category,
      threads: (category.threads ?? []).map(mapForumThread),
    }));
  },

  async createThread(payload) {
    const result = await api('/api/forums/threads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapForumDetail(result);
  },

  async getThread(slug) {
    const result = await api(`/api/forums/threads/${encodeURIComponent(slug)}`);
    return mapForumDetail(result);
  },

  async reply(threadId, bodyMarkdown) {
    const result = await api(`/api/forums/threads/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ bodyMarkdown }),
    });
    return { post: mapForumPost(result.post) };
  },

  async updateThread(id, patch) {
    const result = await api(`/api/forums/threads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return mapForumDetail(result);
  },
};

export const supportApi = {
  async myConversations() {
    const result = await api('/api/support/conversations/me');
    return (result.conversations ?? []).map(mapSupportConversation);
  },

  async adminConversations() {
    const result = await api('/api/admin/support/conversations');
    return (result.conversations ?? []).map(mapSupportConversation);
  },

  async create(payload) {
    const result = await api('/api/support/conversations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapSupportConversation(result.conversation);
  },

  async get(id) {
    const result = await api(`/api/support/conversations/${id}`);
    return mapSupportConversation(result.conversation);
  },

  async sendMessage(id, body) {
    const result = await api(`/api/support/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    return mapSupportConversation(result.conversation);
  },

  async escalate(id) {
    const result = await api(`/api/support/conversations/${id}/escalate`, { method: 'POST' });
    return mapSupportConversation(result.conversation);
  },

  async accept(id) {
    const result = await api(`/api/support/conversations/${id}/accept`, { method: 'POST' });
    return mapSupportConversation(result.conversation);
  },

  async close(id) {
    const result = await api(`/api/support/conversations/${id}/close`, { method: 'POST' });
    return mapSupportConversation(result.conversation);
  },
};

export const filesApi = {
  async list() {
    const result = await api('/api/files');
    return result.files;
  },

  async upload(file, kind = 'OTHER') {
    const form = new FormData();
    form.append('file', file);
    const result = await api(`/api/files/upload?kind=${encodeURIComponent(kind)}`, {
      method: 'POST',
      body: form,
    });
    return result.file;
  },

  async remove(id) {
    return api(`/api/files/${id}`, { method: 'DELETE' });
  },
};

export const adminApi = {
  async stats() {
    return api('/api/admin/stats');
  },
  async users() {
    const result = await api('/api/admin/users');
    return result.users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email ?? '',
      avatar: user.profile?.assets?.avatar?.url || fallbackAvatar(user.username),
      role: user.role?.toLowerCase?.() ?? 'user',
      plan: 'Unlimited',
      status: user.isBanned ? 'suspended' : 'active',
      isBanned: !!user.isBanned,
      banReason: user.banReason ?? '',
      joined: user.createdAt,
      reports: 0,
      displayName: user.profile?.displayName ?? user.username,
      profileId: user.profile?.id ?? null,
      uid: user.profile?.uid ?? null,
      views: user.profile?.viewCount ?? 0,
      isPublic: user.profile?.isPublic ?? false,
      badges: (user.profile?.badges ?? []).map((entry) => mapAdminBadge(entry.badge ?? entry)),
    }));
  },
  async badges() {
    const result = await api('/api/admin/badges');
    return result.badges.map(mapAdminBadge);
  },
  async updateUser(id, patch) {
    const result = await api(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return result.user;
  },
  async upsertBadge(payload) {
    const result = await api('/api/admin/badges', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapAdminBadge(result.badge);
  },
  async assignBadge(profileId, badgeId) {
    return api('/api/admin/badges/assign', {
      method: 'POST',
      body: JSON.stringify({ profileId, badgeId }),
    });
  },
  async removeBadge(profileId, badgeId) {
    return api(`/api/admin/profiles/${profileId}/badges/${badgeId}`, { method: 'DELETE' });
  },
  async resetProfileViews(profileId, mode = 'zero') {
    return api(`/api/admin/profiles/${profileId}/views/reset`, {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },
  async reports() {
    const result = await api('/api/admin/reports');
    return result.reports;
  },
};

export async function dashboardData() {
  const [dashboard, analytics] = await Promise.all([
    api('/api/dashboard'),
    analyticsApi.summary('30d'),
  ]);
  const profile = mapDashboardProfile(dashboard);
  return {
    dashboard,
    analytics,
    user: mapUser({
      ...dashboard.user,
      displayName: profile.displayName,
      avatar: profile.avatar,
    }),
    profile,
  };
}

function mapUser(user) {
  const username = user?.username ?? 'user';
  const avatar = user?.avatar || user?.profile?.assets?.avatar?.url || user?.profile?.avatar?.url || fallbackAvatar(username);
  return {
    id: user?.id ?? username,
    username,
    displayName: user?.displayName ?? username,
    email: user?.email ?? '',
    avatar,
    role: String(user?.role ?? 'USER').toLowerCase(),
    plan: 'Unlimited',
    joinDate: user?.createdAt ?? new Date().toISOString(),
    profileId: user?.profileId ?? null,
  };
}

function parseUserAgent(userAgent = '') {
  if (!userAgent) return 'Unknown browser';
  const browser = userAgent.includes('Firefox')
    ? 'Firefox'
    : userAgent.includes('Edg/')
      ? 'Edge'
      : userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Safari')
          ? 'Safari'
          : 'Browser';
  const os = userAgent.includes('Mac OS X')
    ? 'macOS'
    : userAgent.includes('Windows')
      ? 'Windows'
      : userAgent.includes('iPhone') || userAgent.includes('iPad')
        ? 'iOS'
        : userAgent.includes('Android')
          ? 'Android'
          : 'Device';
  return `${os} · ${browser}`;
}

function mapDashboardProfile(dashboard) {
  return mapProfileResponse({
    profile: {
      ...dashboard.profile,
      username: dashboard.user.username,
      assets: dashboard.profile.assets ?? {},
    },
    links: dashboard.profile.links ?? [],
    badges: (dashboard.profile.badges ?? []).map((entry) => entry.badge ?? entry),
  });
}

function mapProfileResponse(response) {
  const profile = response.profile;
  const assets = profile.assets ?? {};
  const theme = asObject(profile.theme);
  const effects = asObject(profile.effects);
  const metadata = asObject(profile.metadata);
  const username = profile.username;
  const avatar = assets.avatar?.url || fallbackAvatar(username);
  const banner = assets.banner?.url || ABSTRACT.fluid2;
  const backgroundAsset = assets.background;
  const isVideo = backgroundAsset?.mimeType?.startsWith?.('video/');
  const isGif = backgroundAsset?.mimeType === 'image/gif';
  const backgroundUrl = backgroundAsset?.url || '';
  const accent = hexToHsl(theme.accentColor || '#ffffff');
  const particleMode = effectParticleMode(effects);
  const cursorTrailMode = normalizeCursorTrail(effects.cursorTrail);
  const musicActivity = asObject(profile.musicActivity);
  const audioMetadata = asObject(assets.audio?.metadata);
  const embeddedCover = asObject(audioMetadata.cover);
  const audioUrl = assets.audio?.url || '';
  const hasMusic = Boolean(audioUrl);
  const musicTitle = cleanTrackTitle(musicActivity.title || audioMetadata.title || titleFromAsset(assets.audio));
  const musicArtist = cleanTrackTitle(musicActivity.artist || audioMetadata.artist || username);
  const musicCover = assets.musicCover?.url || musicActivity.cover || embeddedCover.url || '';
  const musicCoverFileId = assets.musicCover?.id ?? musicActivity.coverFileId ?? embeddedCover.fileId ?? null;

  return {
    id: profile.id,
    username,
    displayName: profile.displayName || username,
    bio: profile.bio || '',
    location: profile.location || '',
    status: '',
    avatar,
    banner,
    joinDate: profile.joinedAt || profile.createdAt || new Date().toISOString(),
    uid: String(profile.uid ?? '').padStart(7, '0'),
    views: profile.viewCount ?? 0,
    accent,
    layout: 'minimal',
    background: mapProfileBackground({ effects, backgroundAsset, backgroundUrl, banner, isVideo, isGif }),
    effects: {
      glowBorder: theme.borderGlow !== false,
      floating: effects.hoverAnimation !== 'none',
      particles: ['sparkles', 'bubbles', 'shapes'].includes(particleMode),
      particleMode,
      particleDensity: clampNumber(effects.particleDensity, 10, 90, 32),
      particleSpeed: clampNumber(effects.particleSpeed, 0.5, 2, 1),
      effectIntensity: clampNumber(effects.effectIntensity, 0.2, 1, 0.7),
      snow: particleMode === 'snow',
      rain: particleMode === 'rain',
      stars: particleMode === 'stars',
      cursorTrail: cursorTrailMode !== 'none',
      cursorTrailMode,
      clickToEnter: !!profile.clickToEnter,
      pageEntrance: effects.entranceAnimation !== 'none',
      entranceAnimation: effects.entranceAnimation || 'scale',
      hoverAnimation: effects.hoverAnimation || 'lift',
      backgroundAnimation: effects.backgroundAnimation || 'none',
    },
    links: (response.links ?? []).map(mapLink),
    badges: (response.badges ?? []).map(mapBadge),
    music: {
      enabled: hasMusic,
      title: hasMusic ? musicTitle : '',
      artist: hasMusic ? musicArtist : '',
      cover: hasMusic ? musicCover : '',
      coverFileId: hasMusic ? musicCoverFileId : null,
      loop: musicActivity.loop !== false,
      volume: Number.isFinite(Number(musicActivity.volume)) ? Math.max(0, Math.min(100, Number(musicActivity.volume))) : 45,
      src: audioUrl,
    },
    embeds: {},
    metadata: {
      title: typeof metadata.title === 'string' ? metadata.title : '',
      description: typeof metadata.description === 'string' ? metadata.description : '',
      ogImage: assets.metadata?.url || metadata.ogImage || '',
    },
    advanced: {
      customCss: profile.sanitizedCss || '',
      customCursor: assets.cursor?.url || '',
      visibility: profile.isPublic === false ? 'private' : 'public',
      seo: true,
    },
    assetIds: {
      avatarFileId: assets.avatar?.id ?? null,
      bannerFileId: assets.banner?.id ?? null,
      backgroundFileId: assets.background?.id ?? null,
      audioFileId: assets.audio?.id ?? null,
      musicCoverFileId: musicCoverFileId,
      cursorFileId: assets.cursor?.id ?? null,
      metadataFileId: assets.metadata?.id ?? null,
    },
  };
}

function profileToPatch(profile) {
  const background = profile.background ?? {};
  const particleMode = effectParticleMode(profile.effects);
  const cursorTrailMode = profile.effects?.cursorTrail
    ? (profile.effects.cursorTrailMode || 'glow')
    : 'none';

  return {
    displayName: profile.displayName,
    bio: profile.bio,
    location: profile.location,
    musicActivity: profile.music ? {
      title: profile.music.title || '',
      artist: profile.music.artist || '',
      cover: profile.music.cover || '',
      coverFileId: profile.music.coverFileId || profile.assetIds?.musicCoverFileId || null,
      loop: profile.music.loop !== false,
      volume: Math.max(0, Math.min(100, Number(profile.music.volume ?? 45))),
    } : undefined,
    layout: 'minimal-text',
    clickToEnter: !!profile.effects?.clickToEnter,
    isPublic: profile.advanced?.visibility !== 'private',
    theme: {
      accentColor: hslToHex(profile.accent),
      textColor: '#ffffff',
      cardBackground: '#0b0b0b',
      cardOpacity: 0.76,
      cardBlur: 24,
      borderRadius: 26,
      borderColor: '#ffffff22',
      borderGlow: !!profile.effects?.glowBorder,
      buttonStyle: 'glass',
    },
    effects: {
      blurOverlay: profile.background?.blur > 0,
      darkOverlay: Math.max(0, Math.min(0.9, (profile.background?.overlay ?? 45) / 100)),
      particles: particleMode,
      particleDensity: clampNumber(profile.effects?.particleDensity, 10, 90, 32),
      particleSpeed: clampNumber(profile.effects?.particleSpeed, 0.5, 2, 1),
      effectIntensity: clampNumber(profile.effects?.effectIntensity, 0.2, 1, 0.7),
      cursorTrail: cursorTrailMode,
      entranceAnimation: profile.effects?.pageEntrance ? (profile.effects?.entranceAnimation || 'scale') : 'none',
      hoverAnimation: profile.effects?.floating ? (profile.effects?.hoverAnimation || 'lift') : 'none',
      pageTransition: 'fade',
      backgroundAnimation: profile.effects?.backgroundAnimation || 'none',
      background: {
        type: background.type || 'gradient',
        color: background.color || '0 0% 4%',
        gradient: background.gradient || '',
        image: background.image || '',
        video: background.video || '',
        blur: clampNumber(background.blur, 0, 24, 0),
        overlay: clampNumber(background.overlay, 0, 100, 45),
      },
    },
    metadata: {
      title: profile.metadata?.title,
      description: profile.metadata?.description,
      ogImage: profile.metadata?.ogImage || '',
    },
    embeds: [],
    customCss: profile.advanced?.customCss ?? '',
    avatarFileId: assetIdPatchValue(profile, 'avatarFileId'),
    bannerFileId: assetIdPatchValue(profile, 'bannerFileId'),
    backgroundFileId: assetIdPatchValue(profile, 'backgroundFileId'),
    audioFileId: assetIdPatchValue(profile, 'audioFileId'),
    cursorFileId: assetIdPatchValue(profile, 'cursorFileId'),
    metadataFileId: assetIdPatchValue(profile, 'metadataFileId'),
  };
}

function assetIdPatchValue(profile, key) {
  const value = profile.assetIds?.[key];
  return value === undefined ? undefined : value;
}

function mapProfileBackground({ effects, backgroundAsset, backgroundUrl, banner, isVideo, isGif }) {
  const saved = asObject(effects.background);
  const savedType = ['solid', 'gradient', 'image', 'gif', 'video'].includes(saved.type) ? saved.type : '';
  const assetType = isVideo ? 'video' : isGif ? 'gif' : backgroundUrl ? 'image' : '';
  const type = savedType || assetType || 'gradient';
  const fallbackGradient = 'linear-gradient(135deg, #050505 0%, #111111 50%, #050505 100%)';

  const image = backgroundAsset
    ? (isVideo ? (saved.image || banner) : backgroundUrl)
    : (type === 'image' || type === 'gif' ? saved.image || backgroundUrl : '');

  return {
    type,
    color: saved.color || '0 0% 4%',
    gradient: saved.gradient || fallbackGradient,
    image,
    video: backgroundAsset && isVideo ? backgroundUrl : (type === 'video' ? saved.video || '' : ''),
    blur: clampNumber(saved.blur, 0, 24, effects.blurOverlay ? 4 : 0),
    overlay: clampNumber(saved.overlay, 0, 100, Math.round((Number(effects.darkOverlay ?? 0.45)) * 100)),
  };
}

function normalizeParticleMode(value) {
  const mode = String(value || '').toLowerCase();
  return ['none', 'snow', 'rain', 'stars', 'bubbles', 'sparkles', 'shapes'].includes(mode) ? mode : 'stars';
}

function normalizeCursorTrail(value) {
  const mode = String(value || '').toLowerCase();
  return ['none', 'glow', 'stars', 'dots'].includes(mode) ? mode : 'none';
}

function effectParticleMode(effects = {}) {
  const explicit = normalizeParticleMode(effects.particleMode);
  if (explicit !== 'stars' || effects.particleMode) return explicit;
  if (effects.snow) return 'snow';
  if (effects.rain) return 'rain';
  if (effects.stars) return 'stars';
  if (effects.particles) return 'sparkles';
  return 'none';
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function mapLink(link) {
  const kind = String(link.kind || 'website').toLowerCase();
  const style = typeof link.style === 'string' ? link.style : asObject(link.style).style;
  const label = link.label || link.title || 'Link';
  return {
    id: link.id,
    label,
    title: label,
    url: link.url,
    icon: link.iconName || kindToIcon(kind, label),
    iconUrl: link.icon?.url || link.iconUrl || '',
    style: style || 'glass',
    clicks: link.clickCount ?? 0,
    isVisible: link.isVisible !== false,
  };
}

function mapBadge(badge) {
  return {
    id: badge.id,
    slug: badge.slug || '',
    label: badge.name || 'Badge',
    color: hexToHsl(badge.color || '#ffffff'),
    tooltip: badge.tooltip || badge.name || 'Badge',
    glow: true,
    icon: badgeToIcon(badge.slug || badge.name || ''),
  };
}

function mapAdminBadge(badge) {
  return {
    id: badge.id,
    slug: badge.slug || '',
    name: badge.name || 'Badge',
    label: badge.name || 'Badge',
    description: badge.description || '',
    tooltip: badge.tooltip || badge.name || 'Badge',
    color: badge.color || '#ffffff',
    glowColor: badge.glowColor || '#ffffff',
    iconFileId: badge.iconFileId ?? null,
    isGlobal: !!badge.isGlobal,
    assignmentCount: badge.assignmentCount ?? 0,
    createdAt: badge.createdAt,
    updatedAt: badge.updatedAt,
    icon: badgeToIcon(badge.slug || badge.name || ''),
  };
}

function mapAnalytics(result, range) {
  const days = result.days ?? rangeToDays(range);
  const visitorsByDay = new Map((result.visitorsOverTime ?? []).map((row) => [row.day, row.visitors ?? 0]));
  const viewsOverTime = fillDays(result.viewsOverTime ?? [], 'views', days).map((row) => ({
    ...row,
    visitors: visitorsByDay.get(row.date) ?? 0,
  }));
  const clicksOverTime = fillDays(result.clicksOverTime ?? [], 'clicks', days);
  const templateImports = fillDays(result.templateImportsOverTime ?? [], 'imports', days);
  const deltas = result.totals?.deltas ?? {};
  const totals = {
    views: result.totals?.profileViews ?? 0,
    uniqueVisitors: result.totals?.uniqueVisitors ?? 0,
    linkClicks: result.totals?.linkClicks ?? 0,
    ctr: result.totals?.ctr ?? 0,
    viewsDelta: deltas.profileViews ?? 0,
    visitorsDelta: deltas.uniqueVisitors ?? 0,
    clicksDelta: deltas.linkClicks ?? 0,
    ctrDelta: deltas.ctr ?? 0,
  };
  const deviceTotal = (result.devices ?? []).reduce((sum, item) => sum + item.count, 0) || 1;

  return {
    range,
    totals,
    viewsOverTime,
    clicksOverTime,
    topCountries: (result.countries ?? []).map((item) => ({ country: item.country || 'Unknown', code: item.country || '??', value: item.count })),
    deviceTypes: (result.devices ?? []).map((item) => ({ name: item.device || 'Unknown', value: Math.round((item.count / deviceTotal) * 100) })),
    browsers: (result.browsers ?? []).map((item) => ({ name: item.browser || 'Unknown', value: item.count })),
    referrers: (result.topReferrers ?? []).map((item) => ({ name: item.referrer || 'Direct', value: item.count })),
    mostClickedLinks: (result.links ?? []).map((item) => ({ label: item.title, clicks: item.clickCount, icon: kindToIcon(item.kind, item.title) })),
    templateImports,
  };
}

function mapTemplate(template) {
  return {
    id: template.id,
    name: template.name,
    author: template.ownerUsername || 'community',
    authorAvatar: template.ownerAvatar?.url || fallbackAvatar(template.ownerUsername || 'community'),
    category: capitalize(template.style || 'dark'),
    style: capitalize(template.style || 'dark'),
    preview: template.preview?.url || WALLPAPERS.mesh2,
    accent: '0 0% 90%',
    layout: 'minimal',
    uses: template.importCount ?? 0,
    likes: template.likeCount ?? 0,
    tags: template.tags ?? [template.style || 'dark'],
    description: template.description,
  };
}

function mapBlogPost(post) {
  const authorUsername = post.author?.username || 'staff';
  return {
    id: post.id,
    slug: post.slug,
    title: post.title || 'Untitled post',
    excerpt: post.excerpt || '',
    contentMarkdown: post.contentMarkdown || '',
    isPublished: post.isPublished !== false,
    isPinned: !!post.isPinned,
    likeCount: post.likeCount ?? 0,
    likedByMe: !!post.likedByMe,
    publishedAt: post.publishedAt || post.createdAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: {
      id: post.author?.id || authorUsername,
      username: authorUsername,
      role: String(post.author?.role || 'ADMIN').toLowerCase(),
      displayName: post.author?.displayName || authorUsername,
      avatar: post.author?.avatar?.url || fallbackAvatar(authorUsername),
    },
  };
}

function mapSocialUser(user = {}) {
  const username = user.username || 'user';
  return {
    id: user.id || username,
    username,
    role: String(user.role || 'USER').toLowerCase(),
    displayName: user.displayName || username,
    profileId: user.profileId || null,
    uid: user.uid ?? null,
    avatar: user.avatar?.url || fallbackAvatar(username),
  };
}

function mapConversationSummary(conversation = {}) {
  return {
    id: conversation.id,
    friend: mapSocialUser(conversation.friend),
    lastMessage: conversation.lastMessage ? mapDirectMessage(conversation.lastMessage) : null,
    updatedAt: conversation.updatedAt,
  };
}

function mapDirectMessage(message = {}) {
  return {
    id: message.id,
    body: message.body || '',
    readAt: message.readAt || null,
    createdAt: message.createdAt,
    sender: mapSocialUser(message.sender),
    attachment: message.attachment ? mapAsset(message.attachment) : null,
    replyTo: message.replyTo ? {
      id: message.replyTo.id,
      body: message.replyTo.body || '',
      createdAt: message.replyTo.createdAt,
      sender: mapSocialUser(message.replyTo.sender),
      attachment: message.replyTo.attachment ? mapAsset(message.replyTo.attachment) : null,
    } : null,
  };
}

function mapAsset(asset = {}) {
  return {
    id: asset.id,
    publicId: asset.publicId,
    url: asset.url,
    mimeType: asset.mimeType || 'application/octet-stream',
    kind: String(asset.kind || 'OTHER').toLowerCase(),
    originalName: asset.originalName || 'Attachment',
    sizeBytes: asset.sizeBytes ?? 0,
    metadata: asset.metadata || {},
  };
}

function mapForumThread(thread = {}) {
  return {
    id: thread.id,
    slug: thread.slug,
    title: thread.title || 'Untitled thread',
    excerpt: thread.excerpt || '',
    bodyMarkdown: thread.bodyMarkdown || '',
    isPinned: !!thread.isPinned,
    isLocked: !!thread.isLocked,
    replyCount: thread.replyCount ?? 0,
    viewCount: thread.viewCount ?? 0,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    category: thread.category,
    author: mapSocialUser(thread.author),
  };
}

function mapForumPost(post = {}) {
  return {
    id: post.id,
    bodyMarkdown: post.bodyMarkdown || '',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: mapSocialUser(post.author),
  };
}

function mapForumDetail(result = {}) {
  return {
    thread: mapForumThread(result.thread),
    posts: (result.posts ?? []).map(mapForumPost),
  };
}

function mapSupportConversation(conversation = {}) {
  return {
    id: conversation.id,
    subject: conversation.subject || 'Support request',
    status: String(conversation.status || 'BOT').toLowerCase(),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    closedAt: conversation.closedAt || null,
    requester: mapSocialUser(conversation.requester),
    assignedStaff: conversation.assignedStaff ? mapSocialUser(conversation.assignedStaff) : null,
    messages: (conversation.messages ?? []).map((message) => ({
      id: message.id,
      authorRole: String(message.authorRole || 'BOT').toLowerCase(),
      body: message.body || '',
      createdAt: message.createdAt,
      author: message.author ? mapSocialUser(message.author) : null,
    })),
  };
}

function rangeToDays(range) {
  if (range === '7d') return 7;
  if (range === '90d') return 90;
  return 30;
}

function fillDays(rows, key, days = 30) {
  const byDay = new Map(rows.map((row) => [row.day, row[key] ?? 0]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const iso = date.toISOString().slice(0, 10);
    return {
      date: iso,
      label: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      [key]: byDay.get(iso) ?? 0,
    };
  });
}

function mapLayout(layout) {
  switch (layout) {
    case 'wide-horizontal': return 'wide';
    case 'minimal-text':
    case 'compact': return 'minimal';
    case 'split-sidebar': return 'sidebar';
    case 'floating-card': return 'floating';
    case 'terminal': return 'terminal';
    case 'portfolio-grid': return 'portfolio';
    case 'spotlight': return 'spotlight';
    case 'stacked-links': return 'stacked';
    case 'editorial': return 'editorial';
    default: return 'minimal';
  }
}

function unmapLayout(layout) {
  switch (layout) {
    case 'wide': return 'wide-horizontal';
    case 'minimal': return 'minimal-text';
    case 'sidebar': return 'split-sidebar';
    case 'floating': return 'floating-card';
    case 'terminal': return 'terminal';
    case 'portfolio': return 'portfolio-grid';
    case 'spotlight': return 'spotlight';
    case 'stacked': return 'stacked-links';
    case 'editorial': return 'editorial';
    default: return 'minimal-text';
  }
}

function kindToIcon(kind, title = '') {
  const value = `${kind} ${title}`.toLowerCase();
  if (value.includes('github')) return 'Github';
  if (value.includes('youtube')) return 'Youtube';
  if (value.includes('instagram')) return 'Instagram';
  if (value.includes('twitch')) return 'Twitch';
  if (value.includes('spotify') || value.includes('music')) return 'Music';
  if (value.includes('discord')) return 'Disc';
  if (value.includes('telegram')) return 'Send';
  if (value.includes('email') || value.includes('mail')) return 'Mail';
  if (value.includes('twitter') || value.includes('x')) return 'Twitter';
  return 'Globe';
}

function iconToKind(icon = 'Globe') {
  return String(icon).toLowerCase();
}

function badgeToIcon(input) {
  const value = String(input).toLowerCase();
  if (value.includes('owner')) return 'Crown';
  if (value.includes('staff')) return 'ShieldCheck';
  if (value.includes('verified')) return 'BadgeCheck';
  if (value.includes('developer')) return 'Code2';
  if (value.includes('artist')) return 'Palette';
  if (value.includes('music')) return 'Music';
  if (value.includes('gamer')) return 'Gamepad2';
  if (value.includes('unlimited')) return 'Infinity';
  return 'Star';
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function titleFromAsset(asset) {
  const name = asset?.metadata?.title || asset?.originalName || '';
  return cleanTrackTitle(String(name).replace(/\.[^/.]+$/, ''));
}

function cleanTrackTitle(value) {
  return String(value || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(value) {
  if (!value || value === 'https://') return 'https://example.com';
  return value;
}

function fallbackAvatar(username) {
  const label = encodeURIComponent(String(username || 'V').slice(0, 2).toUpperCase());
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="36" fill="#111"/><circle cx="80" cy="80" r="72" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="2"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Inter,Arial,sans-serif" font-size="46" font-weight="800">${label}</text></svg>`)}`;
}

function hexToHsl(hex) {
  const normalized = String(hex || '#ffffff').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return '0 0% 96%';
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl) {
  const [hRaw, sRaw, lRaw] = String(hsl || '0 0% 96%').match(/[\d.]+/g)?.map(Number) ?? [0, 0, 96];
  const h = hRaw / 360;
  const s = sRaw / 100;
  const l = lRaw / 100;
  if (s === 0) {
    const value = Math.round(l * 255).toString(16).padStart(2, '0');
    return `#${value}${value}${value}`;
  }
  const hue2rgb = (p, q, t) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);
  return `#${[r, g, b].map((value) => Math.round(value * 255).toString(16).padStart(2, '0')).join('')}`;
}

function capitalize(value) {
  const text = String(value || '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
