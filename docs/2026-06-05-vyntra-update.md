# Vyntra.bio Update: Cleaner Profiles, Stronger Self-Hosting, and a Better Editor

Published: June 5, 2026

Vyntra.bio has gone through a large cleanup and polish pass focused on making the platform feel more stable, self-hostable, and useful as a real creator profile system. The goal was simple: keep the product premium and customizable, but remove anything that made it feel bloated, fragile, or dependent on services the project does not need.

## Added

### Blog engine

Vyntra now has a working blog system at `/blog`.

Staff and owners can create posts, edit posts, publish drafts, and pin important updates so they appear first. Users can like posts, and every post clearly shows who wrote it. Blog content supports Markdown, so posts can include clean headings, lists, links, code blocks, quotes, and formatted update notes.

### Owner, staff, and role badge logic

Role handling was improved across the app.

Owner accounts are protected from normal role changes. Admins and staff cannot accidentally demote themselves through the admin panel. Owner, staff, and moderator accounts automatically receive the correct identity badge, and protected badges cannot be casually assigned or removed through normal user controls.

### Footer pages

The footer now links to real pages instead of dead or placeholder links. The site has proper pages for product information, privacy, terms, cookies, guidelines, contact, changelog, status, badges, verified accounts, showcase, and related sections.

Footer social links were cleaned up too. YouTube and Instagram were removed, Twitter now points to `twitter.com/m5rcode`, and GitHub points to `github.com/m4rcel-lol`.

### Mobile dashboard navigation

Mobile UI received a serious pass.

The dashboard now has a bottom navigation bar for the most important sections, tighter spacing, better topbar behavior, better editor preview handling, improved stat cards, and responsive dashboard layouts that fit smaller screens without feeling cramped or broken.

### Editor tab scrolling

The profile editor now has a proper horizontally scrollable option rail with left and right controls. Identity, Background, Effects, Links, Badges, Music, Metadata, Analytics, and Advanced are easier to reach on phones and small displays.

The active tab auto-centers while scrolling, and the tab rail stays accessible on mobile while editing.

### Unsaved changes protection

The editor now warns users before they leave with unsaved changes.

If someone edits their profile and accidentally clicks another page, browser back, refresh, or another dashboard route, Vyntra shows a clear popup with three choices:

- Keep editing
- Leave without saving
- Save and leave

This prevents users from losing profile work by accident.

### Custom cursor uploads

Custom cursor support now works from uploaded files.

The Advanced editor tab now uses the same compressed upload flow as avatars, banners, backgrounds, and music. When a user uploads a cursor image, the profile saves the cursor asset and applies it on the live public profile. The cursor is applied across the full profile surface, including child links and buttons, so default pointer styles do not override it.

## Changed

### Profiles are focused on the minimal layout

Public profiles now focus on the clean minimal layout. This keeps profile pages more consistent and avoids broken or cluttered layout combinations.

The profile card places the avatar correctly, keeps text readable, keeps the music player out of the way on mobile, and makes the public page feel more intentional.

### File storage is local and compressed

MinIO and S3-style storage were removed from the self-hosting direction.

Vyntra now uses local file storage and compresses uploads to keep server storage usage lower. Upload handling covers avatars, banners, backgrounds, audio, music covers, cursor images, badge icons, metadata images, and template previews with safer filenames, MIME validation, and upload size handling.

### Music player behavior is cleaner

The music player now only appears when a profile actually has uploaded music. It supports loop and volume controls, uses track names from file metadata or filenames when possible, and has better sizing on small screens.

### Profile views and analytics are stricter

The views system was hardened to reduce view farming and accidental infinite view counting. Views are counted in a more controlled way, analytics are more accurate, and admins have tools to reset profile views when counts are bugged or farmed.

### Admin panel is more complete

The admin panel now supports more practical moderation and account management work:

- User role management
- Badge assignment controls
- Protected owner behavior
- View resets
- Report handling
- Safer access checks so non-admin users cannot open admin-only areas

### Docker and production deployment were cleaned up

Docker Compose and production config were improved so credentials come from `.env` instead of being hardcoded in Compose files. The backend image was adjusted for Prisma compatibility on Alpine-based containers, including the OpenSSL issue that caused unhealthy backend containers.

The frontend Nginx config also handles larger uploads better and proxies API requests through the frontend container in production.

### Authentication checks are more consistent

Authenticated routes now check the current user more consistently so logged-in users do not randomly appear logged out while navigating Vyntra.

## Removed

### MinIO and S3 dependency

MinIO was removed because the project is meant to be easy to self-host without needing S3-compatible storage. Local compressed uploads are now the expected path.

### Payment and premium assumptions

Vyntra keeps the original promise: no Stripe, no payments, no subscriptions, and no locked premium tier. Premium-style features remain free.

### Custom badge creation by regular users

Regular user-created custom badges were removed to prevent fake verification, staff-style, owner-style, OG-style, or trust-related badges.

Badges are now more controlled, with global role and identity badges handled through admin/staff systems.

### Embeds and Lanyard-style activity cards

Embeds were removed from the editor and public profile UI.

YouTube, Twitch, Spotify, SoundCloud, portfolio embeds, and Discord/Lanyard-style activity cards are no longer shown or advertised as profile features. This keeps public profiles cleaner and avoids adding external API dependencies that the project does not need.

### Footer clutter

Unused footer social links were removed, and the homepage footer styling was cleaned up so the page feels more complete and less placeholder-like.

## Fixed

### Profile links not showing

Public profile links were fixed so deployed profiles correctly show user links instead of silently hiding them.

### Avatar, banner, background, and music upload behavior

Upload flows were repaired for core profile assets. The editor now uses real uploaded assets in previews and public profiles instead of falling back to initials or placeholder visuals.

### Badge placement

Verified and staff badges now appear after the username where users expect them, instead of being separated from the identity line.

### Mobile presentation issues

Several mobile problems were improved:

- Dashboard spacing
- Editor tab access
- Music player width and placement
- Public profile padding
- Profile preview sizing
- Footer layout
- Topbar responsiveness

## What This Means

Vyntra.bio is now more focused: a self-hosted, dark, creator-first profile platform with polished profiles, compressed local uploads, working blog updates, safer editing, cleaner admin controls, better mobile UI, and fewer unnecessary integrations.

The direction is clearer now: make the core profile experience excellent before adding anything extra.
