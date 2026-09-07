# Selora — Tech Stack & Tools

**Selora** is a gamified personal savings app with a retro pixel-art aesthetic. Users track spending and savings, watch their "Soul" react to financial habits, explore an isometric spending map, and customize a pixel avatar — all in the browser, with no backend required.

---

## Project Overview

| Item | Detail |
|------|--------|
| **Name** | Selora |
| **Type** | Single-page web application (SPA) |
| **Platform** | Mobile-first, responsive web |
| **Architecture** | Client-only — all data lives in the browser via localStorage |
| **Language** | TypeScript |
| **Module system** | ES Modules (`"type": "module"`) |

---

## Core Technology Stack

### Frontend Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI component library |
| **React DOM** | 19.x | DOM rendering |
| **TypeScript** | 6.x | Static typing, safer refactors |

### Build & Dev Server

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vite** | 8.x | Fast dev server, HMR, production bundling |
| **@vitejs/plugin-react** | 6.x | React Fast Refresh + JSX transform |

### Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **@tailwindcss/vite** | 4.x | Tailwind integration with Vite |

Tailwind is configured via CSS (`@import 'tailwindcss'` + `@theme` in `src/index.css`) with a custom **Vault Aurora** design token palette:

- `--color-vault-black`, `--color-vault-panel`, `--color-vault-indigo`
- `--color-coin-gold`, `--color-heal-green`, `--color-soul-violet`, `--color-danger-red`

### Routing

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Router DOM** | 7.x | Client-side routing (`BrowserRouter`, `Routes`, `Route`) |

**Routes:**

| Path | Screen |
|------|--------|
| `/` | Soul — avatar, mood, health, stats |
| `/log` | Log — record spends & savings |
| `/map` | Map — isometric spending city |
| `/insights` | Insights — charts & breakdowns |
| `/advisor` | Advisor — personalised tips |
| `/pact` | Pact — weekly goals & leaderboard |
| `/create` | Avatar Creator — pixel character customizer |

---

## State Management & Persistence

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.x | Lightweight global state |
| **zustand/middleware (persist)** | — | Automatic localStorage sync |

### Stores

| Store | File | Persists | Responsibility |
|-------|------|----------|----------------|
| **Game store** | `src/store/useStore.ts` | `selora-storage` | Spends, savings, pact, avatar, locations, reasons, user name |
| **UI store** | `src/store/useUiStore.ts` | `selora-ui` | CRT overlay toggle, sound mute |

Game logic (soul mood, streaks, advisor tips, map buildings) is kept in pure functions under `src/lib/` — the store only holds data and simple mutations.

---

## UI, Animation & Design

### Typography (Google Fonts)

| Font | Usage |
|------|-------|
| **Press Start 2P** | Titles, labels, HUD, buttons (`font-pixel`) |
| **VT323** | Body text, dense UI, form inputs (`font-body`) |

### Animation & Motion

| Technology | Version | Purpose |
|------------|---------|---------|
| **Framer Motion** | 13.x | Page transitions, nav cursor, list animations, form feedback |

Custom CSS keyframe animations (no extra libraries):

- Soul idle bob, breathe, blink, mood reactions
- Avatar bob & option selection pulse
- Isometric map particles, clouds, danger glow
- CRT scanline overlay

### Visual Effects

- **CRT overlay** — scanlines + vignette (`CrtOverlay.tsx`), toggleable from HUD
- **Retro dialog panels** — layered box-shadow borders (`.retro-panel`)
- **Pixel rendering** — `image-rendering: pixelated` / `crisp-edges` globally
- **Sharp corners** — all border-radius forced to `0` for authentic retro look

---

## Graphics & Visualization

### Charts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | 3.x | Bar charts on Insights page (spending by location & reason) |

### 3D / Isometric Map

| Technology | Version | Purpose |
|------------|---------|---------|
| **Three.js** | 0.185.x | 3D rendering engine |
| **@react-three/fiber** | 9.x | React renderer for Three.js |
| **@react-three/drei** | 10.x | Helpers (camera, controls, etc.) |

The Map screen also includes:

- **IsoWorld** — SVG/CSS isometric fallback world
- **MapErrorBoundary** — graceful fallback if 3D fails to load
- **IsometricCityFallback** — lightweight 2D city when WebGL is unavailable

### Pixel Art & Avatars

No external sprite engine — avatars and icons are built in-house:

| Component | Strategy |
|-----------|----------|
| **Avatar** | Stacked transparent layers (body → outfit → hair → eyes → hat → accessory) |
| **SoulSprite** | 16×16 SVG pixel-matrix with mood variants |
| **PixelIcon** | 12×12 SVG nav icons |

**Asset pipeline:** SVG placeholders render immediately; real PNGs dropped into `/public/avatar/` or `/public/sprites/` override placeholders with zero code changes.

---

## Audio

| Approach | Detail |
|----------|--------|
| **Web Audio API** | Procedurally synthesized retro SFX (`src/lib/sfx.ts`) |
| **No audio files** | Zero bundle bloat — tones generated at runtime |
| **Sounds** | `blip`, `select`, `coin`, `levelUp`, `error` |
| **Mute toggle** | HUD control; muted by default |

