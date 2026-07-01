# Progress Board — Challenge Hub

Last updated: 2026-07-01

## Legend

- ⬜ Not started
- 🟡 In progress
- 🟢 Done
- 🔴 Blocked

---

## Phase 1: VPS + Database

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Confirm VPS OS and SSH access | 🟢 | AlmaLinux 10.2, x86_64, SSH OK |
| 1.2 | Install Docker + Docker Compose on VPS | 🟢 | Docker 29.6.0, Compose v5.2.0 |
| 1.3 | Create `docker-compose.yml` with Postgres 16 | 🟢 | docker-compose.yml + db/schema.sql written |
| 1.4 | Run database migrations (`db/schema.sql`) | 🟢 | Auto-ran on container init — all tables created |
| 1.5 | Verify tables exist, indexes created | 🟢 | content, ratings, users — all present |

---

## Phase 2: Next.js Scaffold + Auth

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | `bun create next-app` project scaffold | 🟢 | Created in `web/` — TS, Tailwind, App Router |
| 2.2 | Configure `bun --bun next dev` scripts | 🟢 | Updated all scripts |
| 2.3 | Install deps: `jose`, `pg`, `zod` | 🟢 | All installed |
| 2.4 | Set up Tailwind (no shadcn/ui) | 🟢 | Tailwind v4 already included by `create next-app` |
| 2.5 | Create Discord application (Developer Portal) | 🟢 | Client ID + secret obtained |
| 2.6 | Implement hand-rolled Discord OAuth | 🟢 | lib/auth.ts, login + callback routes written |
| 2.7 | Test Discord login flow | 🟢 | OAuth → callback → user saved → session set |
| 2.8 | Set up `lib/db.ts` (Postgres client) | 🟢 | pg Pool from DATABASE_URL |
| 2.9 | Create `.env` with all required vars | 🟢 | DATABASE_URL, DISCORD_*, JWT_SECRET set |

---

## Phase 3: API Routes

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | `GET /api/content` — list with search, sort, filter, pagination | 🟢 | 6 tests passing |
| 3.2 | `GET /api/content/[code]` — get single by code | 🟢 | 3 tests passing |
| 3.3 | `POST /api/content` — create draft (auth required) | 🟢 | zod validation, generateCode() |
| 3.4 | `PUT /api/content/[code]` — update draft (auth required) | 🟢 | 3 tests passing (403 ownership check) |
| 3.5 | `POST /api/content/[code]/publish` — publish (auth required) | 🟢 | 3 tests passing |
| 3.6 | `POST /api/ratings` — create rating (auth required) | 🟢 | 6 tests passing (validation + upsert) |
| 3.7 | Write `lib/code.ts` (test code generator) | 🟢 | 2×5 chars, ambiguous letters excluded |
| 3.8 | Test all endpoints with `curl` / REST client | 🟢 | 27/27 bun tests passing |

---

## Phase 4: Web App — Builder Page

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | `/build` page — challenge builder form | 🟢 | Full layout: name/desc, jokers, consumables, vouchers, deck, blind bans, JSON preview sidebar, Save Draft + Publish buttons |
| 4.2 | Joker picker (combobox with vanilla joker list) | 🟢 | `JokerPicker` wrapper — sprite grid + tooltips with description text |
| 4.3 | Consumable picker | 🟢 | `ConsumablePicker` wrapper — Tarot/Planet/Spectral, set-coloured tooltips |
| 4.4 | Voucher picker | 🟢 | `VoucherPicker` wrapper |
| 4.5 | Restrictions picker (blinds, cards, tags) | 🟢 | BossBlindPicker — toggle chips for 28 boss blinds |
| 4.6 | Rules/modifiers editor | ⬜ | |
| 4.7 | Live JSON preview panel | 🟢 | Sidebar with auto-updating JSON + Copy button |
| 4.8 | "Save Draft" button → POST /api/content | 🟢 | Integrated in header bar with loading/error states |
| 4.9 | "Publish" button → POST /api/content/[code]/publish | 🟢 | Integrated in header bar (enabled after draft is saved) |
| 4.10 | Test code display (copyable) after save | 🟢 | Code badge shown in header bar after save |
| 4.11 | `/build?code=xxx` — edit existing draft | ⬜ | API endpoint ready (3.4) |

---

