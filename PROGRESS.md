# Progress Board — Challenge Hub

Last updated: 2026-07-07

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
| 3.3 | `POST /api/content` — create draft (auth required) | 🟢 | zod validation, generateCode(), guest auth support |
| 3.4 | `PUT /api/content/[code]` — update draft (auth required) | 🟢 | 3 tests passing (403 ownership check) |
| 3.5 | `POST /api/content/[code]/publish` — publish (auth required) | 🟢 | 3 tests passing |
| 3.6 | `POST /api/ratings` — create rating (auth required) | 🟢 | 6 tests passing (validation + upsert) |
| 3.7 | Write `lib/code.ts` (test code generator) | 🟢 | 2×5 chars, ambiguous letters excluded |
| 3.8 | Test all endpoints with `curl` / REST client | 🟢 | 27/27 bun tests passing |
| 3.9 | `POST /api/content/[code]/play` — increment play count | 🟢 | No auth, only increments if published |
| 3.10 | `POST /api/content/[code]/result` — record win/loss | 🟢 | Updates plays/wins/losses, inserts into challenge_results |

---

## Phase 4: Web App — Builder Page

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | `/build` page — challenge builder form | 🟢 | Full layout: name/desc, jokers, consumables, vouchers, deck, blind bans, JSON preview sidebar, Save Draft + Publish buttons |
| 4.2 | Joker picker (combobox with vanilla joker list) | 🟢 | `JokerPicker` wrapper + edition picker (Foil/Holo/Poly/Neg) + eternal toggle per joker |
| 4.3 | Consumable picker | 🟢 | `ConsumablePicker` wrapper — Tarot/Planet/Spectral, set-coloured tooltips |
| 4.4 | Voucher picker | 🟢 | `VoucherPicker` wrapper |
| 4.5 | Restrictions picker (blinds, cards, tags) | 🟢 | BossBlindPicker — toggle chips for 28 boss blinds; "Ban All" buttons |
| 4.6 | Rules/modifiers editor | ⬜ | |
| 4.7 | Live JSON preview panel | 🟢 | Sidebar with auto-updating JSON + Copy button |
| 4.8 | "Save Draft" button → POST /api/content | 🟢 | Integrated in header bar with loading/error states |
| 4.9 | "Publish" button → POST /api/content/[code]/publish | 🟢 | Integrated in header bar; Zod validation (description, boss blind limit, deck minimum, unique title) |
| 4.10 | Test code display (copyable) after save | 🟢 | Code badge shown in header bar after save |
| 4.11 | `/build?code=xxx` — edit existing draft | 🟢 | Loads draft from API, populates all fields including banned items |
| 4.12 | Deck presets (Full / Strip / Prism) | 🟢 | `DeckEditor` has preset buttons to quickly set standard deck configurations |

---

