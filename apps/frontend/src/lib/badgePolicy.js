const reservedBadgeWords = [
  'verified',
  'verify',
  'verification',
  'official',
  'staff',
  'admin',
  'administrator',
  'moderator',
  'mod',
  'owner',
  'team',
  'support',
  'og',
  'o.g',
  'original',
];

export function isReservedUserBadge(badge = {}) {
  const text = normalizeBadgeText([
    badge.slug,
    badge.label,
    badge.name,
    badge.tooltip,
  ].filter(Boolean).join(' '));
  return reservedBadgeWords.some((word) => hasReservedBadgeWord(text, word));
}

export function reservedBadgeMessage() {
  return 'Custom badges cannot use verification, staff, owner, moderator, admin, or OG wording.';
}

function normalizeBadgeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasReservedBadgeWord(text, word) {
  const normalizedWord = normalizeBadgeText(word);
  if (!normalizedWord) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedWord)}(\\s|$)`).test(text);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