## Phase 5: Web App — Hub + Detail Pages

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | `/hub` page — browse published challenges | ⬜ | |
| 5.2 | Search bar (debounced) | ⬜ | |
| 5.3 | Sort by: rating, newest, most downloads | ⬜ | |
| 5.4 | Tag filter chips | ⬜ | |
| 5.5 | Challenge card component (name, author, stars, downloads) | ⬜ | |
| 5.6 | `/challenge/[code]` detail page | ⬜ | |
| 5.7 | Rating widget (1-5 stars + comment) | ⬜ | |
| 5.8 | "/" landing page (featured/popular challenges) | ⬜ | |
| 5.9 | My Content page (user's drafts + published) | ⬜ | |

---

## Phase 6: Mod — API Client

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Create mod skeleton (`mod.json`, `main.lua`, `src/`) | ⬜ | |
| 6.2 | Implement `src/api.lua` — luasocket HTTP client | ⬜ | Based on Multiplayer mod pattern |
| 6.3 | `HubAPI.list()` — fetch published list | ⬜ | |
| 6.4 | `HubAPI.get_by_code()` — fetch single by code | ⬜ | |
| 6.5 | Background thread for non-blocking HTTP | ⬜ | love.thread + Channel pattern |
| 6.6 | Error handling (timeout, connection refused, bad response) | ⬜ | |
| 6.7 | Configure VPS IP in mod settings | ⬜ | |

---

## Phase 7: Mod — UI + Integration

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Config tab: "Playtest" section (code input + fetch button) | ⬜ | |
| 7.2 | Config tab: "Discover" section (search + scrollable list) | ⬜ | |
| 7.3 | Config tab: "Installed" section (local list + remove) | ⬜ | |
| 7.4 | Install button → fetch JSON → save to `challenges/` | ⬜ | |
| 7.5 | Remove button → delete JSON from `challenges/` | ⬜ | |
| 7.6 | Playtest flow: fetch by code → load → start run | ⬜ | |
| 7.7 | Integrate existing `loader.lua` (JSON → SMODS.Challenge) | ⬜ | |
| 7.8 | Refresh button (reload from API + reload local files) | ⬜ | |

---

## Phase 8: Polish + Deploy

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | Dockerfile for Bun + Next.js production build | ⬜ | |
| 8.2 | Nginx config (HTTPS for web, plain :3001 for mod) | ⬜ | |
| 8.3 | Certbot SSL certificate setup | ⬜ | |
| 8.4 | DNS — point domain to VPS | ⬜ | |
| 8.5 | Error handling polish (toast notifications, loading states) | ⬜ | |
| 8.6 | Mod: cache API responses locally (offline resilience) | ⬜ | |
| 8.7 | Mod: limit API calls with local cache | ⬜ | |
| 8.8 | Rate limiting on API endpoints | ⬜ | |
| 8.9 | Smoke test: full flow (build → playtest → publish → install) | ⬜ | |

---

## Session Notes (2026-07-01)

### What's built

- **VPS**: Docker + Postgres running. Local: `docker compose -f docker-compose-local.yml` on port 5455.
- **API**: All 7 endpoints implemented + 27/27 tests passing (`bun test`). Auth is hand-rolled JWT via `jose` — no NextAuth.
- **Web**: Next.js + Bun + Tailwind. Pages: `login` (Discord OAuth → JWT session), `test-picker` (joker browser demo).
- **Data**: Extraction script at `scripts/extract-game-data.ts` pulls 150 jokers, 52 consumables, 32 vouchers, 30 blinds + sprite atlases from Balatro.love into `web/public/data/` and `web/public/sprites/`.
- **Components**: `ItemPicker` (reusable sprite-grid picker with portal tooltips, search, `renderTooltip`/`getTitle` props), `JokerPicker`, `ConsumablePicker`, `VoucherPicker` (dedicated wrapper components). `DescriptionText` (parses Balatro `{C:red}` tags and `#N#` placeholders from config into styled React elements).
- **Storybook**: Storybook 10 + `@storybook/nextjs-vite` with Vitest + Playwright (Chromium). 4 stories, 8 tests passing. Run with `bun run storybook` or `npx vitest --project storybook run`.

### Key files for next session

| File | What |
|---|---|
| `components/item-picker.tsx` | Reusable sprite picker — use for jokers, consumables, vouchers, blinds |
| `lib/description-parser.tsx` | `DescriptionText` component — renders Balatro descriptions with color tags + variable resolution |
| `scripts/extract-game-data.ts` | `bun run scripts/extract-game-data.ts` to refresh game data |
| `web/public/data/jokers.json` | 150 vanilla jokers with id, name, pos, rarity, cost, config |
| `web/public/data/joker-descriptions.json` | 148 joker descriptions (Balatro localization, `#N#` format) |
| `web/public/sprites/` | Sprite atlases (Jokers.png, Tarots.png, etc.) at 2x resolution |
| `app/api/content/route.ts` | GET list + POST create |
| `app/api/content/[code]/route.ts` | GET single + PUT update + DELETE |
| `app/api/content/[code]/publish/route.ts` | POST publish |
| `app/api/ratings/route.ts` | POST rating |
| `lib/auth.ts` | `createSession()`, `getSession()`, `requireAuth()`, `destroySession()` |
| `lib/db.ts` | `db.query()` — pg Pool |
| `lib/code.ts` | `generateCode()` → "XXXXX-XXXXX" |
| `docker-compose-local.yml` | Local Postgres on port 5455 |
| `docker-compose.yml` | VPS Postgres |
| `db/schema.sql` | Full schema |

### What to build next

1. **`/build` page** — Challenge builder form. Integrate `ItemPicker` for jokers (task 4.1).
2. Add consumable, voucher, and restriction pickers (same `ItemPicker`, different data).
3. Live JSON preview panel.
4. Save Draft / Publish buttons (API endpoints already done).
5. Then Phase 5 (Hub + detail pages).

### Gotchas

- Dev server: `cd web && bun --bun run dev` (port 3000)
- Local DB: `docker compose -f docker-compose-local.yml up -d` (port 5455)
- Tests: `cd web && bun test` (27 tests, no extra deps)
- Data refresh: `bun run scripts/extract-game-data.ts` (from project root)
- Discord OAuth: needs `.env` with `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `JWT_SECRET`
- `pg` needs `serverExternalPackages: ["pg"]` in `next.config.ts` for Turbopack
- Bun test with `mock.module()` — exports are frozen, use mutable variables for auth state switching
