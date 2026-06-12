import { WALLPAPERS, PORTRAITS, ABSTRACT } from './assets';
import { mockBadges } from './badges.mock';
import { linkCatalogue } from './links.mock';

const pickLinks = (ids) => ids.map((id) => ({ ...linkCatalogue.find((l) => l.id === id) }));
const pickBadges = (ids) => ids.map((id) => ({ ...mockBadges.find((b) => b.id === id) }));

export const defaultBackground = {
  type: 'gradient',
  color: '0 0% 4%',
  gradient: 'linear-gradient(135deg, #0b0b0f 0%, #16161c 50%, #0a0a0c 100%)',
  image: '',
  video: '',
  blur: 0,
  overlay: 30,
};

export const defaultEffects = {
  glowBorder: true,
  floating: true,
  particles: true,
  particleMode: 'sparkles',
  particleDensity: 32,
  particleSpeed: 1,
  effectIntensity: 0.7,
  snow: false,
  rain: false,
  stars: true,
  cursorTrail: false,
  cursorTrailMode: 'glow',
  clickToEnter: true,
  pageEntrance: true,
  entranceAnimation: 'scale',
  hoverAnimation: 'lift',
  backgroundAnimation: 'none',
};

// Factory used by the editor store to spin up a fresh profile.
export const createDefaultProfile = (overrides = {}) => ({
  id: 'pr_new',
  username: 'yourname',
  displayName: 'Your Name',
  bio: 'Tell the world who you are in a sentence.',
  location: 'Earth',
  status: '',
  avatar: PORTRAITS.p2,
  banner: ABSTRACT.fluid1,
  joinDate: new Date().toISOString().slice(0, 10),
  uid: '0000001',
  views: 0,
  accent: '262 83% 66%',
  layout: 'minimal',
  background: { ...defaultBackground },
  effects: { ...defaultEffects },
  links: pickLinks(['l_x', 'l_ig', 'l_gh']),
  badges: pickBadges(['b_early']),
  music: { enabled: false, title: 'Midnight Drive', artist: 'Neon Tide', cover: WALLPAPERS.mesh1, loop: true, volume: 50, src: '' },
  metadata: { title: 'Your Name · Vyntra', description: 'My links, my world.', ogImage: ABSTRACT.hero },
  advanced: { customCss: '', customCursor: '', visibility: 'public', seo: true },
  ...overrides,
});

/** Three fully designed public profiles. */
export const mockProfiles = {
  nova: {
    id: 'pr_nova',
    username: 'nova',
    displayName: 'Nova Sterling',
    bio: 'Digital artist & 3D motion designer. I make worlds glow.',
    location: 'Berlin, DE',
    status: '',
    avatar: PORTRAITS.p5,
    banner: ABSTRACT.fluid2,
    joinDate: '2023-03-14',
    uid: '0000042',
    views: 184230,
    accent: '276 84% 66%',
    layout: 'minimal',
    background: { type: 'image', color: '0 0% 4%', gradient: '', image: WALLPAPERS.mesh3, video: '', blur: 4, overlay: 55 },
    effects: { glowBorder: true, floating: true, particles: true, snow: false, rain: false, stars: true, cursorTrail: true, clickToEnter: true, pageEntrance: true },
    links: pickLinks(['l_ig', 'l_x', 'l_yt', 'l_web']),
    badges: pickBadges(['b_verified', 'b_unlimited', 'b_artist', 'b_top']),
    music: { enabled: true, title: 'Aurora', artist: 'Saint Pepsi', cover: WALLPAPERS.mesh1, loop: true, volume: 40, src: '' },
    metadata: { title: 'Nova Sterling · 3D Artist', description: 'Worlds that glow.', ogImage: ABSTRACT.fluid2 },
    advanced: { customCss: '', customCursor: '', visibility: 'public', seo: true },
  },
  kairo: {
    id: 'pr_kairo',
    username: 'kairo',
    displayName: 'Kairo',
    bio: 'Indie game dev. Variety streamer. Building pixel dreams at 3am.',
    location: 'Tokyo, JP',
    status: '',
    avatar: PORTRAITS.p6,
    banner: WALLPAPERS.cyber1,
    joinDate: '2023-08-02',
    uid: '0000128',
    views: 92140,
    accent: '190 95% 55%',
    layout: 'minimal',
    background: { type: 'image', color: '0 0% 3%', gradient: '', image: WALLPAPERS.cyber2, video: '', blur: 2, overlay: 62 },
    effects: { glowBorder: true, floating: false, particles: true, snow: false, rain: true, stars: false, cursorTrail: false, clickToEnter: true, pageEntrance: true },
    links: pickLinks(['l_tw', 'l_yt', 'l_dc', 'l_gh', 'l_x']),
    badges: pickBadges(['b_verified', 'b_dev', 'b_og']),
    music: { enabled: true, title: 'Neon Rain', artist: 'HOME', cover: WALLPAPERS.cyber3, loop: true, volume: 35, src: '' },
    metadata: { title: 'Kairo · Game Dev', description: 'Pixel dreams at 3am.', ogImage: WALLPAPERS.cyber1 },
    advanced: { customCss: '', customCursor: '', visibility: 'public', seo: true },
  },
  lumen: {
    id: 'pr_lumen',
    username: 'lumen',
    displayName: 'Lumen',
    bio: 'Producer & sound designer. Lo-fi by day, synthwave by night.',
    location: 'Los Angeles, US',
    status: '',
    avatar: PORTRAITS.p1,
    banner: WALLPAPERS.mesh5,
    joinDate: '2024-01-21',
    uid: '0000311',
    views: 56780,
    accent: '24 95% 58%',
    layout: 'minimal',
    background: { type: 'image', color: '0 0% 4%', gradient: '', image: WALLPAPERS.mesh5, video: '', blur: 6, overlay: 48 },
    effects: { glowBorder: true, floating: true, particles: false, snow: true, rain: false, stars: true, cursorTrail: false, clickToEnter: false, pageEntrance: true },
    links: pickLinks(['l_sp', 'l_sc', 'l_yt', 'l_ig', 'l_web']),
    badges: pickBadges(['b_unlimited', 'b_early', 'b_top']),
    music: { enabled: true, title: 'Sunset Memory', artist: 'Lumen', cover: WALLPAPERS.mesh4, loop: true, volume: 55, src: '' },
    metadata: { title: 'Lumen · Producer', description: 'Lo-fi by day, synthwave by night.', ogImage: WALLPAPERS.mesh5 },
    advanced: { customCss: '', customCursor: '', visibility: 'public', seo: true },
  },
};

// The profile attached to the signed-in dashboard user.
export const currentProfile = mockProfiles.nova;
