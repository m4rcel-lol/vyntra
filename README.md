# Vyntra

Vyntra is a self-hosted bio-link/profile-card platform for creator profiles, portfolio pages, social hubs, templates, files, badges, realtime previews, moderation, and privacy-friendly analytics.

All advanced features are free for every user. The app intentionally does not include payments, subscriptions, SMTP mail delivery, or third-party auth.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Fastify, TypeScript, Prisma, Socket.IO
- Database: PostgreSQL
- Cache/rate limits/session cache: Valkey
- File storage: local Docker volume mounted into the backend container
- Upload compression: images are converted to WebP, audio to MP3, and video to MP4 before storage
- Auth: username/email plus password, Argon2id hashes, opaque HTTP-only session cookies, CSRF header checks
- Deployment: Docker Compose on Alpine-compatible Linux servers

## Repository

```text
apps/
  backend/
    prisma/
      schema.prisma
      migrations/0001_init/migration.sql
    src/
      routes/
      lib/
      realtime/
  frontend/
    src/
      components/
      pages/
      lib/
infra/caddy/Caddyfile.example
docker-compose.yml
docker-compose.caddy.yml
.env.example
```

## Quick Start

1. Create the environment file:

```bash
cp .env.example .env
```

2. Generate env-safe secrets:

```bash
openssl rand -hex 32
```

Run that command once for `COOKIE_SECRET` and once for `POSTGRES_PASSWORD`, then paste the generated 64-character hex values into `.env`. Set `SEED_ADMIN_PASSWORD` to a strong password you can type that only uses letters, numbers, `_`, or `-`.

Docker Compose reads database credentials from `.env`. The backend container gets an internal `DATABASE_URL` automatically built from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`, pointing at the `postgres` service. The backend service explicitly receives the required app secrets from `.env`, so you do not need to put passwords directly in `docker-compose.yml`.

Production `.env` values must be safe for Docker Compose interpolation. Use letters, numbers, `_`, or `-`. Do not use `$`, quotes, spaces, backticks, or non-ASCII characters in unquoted values. The warning `variable is not set. Defaulting to a blank string` usually means a secret contains `$NAME` and Compose is trying to expand it.

`FRONTEND_PORT` and `BACKEND_PORT` control the host ports exposed by Docker. The backend container still listens internally on `3000`, which keeps health checks and service-to-service networking stable.

For the default Docker Compose setup, leave `VITE_API_URL` and `VITE_SOCKET_URL` empty. The frontend nginx container proxies `/api`, `/socket.io`, and `/health` to the backend internally. This prevents remote browsers from trying to call `localhost:3000`.

When testing directly over plain HTTP, such as `http://server-ip:8080`, set `SESSION_COOKIE_SECURE=false` in `.env` so login cookies can be stored. For real HTTPS production, leave it empty or set `SESSION_COOKIE_SECURE=true`.

3. Build and start the stack:

```bash
docker compose up -d --build
```

4. Apply database migrations:

```bash
docker compose exec backend npx prisma migrate deploy
```

5. Seed global badges, reserved usernames, and the first admin:

```bash
docker compose exec backend npm run seed
```

6. Watch logs:

```bash
docker compose logs -f
```

Frontend: <http://localhost:8080><br>
Backend health through frontend proxy: <http://localhost:8080/health><br>
Direct backend health: <http://localhost:3000/health>

The backend root URL on port `3000` is API-only. Seeing `Route GET:/ not found` at `http://server-ip:3000/` is expected.

If `vyntra-backend-1` is unhealthy, check the backend logs first:

```bash
docker compose logs backend
```

The most common causes are a missing `.env`, missing `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD`, a short `COOKIE_SECRET`, Compose-unsafe secret characters such as `$`, or database credentials in `.env` that do not match the existing `postgres_data` volume. If you changed `POSTGRES_USER`, `POSTGRES_PASSWORD`, or `POSTGRES_DB` after the first boot, either restore the old values or intentionally recreate the database volume.

If the backend logs mention `libssl.so.1.1` or `Prisma failed to detect the libssl/openssl version`, rebuild the backend image after updating. The backend Dockerfile installs OpenSSL and Prisma generates the Alpine OpenSSL 3 query engine:

```bash
docker compose build --no-cache backend
docker compose up -d
```

## Local Development

```bash
npm install
npm run prisma:generate
npm run dev
```

