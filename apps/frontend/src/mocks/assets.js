// Generated inline assets for landing-page previews and profile fallbacks.
// They keep the self-hosted app independent from third-party image CDNs.

const svg = (body, width = 1400, height = 900) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="table" tableValues="0 .12"/></feComponentTransfer>
        </filter>
        <filter id="blur"><feGaussianBlur stdDeviation="44"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="#050505"/>
      ${body}
      <rect width="100%" height="100%" filter="url(#grain)" opacity=".5"/>
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="48" fill="none" stroke="rgba(255,255,255,.08)" />
    </svg>
  `)}`;

const wallpaper = (a, b, c, label) =>
  svg(`
    <radialGradient id="g1" cx="22%" cy="14%" r="62%"><stop offset="0" stop-color="${a}" stop-opacity=".78"/><stop offset=".62" stop-color="${b}" stop-opacity=".22"/><stop offset="1" stop-color="#050505" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="84%" cy="78%" r="60%"><stop offset="0" stop-color="${c}" stop-opacity=".68"/><stop offset=".68" stop-color="#101010" stop-opacity=".18"/><stop offset="1" stop-color="#050505" stop-opacity="0"/></radialGradient>
    <linearGradient id="line" x1="0" x2="1" y1="0" y2="1"><stop stop-color="rgba(255,255,255,.22)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></linearGradient>
    <rect width="100%" height="100%" fill="url(#g1)"/>
    <rect width="100%" height="100%" fill="url(#g2)"/>
    <g filter="url(#blur)" opacity=".82">
      <circle cx="270" cy="160" r="150" fill="${a}"/>
      <circle cx="1140" cy="700" r="210" fill="${c}"/>
      <circle cx="730" cy="470" r="180" fill="${b}"/>
    </g>
    <g opacity=".32">
      <path d="M120 700 C360 460 500 740 760 480 S1130 340 1280 170" fill="none" stroke="url(#line)" stroke-width="2"/>
      <path d="M90 300 C380 210 530 360 760 250 S1110 180 1310 420" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
    </g>
    <text x="70" y="810" fill="rgba(255,255,255,.2)" font-size="38" font-family="Inter,Arial,sans-serif" font-weight="800" letter-spacing="6">${label}</text>
  `);

const portrait = (bg, accent, initials) =>
  svg(`
    <radialGradient id="avatar" cx="50%" cy="38%" r="76%"><stop stop-color="${accent}" stop-opacity=".9"/><stop offset=".72" stop-color="${bg}" stop-opacity=".38"/><stop offset="1" stop-color="#050505"/></radialGradient>
    <rect width="100%" height="100%" fill="url(#avatar)"/>
    <circle cx="700" cy="390" r="210" fill="rgba(255,255,255,.08)"/>
    <circle cx="700" cy="390" r="128" fill="rgba(255,255,255,.1)"/>
    <path d="M385 790c70-190 208-284 315-284s245 94 315 284" fill="rgba(255,255,255,.12)"/>
    <text x="700" y="442" text-anchor="middle" fill="white" font-size="158" font-family="Inter,Arial,sans-serif" font-weight="900">${initials}</text>
  `, 400, 400);

export const ABSTRACT = {
  hero: wallpaper('#ffffff', '#7a7a7a', '#2f2f2f', 'VYNTRA'),
  chrome: wallpaper('#d9d9d9', '#535353', '#121212', 'CHROME'),
  smoke: wallpaper('#ffffff', '#343434', '#111111', 'SMOKE'),
  fluid1: wallpaper('#f4f4f5', '#6b7280', '#18181b', 'FLUID'),
  fluid2: wallpaper('#e5e7eb', '#3f3f46', '#09090b', 'NOIR'),
};

export const WALLPAPERS = {
  cyber1: wallpaper('#f5f5f5', '#737373', '#171717', 'CYBER'),
  cyber2: wallpaper('#ffffff', '#525252', '#0a0a0a', 'MIDNIGHT'),
  cyber3: wallpaper('#d4d4d8', '#71717a', '#18181b', 'GRID'),
  anime1: wallpaper('#fafafa', '#a1a1aa', '#27272a', 'AURA'),
  anime2: wallpaper('#e4e4e7', '#71717a', '#09090b', 'MIST'),
  mesh1: wallpaper('#ffffff', '#737373', '#262626', 'MESH'),
  mesh2: wallpaper('#f5f5f5', '#525252', '#171717', 'PRISM'),
  mesh3: wallpaper('#d4d4d4', '#404040', '#050505', 'VOID'),
  mesh4: wallpaper('#fafafa', '#737373', '#111111', 'GLASS'),
  mesh5: wallpaper('#e5e5e5', '#525252', '#0a0a0a', 'NOCTURNE'),
};

export const PORTRAITS = {
  p1: portrait('#111111', '#f5f5f5', 'NS'),
  p2: portrait('#18181b', '#d4d4d8', 'AK'),
  p3: portrait('#0a0a0a', '#a3a3a3', 'LM'),
  p4: portrait('#171717', '#e5e5e5', 'EX'),
  p5: portrait('#09090b', '#ffffff', 'NV'),
  p6: portrait('#1f1f1f', '#c7c7c7', 'KR'),
  p7: portrait('#111827', '#f9fafb', 'AR'),
  p8: portrait('#0f0f0f', '#d1d5db', 'MR'),
};
