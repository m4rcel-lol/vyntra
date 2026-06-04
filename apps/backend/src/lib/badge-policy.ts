import { fail } from "./errors.js";
import { isRoleBadgeSlug } from "./role-badges.js";

const reservedBadgeWords = [
  "verified",
  "verify",
  "verification",
  "official",
  "staff",
  "admin",
  "administrator",
  "moderator",
  "mod",
  "owner",
  "team",
  "support",
  "og",
  "o.g",
  "original"
] as const;

export function assertUserBadgeIsAllowed(params: {
  name: string;
  tooltip?: string | null;
  slug?: string | null;
}): void {
  const slug = normalizeBadgeText(params.slug ?? "");
  if (slug && isRoleBadgeSlug(slug)) {
    fail(403, "BADGE_NAME_RESERVED", "That badge name is reserved for system-managed badges");
  }

  const text = normalizeBadgeText(`${params.name} ${params.tooltip ?? ""} ${params.slug ?? ""}`);
  const blocked = reservedBadgeWords.find((word) => hasReservedBadgeWord(text, word));
  if (blocked) {
    fail(403, "BADGE_NAME_RESERVED", `Custom badges cannot impersonate verification, staff, owner, moderator, admin, or OG roles`);
  }
}

function normalizeBadgeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasReservedBadgeWord(text: string, word: string): boolean {
  const normalizedWord = normalizeBadgeText(word);
  if (!normalizedWord) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedWord)}(\\s|$)`).test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
