# Vyntra.bio — Premium Creator Profiles (Frontend)

Vyntra.bio is a premium, dark-aesthetic **bio-link / profile-card platform**. Creators build
cinematic, animated public profiles with custom layouts, backgrounds, effects, badges, links,
music and live activity cards.

> **This is a frontend-only prototype.** All data is mocked and every "API" call goes through a
> replaceable service layer with simulated latency. There is **no backend, auth, database, file
> storage, payments or email**. It is built to be wired to a real backend later without rewriting UI.

---

## ✨ Highlights

- **Landing page** — animated hero, floating profile cards, features, templates, pricing, FAQ.
- **Auth** — glassmorphism login & register with Zod validation, loading/error states (mocked).
- **Dashboard** — stats, views chart, profile preview, completion checklist, activity feed.
- **Profile editor** — 11 tabs (Identity, Layout, Background, Effects, Links, Badges, Music,
  Embeds, Metadata, Analytics, Advanced) with an **instant live preview** (desktop + mobile).
- **Public profiles** (`/u/:username`) — 7 cinematic layouts (Centered, Wide, Minimal, Sidebar,
  Floating, Terminal, Portfolio Grid), backgrounds, ambient effects, click-to-enter intro,
  frosted music player, Discord/Spotify activity cards.
- **Templates** — searchable/filterable community browser with preview modal, likes & import.
- **Analytics** — charts (Recharts), stat cards, tables, country/device/referrer breakdowns.
- **Settings** — account, appearance, security, notifications, privacy.
- **Admin** — users table, report queue, moderation, announcements, badge assignment, audit log.

## 🧱 Tech stack

React · React Router · Zustand · TanStack Query · Framer Motion · Zod · Recharts ·
Tailwind CSS · shadcn/ui · lucide-react · sonner.

> The reference brief specified TypeScript + Vite. This repository runs in a managed
> **Create React App (craco)** JavaScript environment, so the same architecture is implemented in
> JS. Strong typing intent is documented via JSDoc in `src/types/`.

## 🗂 Project structure

```
src/
├── components/
│   ├── ui/          # shadcn primitives
│   ├── common/      # GlassCard, AnimatedBackground, StatCard, ChartFrame, ...
│   ├── layout/      # Navbar, Footer, Sidebar, Topbar, DashboardLayout, AuthShell
│   ├── profile/     # PublicProfileRenderer + layouts, effects, music, activity
│   ├── editor/      # tabs/ + controls (ColorPicker, GradientPicker, FileUploadMock...)
│   ├── templates/   # TemplateCard, TemplatePreviewModal
│   └── analytics/   # ChartCard
├── hooks/           # useMediaQuery, useScrollProgress
├── mocks/           # users, profiles, links, badges, templates, analytics, admin
├── pages/           # Landing, Login, Register, Dashboard, Editor, Templates, ...
├── routes/          # AppRoutes (lazy-loaded)
├── services/        # auth/profile/analytics/templates/files/admin (mock API layer)
├── stores/          # Zustand: auth, profile, settings, template, ui
├── types/           # JSDoc domain types + option constants
├── utils/           # format, storage, color
└── validation/      # Zod schemas
```

## 🚀 Getting started

```bash
npm install
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview the production build
```

This managed environment uses **yarn + craco**. The equivalent commands are:

```bash
yarn install
yarn start         # dev server (≡ npm run dev)
yarn build         # production build
```

**Demo login:** any credentials work. The form is prefilled with `nova` / `password`.
Try public profiles at `/u/nova`, `/u/kairo` (terminal layout) and `/u/lumen`.

## 🔌 Replacing mocks with a real backend

All data access lives in `src/services/*.service.js`. Each function currently returns mock data
with a simulated delay. To connect a real API, swap the bodies for HTTP calls — **the UI and
stores stay unchanged**:

```js
// src/services/auth.service.js (before — mock)
async login({ identifier, password }) {
  await delay(800);
  const user = mockUsers.find((u) => u.username === identifier) || currentUser;
  return { token: 'mock_jwt', user };
}

// after — real
async login(payload) {
  const { data } = await axios.post(`${API}/auth/login`, payload);
  return data; // { token, user }
}
```

Use `process.env.REACT_APP_BACKEND_URL` as the API base (already wired in the environment).
Because components read through Zustand stores and the service layer, you only edit the services
and (optionally) point TanStack Query at live endpoints.

## 📝 Notes on mocked behavior

- **Auth** accepts any input and stores a fake session in `localStorage`.
- **File uploads** return a local `URL.createObjectURL` preview — nothing is stored.
- **Background music** playback is simulated (no audio file); it never autoplays.
- **Custom CSS** is injected only on the live public page as a visual simulation.
- **Analytics / admin actions** update local state and show toasts only.
