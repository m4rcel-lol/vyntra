/**
 * Vyntra.bio — Domain type definitions (JSDoc-based for JS environment).
 * These describe shared frontend data shapes so editors get IntelliSense.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} email
 * @property {string} avatar
 * @property {string} role          // 'user' | 'admin' | 'moderator'
 * @property {string} plan          // currently always 'Unlimited'
 * @property {string} joinDate
 */

/**
 * @typedef {Object} SocialLink
 * @property {string} id
 * @property {string} label
 * @property {string} url
 * @property {string} icon          // lucide icon key
 * @property {string} style         // 'solid' | 'glass' | 'outline' | 'minimal'
 */

/**
 * @typedef {Object} Badge
 * @property {string} id
 * @property {string} label
 * @property {string} color         // hsl string e.g. '152 60% 50%'
 * @property {string} tooltip
 * @property {boolean} glow
 * @property {string} icon
 */

/**
 * @typedef {Object} ProfileBackground
 * @property {string} type          // 'solid' | 'gradient' | 'image' | 'gif' | 'video'
 * @property {string} color
 * @property {string} gradient
 * @property {string} image
 * @property {string} video
 * @property {number} blur          // 0 - 24 px
 * @property {number} overlay       // 0 - 100 (%)
 */

/**
 * @typedef {Object} ProfileEffects
 * @property {boolean} glowBorder
 * @property {boolean} floating
 * @property {boolean} particles
 * @property {boolean} snow
 * @property {boolean} rain
 * @property {boolean} stars
 * @property {boolean} cursorTrail
 * @property {boolean} clickToEnter
 * @property {boolean} pageEntrance
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} bio
 * @property {string} location
 * @property {string} status
 * @property {string} avatar
 * @property {string} banner
 * @property {string} joinDate
 * @property {string} uid
 * @property {number} views
 * @property {string} accent        // hsl string
 * @property {string} layout        // ProfileLayout key
 * @property {ProfileBackground} background
 * @property {ProfileEffects} effects
 * @property {SocialLink[]} links
 * @property {Badge[]} badges
 * @property {Object} music
 * @property {Object} embeds
 * @property {Object} metadata
 * @property {Object} advanced
 * @property {Object} discordActivity
 * @property {Object} spotifyActivity
 */

export const PROFILE_LAYOUTS = [
  { key: 'centered', label: 'Centered Card', desc: 'Classic centered profile card' },
  { key: 'wide', label: 'Wide Card', desc: 'Horizontal banner-led layout' },
  { key: 'minimal', label: 'Minimal', desc: 'Stripped-back, text first' },
  { key: 'sidebar', label: 'Sidebar', desc: 'Identity left, content right' },
  { key: 'floating', label: 'Floating', desc: 'Floating glass card in space' },
  { key: 'terminal', label: 'Terminal', desc: 'Monospaced hacker console' },
  { key: 'portfolio', label: 'Portfolio Grid', desc: 'Grid of work + links' },
  { key: 'spotlight', label: 'Spotlight', desc: 'Large hero identity with featured links' },
  { key: 'stacked', label: 'Stacked Links', desc: 'Banner, avatar, then clean link stack' },
  { key: 'editorial', label: 'Editorial', desc: 'Magazine-style profile and content grid' },
];

export const BACKGROUND_TYPES = ['solid', 'gradient', 'image', 'gif', 'video'];

export const BUTTON_STYLES = [
  { key: 'glass', label: 'Glass' },
  { key: 'solid', label: 'Solid' },
  { key: 'outline', label: 'Outline' },
  { key: 'minimal', label: 'Minimal' },
];

export const SOCIAL_ICONS = [
  'Globe', 'Twitter', 'Instagram', 'Github', 'Youtube', 'Twitch',
  'Music', 'Linkedin', 'Send', 'Mail', 'Link', 'Disc', 'Camera', 'Rss',
];

export const TEMPLATE_CATEGORIES = [
  'Minimal', 'Anime', 'Cyberpunk', 'Clean', 'Portfolio',
  'Gaming', 'Dark', 'Colorful', 'Music', 'Developer',
];

export const VISIBILITY_OPTIONS = [
  { key: 'public', label: 'Public', desc: 'Anyone with the link can view' },
  { key: 'unlisted', label: 'Unlisted', desc: 'Hidden from discovery' },
  { key: 'private', label: 'Private', desc: 'Only you can view' },
];