## Phase 5: Web App — Hub + Detail Pages

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | `/` hub page — browse published challenges | 🟢 | Explore page with Recent / Most Played / Highest Rated sections; real-time Supabase subscriptions |
| 5.2 | Search bar (debounced) | 🟡 | API supports `?search=` but no client-side search input on explore page yet |
| 5.3 | Sort by: rating, newest, most downloads | 🟢 | Server-side sorting via API; 3 curated sections on explore page |
| 5.4 | Tag filter chips | ⬜ | |
| 5.5 | Challenge card component (name, author, stars, downloads) | 🟢 | `ChallengeCard` in `explore-client.tsx` |
| 5.6 | `/challenge/[code]` detail page | 🟢 | Full detail page with stat badges, sprite-sheet icons for jokers/consumables/vouchers, item lists |
| 5.7 | Rating widget (1-5 stars + comment) | ⬜ | Rating is displayed as read-only stat; interactive rating not built |
| 5.8 | "/" landing page (featured/popular challenges) | 🟢 | Explore page serves as hub |
| 5.9 | My Content page (user's drafts + published) | 🟢 | `my-challenges/page.tsx` with list, edit, delete, publish actions |

---

## Phase 6: Mod — API Client

| # | Task | Status | Notes |
|---|---|---|---|
| 6.1 | Create mod skeleton (`mod.json`, `main.lua`, `src/`) | 🟢 | `main.lua`, `mod.json`, `src/api.lua` (7.4 KB), `src/ui.lua` (8.2 KB), `lovely/challenge_add.toml` |
| 6.2 | Implement `src/api.lua` — luasocket HTTP client | 🟢 | Full HTTP client with luasocket; SSL via luasec, raw TCP fallback; 5s timeout |
| 6.3 | `HubAPI.list()` — fetch published list | 🟡 | `get_by_code()`, `test_connection()`, `increment_plays()` implemented; `list()` not yet |
| 6.4 | `HubAPI.get_by_code()` — fetch single by code | 🟢 | Fetches draft or published by code |
| 6.5 | Background thread for non-blocking HTTP | 🟡 | Uses deferred event (`G.E_MANAGER:add_event`) for non-blocking UI; no `love.thread` yet |
| 6.6 | Error handling (timeout, connection refused, bad response) | 🟢 | Timeout at 5s, detailed error messages for all failure modes |
| 6.7 | Configure VPS IP in mod settings | 🟢 | `config.json` with `api_host` and `api_use_https`; separate dev/prod configs |

---

## Phase 7: Mod — UI + Integration

| # | Task | Status | Notes |
|---|---|---|---|
| 7.1 | Config tab: "Playtest" section (code input + fetch button) | 🟢 | "Load Hub Challenge" button on Challenges tab; code overlay with paste support, Play button, status feedback |
| 7.2 | Config tab: "Discover" section (search + scrollable list) | ⬜ | Only manual code entry; no in-game browse UI yet |
| 7.3 | Config tab: "Installed" section (local list + remove) | ⬜ | |
| 7.4 | Install button → fetch JSON → save to `challenges/` | ⬜ | Challenge is cached to `hub_challenges/` on play, but no explicit install flow |
| 7.5 | Remove button → delete JSON from `challenges/` | ⬜ | |
| 7.6 | Playtest flow: fetch by code → load → start run | 🟢 | Full flow: code entry → HTTP fetch → register → start_run; increments play count |
| 7.7 | Integrate existing `loader.lua` (JSON → SMODS.Challenge) | 🟢 | `register_hub_challenge()` shared function; cached challenges reloaded on game start |
| 7.8 | Refresh button (reload from API + reload local files) | ⬜ | |

---

## Phase 8: Polish + Deploy

| # | Task | Status | Notes |
|---|---|---|---|
| 8.1 | Dockerfile for Bun + Next.js production build | 🟢 | Multi-stage Dockerfile; mod zip bundled into public/ as static asset |
| 8.2 | Nginx config (HTTPS for web, plain :3001 for mod) | ⬜ | Not needed with Fly.io (handles HTTPS at edge) |
| 8.3 | Certbot SSL certificate setup | ⬜ | Fly.io provides automatic SSL |
| 8.4 | DNS — point domain to VPS | 🟡 | Fly.io handles routing; `fly.toml` configured |
| 8.5 | Error handling polish (toast notifications, loading states) | 🟡 | Loading states and error messages in build UI; mod overlay shows status |
| 8.6 | Mod: cache API responses locally (offline resilience) | 🟢 | Challenges saved to `hub_challenges/` directory on play; re-loaded on game restart |
| 8.7 | Mod: limit API calls with local cache | ⬜ | |
| 8.8 | Rate limiting on API endpoints | ⬜ | |
| 8.9 | Smoke test: full flow (build → playtest → publish → install) | ⬜ | |

---

## Phase 9: Platform / Infrastructure

| # | Task | Status | Notes |
|---|---|---|---|
| 9.1 | Supabase migration (replaces direct Postgres pool) | 🟢 | `supabase/migrations/`, `utils/supabase/` client/server, real-time subscriptions |
| 9.2 | Challenge results tracking (plays, wins, losses) | 🟢 | `POST /api/content/:code/play` and `/result` endpoints; `challenge_results` table |
| 9.3 | Guest user access flow | 🟢 | Guest auth via `/api/auth/guest`; can create/own drafts before Discord sign-in; `claimed` param on explore page |
| 9.4 | Fly.io deployment | 🟢 | `fly.toml` + `fly.dev.toml`; builds via Dockerfile; secrets via `fly-secrets.sh` |
| 9.5 | Mod zip bundling for download | 🟢 | `build-mod-zip.sh` script; Dockerfile builds zip into static assets; `bump-mod-version.sh` |
| 9.6 | Dev/prod environment separation | 🟢 | `docs/dev-environment.md`; separate Supabase project + Fly app for development branch |
| 9.7 | Install page (`/install`) | 🟢 | `install/page.tsx` — instructions + download link for mod zip |
| 9.8 | GPL-3.0 License | 🟢 | `LICENSE` file added |

---

## Session Notes (2026-07-07)

### What's built

- **VPS**: Docker + Postgres running. Local: `docker compose -f docker-compose-local.yml` on port 5455.
- **Database**: Migrated to Supabase (`supabase/migrations/`). Tables: `content`, `ratings`, `users`, `challenge_results`. Realtime subscriptions for explore page.
- **API**: All 10 endpoints implemented (list, get, create, update, delete, publish, play, result, ratings, health). Auth is hand-rolled JWT via `jose` — no NextAuth. GET /api/content/:code returns drafts to anyone with the code. Guest users (no Discord) can create/edit their own drafts and claim them later via Discord OAuth. Challenge results tracked (plays, wins, losses).
- **Web**: Next.js + Bun + Tailwind. Pages: `login` (Discord OAuth → JWT session), `/` explore hub (recent/popular/top-rated with Supabase real-time), `/build` (full challenge builder), `/challenge/[code]` (detail page with sprite icons), `/my-challenges` (user's drafts + published), `/install` (mod download page).
- **Builder**: Name + description (always visible), 3-step wizard (Starting State, Restrictions, Deck). Starting jokers have per-instance edition picker + eternal toggle. Starting jokers/consumables support duplicates. Banned jokers/consumables/vouchers/blinds with "Ban All" buttons. Deck editor with sprite-based 4×13 grid, +/- count buttons per card, hover-to-edit, floating detail panel with per-copy enhancement/edition/seal selectors, Deck Preset buttons (Full/Strip/Prism). Live JSON preview sidebar. Save Draft (POST→PUT on re-save), Publish with Zod validation (description, boss blind limit, deck minimum, unique title). URL updates to ?code= on first save.
- **Data**: Extraction script at `scripts/extract-game-data.ts` pulls 150 jokers, 52 consumables, 32 vouchers, 30 blinds + sprite atlases from Balatro.love into `web/public/data/` and `web/public/sprites/`.
- **Components**: `ItemPicker` (reusable sprite-grid picker with portal tooltips, search, `renderTooltip`/`getTitle` props), `JokerPicker`, `ConsumablePicker`, `VoucherPicker` (dedicated wrapper components), `DeckEditor` (sprite-based 4×13 card grid with count controls, floating detail panel for per-copy enhancement/edition/seal, preset buttons). `SelectedItemCard`/`SelectedItemList` (unified card layout with optional settings, used across all picker sections). `DescriptionText` (parses Balatro `{C:red}` tags and `#N#` placeholders). `ExploreClient` (real-time challenge list with Supabase subscriptions).
- **Mod**: `challenge-loader` Lua mod (Steamodded) — loads JSON challenges from `challenges/` directory. Full HTTP client (`src/api.lua`) with luasocket (SSL via luasec, raw TCP fallback), configurable server host. "Load Hub Challenge" button on Challenges tab with code input, paste, Play, and status feedback. Caches fetched challenges to `hub_challenges/` for offline resilience. Tracks play count via `HubAPI.increment_plays()`. Build pipeline (`build-mod-zip.sh`) produces `challenge-loader-mod.zip`.
- **Infrastructure**: Multi-stage Dockerfile with mod zip bundling. Fly.io deployment config (`fly.toml`). Dev/prod environment separation (`fly.dev.toml`, separate Supabase project). GPL-3.0 license.
- **Storybook**: Storybook 10 + `@storybook/nextjs-vite` with Vitest + Playwright (Chromium). 5 stories, 11 tests passing.

### Key files for next session

| File | What |
|---|---|
| `components/deck-editor.tsx` | DeckEditor component — sprite grid, count controls, floating detail panel, `CardInstance` type, preset buttons |
| `components/item-picker.tsx` | Reusable sprite picker — use for jokers, consumables, vouchers, blinds |
| `components/explore-client.tsx` | Explore page client component with Supabase real-time subscriptions |
| `lib/description-parser.tsx` | `DescriptionText` component — renders Balatro descriptions with color tags + variable resolution |
| `scripts/extract-game-data.ts` | `bun run scripts/extract-game-data.ts` to refresh game data |
| `web/public/data/jokers.json` | 150 vanilla jokers with id, name, pos, rarity, cost, config |
| `web/public/data/joker-descriptions.json` | 148 joker descriptions (Balatro localization, `#N#` format) |
| `web/public/sprites/` | Sprite atlases (Jokers.png, Tarots.png, etc.) at 2x resolution |
| `app/api/content/route.ts` | GET list + POST create |
| `app/api/content/[code]/route.ts` | GET single + PUT update + DELETE |
| `app/api/content/[code]/publish/route.ts` | POST publish |
| `app/api/content/[code]/play/route.ts` | POST increment play count |
| `app/api/content/[code]/result/route.ts` | POST record win/loss result |
| `app/api/ratings/route.ts` | POST rating |
| `lib/auth.ts` | `createSession()`, `getSession()`, `requireAuth()`, `destroySession()`, guest auth support |
| `lib/db.ts` | `db.query()` — pg Pool |
| `lib/code.ts` | `generateCode()` → "XXXXX-XXXXX" |
| `lib/schemas.ts` | Zod schemas for challenge JSON, publish validation, unique title check |
| `mod/main.lua` | Mod entry point — loads HTTP client + UI, caches hub challenges |
| `mod/src/api.lua` | `HubAPI` — HTTP client with luasocket, get_by_code, increment_plays, test_connection |
| `mod/src/ui.lua` | "Load Hub Challenge" overlay UI — code input, paste, play flow, status feedback |
| `scripts/build-mod-zip.sh` | `bash scripts/build-mod-zip.sh` to create distributable zip |
| `scripts/bump-mod-version.sh` | Bump version in mod.json |
| `Dockerfile` | Multi-stage Bun + Next.js production build with mod zip bundling |
| `fly.toml` / `fly.dev.toml` | Fly.io deployment configs |
| `supabase/migrations/` | Database schema migrations |
| `docs/dev-environment.md` | Dev/prod environment separation guide |

### What to build next

1. **Mod — Browse & Install**: In-game challenge discovery UI (search + scrollable list), install/remove buttons, `HubAPI.list()`.
2. **Web — Tags & Rating**: Tag filter chips on explore page, interactive star rating widget on detail page.
3. **Web — Client-side search**: Add debounced search input on explore page.
4. **Polish**: Rate limiting, full smoke test, rules/modifiers editor.
5. **Future enhancements**: (see PLAN.md → Future Enhancements, including Daily Challenge)

### Gotchas

- Dev server: `cd web && bun --bun run dev` (port 3000)
- Local DB: `docker compose -f docker-compose-local.yml up -d` (port 5455)
- Tests: `cd web && bun test` (27 tests, no extra deps)
- Data refresh: `bun run scripts/extract-game-data.ts` (from project root)
- Discord OAuth: needs `.env` with `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `JWT_SECRET`
- `pg` needs `serverExternalPackages: ["pg"]` in `next.config.ts` for Turbopack
- **Deck editor**: Sprite atlas uses 8BitDeck.png at 1x (923×380, 71×95 cells). Suits: Hearts=row0, Clubs=row1, Diamonds=row2, Spades=row3. **Ranks: 2=col0, 3=col1, …, K=col11, A=col12** (Ace is last, not first!)
- JSON deck format: `yes_suits`/`no_suits` use single letters (H/C/D/S), `yes_ranks`/`no_ranks` use single chars (2-9/T/J/Q/K/A), `cards` use `{s: "H", r: "A"}`.
- Card enhancements output `e` field (m_bonus, m_steel, etc.), editions output `d` field (e_foil, e_holo, etc.), seals output `g` field (red, blue, gold, purple).
- Challenge JSON stat modifiers go in `rules.modifiers` array: `[{ id: "dollars", value: 20 }]`, NOT at the top level.
- `allStandard` check must include instance attributes: `c.instances.every(i => !i.enhancement && !i.edition && !i.seal)` or custom cards won't appear in JSON output.
- **Deploy**: `fly deploy` from project root. Dev env uses `fly.dev.toml` (app: `balatro-challenge-hub-dev`).
- **Supabase migrations**: `supabase db push` from `supabase/` directory. Local: `supabase start`.
- **Mod build**: `bash scripts/build-mod-zip.sh` → `public/challenge-loader-mod.zip`; version bump: `bash scripts/bump-mod-version.sh`.
- **Guest auth**: Guest users get a UUID cookie. Their drafts are linked via `guest_id` column. After Discord login, drafts can be claimed (redirect to explore page with `?claimed=N`).