`npm run dev` starts local PostgreSQL and Valkey from `.dev/postgres` and `.dev/valkey`, then starts the backend and frontend workspaces. Those `.dev` directories are persistent; do not delete them unless you intentionally want to reset local data.

If you only need the local services:

```bash
npm run dev:services
```

To stop the local services:

```bash
npm run dev:stop
```

Before shipping changes:

```bash
npm run typecheck
npm run build
```

For local backend development outside `npm run dev`, PostgreSQL and Valkey must be available through the URLs in `.env`. Audio/video compression requires `ffmpeg`; image compression uses `sharp`. The production backend image includes both.

## Production Notes

- Set `NODE_ENV=production`.
- Use long env-safe random values for `COOKIE_SECRET`, `POSTGRES_PASSWORD`, and `SEED_ADMIN_PASSWORD`.
- Set `PUBLIC_APP_URL` and `FRONTEND_ORIGIN` to your public HTTPS URL.
- Leave `VITE_API_URL` and `VITE_SOCKET_URL` empty unless you intentionally host the API on a separate public origin.
- Profile URLs (`/u/:username`) are routed through the frontend nginx container to the backend so link previews can receive metadata from the editor's Metadata tab. In the default Docker Compose setup this works automatically; if you run backend and frontend separately, set `FRONTEND_SHELL_URL` to the frontend `index.html` URL.
- Keep secrets in `.env`; the Compose file references environment variables and does not need hardcoded passwords.
- Keep `TRUST_PROXY=true` when running behind Caddy, Nginx, or Traefik.
- Terminate TLS at the reverse proxy and forward `/api/*`, `/socket.io/*`, and `/health` to the backend.
- Allow upload request bodies up to the configured `MAX_UPLOAD_MB` value. The default app limit is 100 MB before compression, so Nginx should use `client_max_body_size 100m;`; the included Caddy example sets `request_body max_size 100MB`.
- The backend stores only hashed session tokens and anonymized visitor hashes.
- Uploaded assets are compressed before they are written to disk and are served through backend proxied public URLs.
- The backend stores uploads under `STORAGE_DIR`, which defaults to `/app/uploads` in Docker and is persisted with the `uploads_data` volume.

## Caddy Example

The optional Caddy service is in `docker-compose.caddy.yml`.

```bash
docker compose -f docker-compose.yml -f docker-compose.caddy.yml up -d --build
```

Edit `infra/caddy/Caddyfile.example` and replace `vyntra.example.com` with your domain.

Equivalent Nginx or Traefik routing:

- `/api/*` -> `backend:3000`
- `/socket.io/*` -> `backend:3000` with websocket upgrade
- `/health` -> `backend:3000`
- everything else -> `frontend:80`

## Backups

PostgreSQL:

```bash
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > vyntra-postgres.sql
```

Uploaded assets:

```bash
docker run --rm -v vyntra_uploads_data:/data -v "$PWD:/backup" alpine tar czf /backup/vyntra-uploads.tar.gz /data
```

Valkey is used for cache/rate-limit/session-cache data. PostgreSQL remains the source of truth for sessions, so Valkey backups are optional.

## Updates

```bash
git pull
docker compose up -d --build --force-recreate
docker compose exec backend npx prisma migrate deploy
docker compose logs -f
```

If an update changes the backend Dockerfile, Prisma engine target, Node version, or Alpine packages, rebuild the backend image without cache:

```bash
docker compose build --no-cache backend
docker compose up -d --force-recreate backend frontend
docker compose exec backend npx prisma migrate deploy
docker compose logs -f backend
```

Run `npm run typecheck` and `npm run build` before publishing local changes.

## Security Features

- Argon2id password hashing
- Opaque session cookies with hashed database tokens
- HTTP-only, SameSite cookies
- CSRF header validation for authenticated write requests
- Redis/Valkey-backed login and register rate limits
- Username validation, reserved routes, and reserved usernames
- Zod request validation
- Custom CSS sanitization and selector scoping
- Upload MIME and size validation
- Upload MIME sniffing, compression, safe filenames, and private local object keys
- Admin audit logs
- Report system for profiles, templates, files, and users

## Included Product Pages

- Landing page
- Register and login
- Dashboard
- Profile editor with live preview
- Public profile page at `/u/:username` and alias route `/:username`
- Explore/community templates
- Leaderboard
- Settings
- Admin/moderation panel
- File manager
- Analytics
