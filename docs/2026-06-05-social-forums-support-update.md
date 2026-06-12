# Vyntra Update: Social, Forums, Support, Cursor Uploads

Published: June 5, 2026

This update expands Vyntra.bio from a profile-card builder into a more complete self-hosted creator community platform. It focuses on persistent social features, safer uploads, cleaner editor navigation, realtime notifications, and better staff workflows.

## Added

- Forums engine at `/forums` with default community categories, Markdown thread bodies, replies, pinned threads, locked threads, author cards, view counts, and staff moderation controls.
- Public forum thread pages at `/forums/:slug` with Markdown rendering and reply forms for signed-in users.
- Friend system on public profiles with friend count, friend-list modal, friend request creation, pending/accepted state handling, and dashboard friend stats.
- Friend messaging page at `/dashboard/messages` with saved conversations, message history, accepted-friend enforcement, realtime refresh events, browser notification attempts, and a generated ding sound for new events.
- Support chat page at `/dashboard/support` with Vyntra Assist bot triage, issue creation, suggested fixes, staff escalation, locked waiting state, replies, and close handling.
- Admin support queue inside the admin panel with saved support conversations, messages, staff accept action, and close action.
- Stored notification system with clear-all support and realtime refresh for friend requests, messages, forum replies, and support updates.
- Socket.IO polling client in the frontend, avoiding an added package dependency while still receiving server events.
- Dashboard friends stat card.

## Changed

- Custom cursor uploads now support `.cur`, `.gif`, and `.png`.
- Cursor files are preserved instead of being converted into WebP, which keeps cursor behavior intact on live profiles.
- Public profile metadata now appears directly under the username: location, join date, UID, and views.
- Public profile pages now include friend count and add-friend controls.
- Dashboard header notifications now use saved notification records and include a clear action.
- Mobile header keeps the notification button and profile menu grouped on the right side.
- Owner users can edit locked role badge definitions in the admin badge library.
- Blog cards now use more consistent height and footer alignment, and staff/owner authors show role badges beside their names.
- Blog post pages use a wider, more balanced content width.

## Removed

- Removed the `Badges` tab from the profile editor.
- Removed the unused editor Badges tab component.
- The `Embeds` editor/profile surface remains removed so users are not prompted to configure integrations that are no longer part of the product direction.

## Security And Data Notes

- Friendships use a canonical pair key to prevent duplicate friend records and duplicate conversations.
- Direct messages require an accepted friendship.
- Support conversations and messages are persisted for admin review.
- Staff escalation creates stored notifications for owner/admin/moderator accounts.
- Custom cursor `.cur` uploads are validated by file header and extension, not just file name.

## Verification

- Prisma schema formatted.
- Prisma client generated.
- Backend TypeScript typecheck passed.
- Backend production build passed.
- Frontend TypeScript typecheck passed.
- Frontend production build passed.