---

## Domain Logic (Pure TypeScript)

All business rules live in `src/lib/` as testable pure functions:

| Module | Responsibility |
|--------|----------------|
| `soul.ts` | Soul mood, health, aura color, factor messages |
| `stats.ts` | Totals, net flow, impulse ratio, grouping, INR formatting |
| `streak.ts` | Savings streak & deposit consistency |
| `pact.ts` | Weekly savings pact progress & redemption quests |
| `advisor.ts` | Rule-based personalised spending tips |
| `map.ts` / `map3d.ts` | Building height, mood, colors from spend data |
| `leaderboard.ts` | Ranked leaderboard (user + simulated entries) |
| `level.ts` | XP-style level from total savings |
| `avatar.ts` | Avatar catalog, pixel placeholders, randomizer |
| `seed.ts` | Demo data for first-time users |
| `dates.ts` | ISO date helpers |

---

## Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Oxlint** | 1.x | Fast linter (React + TypeScript rules) |
| **@types/react** / **@types/react-dom** | 19.x | React type definitions |
| **@types/node** | 24.x | Node.js types for Vite config |
| **@types/three** | 0.185.x | Three.js type definitions |

### NPM Scripts

```bash
npm run dev      # Start Vite dev server (HMR)
npm run build    # TypeScript check + production build → dist/
npm run preview  # Preview production build locally
npm run lint     # Run Oxlint
```

---

## Project Structure

```
Selora/
├── public/
│   ├── avatar/          # PNG layers (body, outfit, hair, eyes, hat, accessory)
│   ├── sprites/         # Optional mood sprite PNGs
│   └── favicon.svg
├── src/
│   ├── components/      # Reusable UI (Avatar, SoulAvatar, Card, HUD, Map3D, etc.)
│   ├── pages/           # Route-level screens
│   ├── store/           # Zustand stores (game + UI)
│   ├── lib/             # Pure business logic & utilities
│   ├── types/           # Shared TypeScript interfaces
│   ├── App.tsx          # Router + layout shell
│   ├── main.tsx         # React entry point
│   └── index.css        # Tailwind theme, retro styles, animations
├── index.html           # HTML shell + Google Fonts
├── vite.config.ts       # Vite + React + Tailwind plugins
├── tsconfig.json        # TypeScript project references
├── package.json
└── .oxlintrc.json       # Linter config
```

---

## Key Features (Product ↔ Tech Mapping)

| Feature | Screen | Technologies Used |
|---------|--------|-------------------|
| **Soul avatar & mood** | Home | Zustand, `soul.ts`, Avatar component, CSS animations |
| **Spend / save logging** | Log | Zustand persist, Framer Motion, form validation |
| **Isometric spending map** | Map | Three.js / R3F, IsoWorld SVG fallback, `map.ts` |
| **Spending insights** | Insights | Recharts, `stats.ts`, time-range filters |
| **AI-style advisor tips** | Advisor | Rule engine in `advisor.ts` (no external AI API) |
| **Weekly pact & leaderboard** | Pact | `pact.ts`, `leaderboard.ts`, Avatar on user row |
| **Avatar creator** | Create | Layered SVG/PNG renderer, `avatar.ts` catalog |
| **HUD status bar** | Global | Level, streak, savings, avatar portrait, CRT/mute toggles |
| **Retro pixel aesthetic** | Global | Tailwind tokens, Press Start 2P, CRT overlay, pixelated rendering |

---

## Browser APIs Used

| API | Usage |
|-----|-------|
| **localStorage** | Persist game & UI state (via Zustand middleware) |
| **Web Audio API** | Procedural retro sound effects |
| **WebGL** | Three.js 3D map (with 2D fallback) |

---

## Design Philosophy

1. **Client-first** — No server, no database, no auth. Runs entirely in the browser.
2. **Retro-faithful** — Pixelated rendering, sharp corners, chunky borders, step-based animations.
3. **Progressive assets** — SVG placeholders work out of the box; PNG art drops in later without code changes.
4. **Separation of concerns** — Store holds data; `src/lib/` holds logic; components handle presentation.
5. **Mobile-first** — Max-width layout, bottom nav, touch-friendly controls, safe-area padding.
6. **Resilient rendering** — Error boundaries and fallbacks for 3D map; avatar works without any PNG assets.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

---

## Summary Table (Quick Reference)

| Layer | Stack |
|-------|-------|
| **UI** | React 19, TypeScript, Tailwind CSS 4 |
| **Routing** | React Router DOM 7 |
| **State** | Zustand 5 + localStorage persist |
| **Animation** | Framer Motion + CSS keyframes |
| **Charts** | Recharts 3 |
| **3D** | Three.js + React Three Fiber + Drei |
| **Audio** | Web Audio API (no files) |
| **Build** | Vite 8 |
| **Lint** | Oxlint |
| **Fonts** | Press Start 2P, VT323 (Google Fonts) |
| **Backend** | None — fully client-side |

---

*Selora — Gamified Savings. Built with modern web tools, styled like a classic RPG.*
