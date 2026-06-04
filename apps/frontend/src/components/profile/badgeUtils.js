export function badgeHasSlug(badge, slug) {
  const target = String(slug || '').toLowerCase();
  return [badge?.slug, badge?.label, badge?.name]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .includes(target);
}

export function getBadgeBySlug(badges = [], slug) {
  return badges.find((badge) => badgeHasSlug(badge, slug)) ?? null;
}

export function withoutInlineBadges(badges = []) {
  return badges.filter((badge) => !badgeHasSlug(badge, 'verified'));
}
