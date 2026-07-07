# Graph Report - .  (2026-07-07)

## Corpus Check
- 105 files · ~76,489 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 411 nodes · 507 edges · 48 communities (26 shown, 22 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Picker Components & Stories|Picker Components & Stories]]
- [[_COMMUNITY_API Routes & Shared Libraries|API Routes & Shared Libraries]]
- [[_COMMUNITY_Documentation & Architecture Plans|Documentation & Architecture Plans]]
- [[_COMMUNITY_Challenge Detail & Sprites|Challenge Detail & Sprites]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_Deck Editor|Deck Editor]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Explore Page & Supabase Client|Explore Page & Supabase Client]]
- [[_COMMUNITY_In-Game Mod Architecture|In-Game Mod Architecture]]
- [[_COMMUNITY_Mod Source API & UI|Mod Source: API & UI]]
- [[_COMMUNITY_Zod Validation Schemas|Zod Validation Schemas]]
- [[_COMMUNITY_Mod Manifest|Mod Manifest]]
- [[_COMMUNITY_MSW Service Worker|MSW Service Worker]]
- [[_COMMUNITY_Navigation & Guest UI|Navigation & Guest UI]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Install Page|Install Page]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Auth Callback Test|Auth Callback Test]]
- [[_COMMUNITY_Content List Test|Content List Test]]
- [[_COMMUNITY_Storybook Config|Storybook Config]]
- [[_COMMUNITY_Login Route|Login Route]]
- [[_COMMUNITY_Content Code Test|Content Code Test]]
- [[_COMMUNITY_Content Publish Test|Content Publish Test]]
- [[_COMMUNITY_Ratings Test|Ratings Test]]
- [[_COMMUNITY_Build Mod Script|Build Mod Script]]
- [[_COMMUNITY_Bump Version Script|Bump Version Script]]
- [[_COMMUNITY_Fly Secrets Script|Fly Secrets Script]]
- [[_COMMUNITY_8Bit Deck Sprites|8Bit Deck Sprites]]
- [[_COMMUNITY_Storybook Main Config|Storybook Main Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_File Icon SVG|File Icon SVG]]
- [[_COMMUNITY_Globe Icon SVG|Globe Icon SVG]]
- [[_COMMUNITY_Next.js Logo SVG|Next.js Logo SVG]]
- [[_COMMUNITY_Vercel Logo SVG|Vercel Logo SVG]]
- [[_COMMUNITY_Window Icon SVG|Window Icon SVG]]
- [[_COMMUNITY_README Boilerplate|README Boilerplate]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `db` - 15 edges
3. `Web App (Next.js + Bun)` - 15 edges
4. `PickerItem` - 13 edges
5. `getSession()` - 12 edges
6. `requireAuth()` - 12 edges
7. `In-Game Mod (Steamodded/Lua)` - 10 edges
8. `scripts` - 7 edges
9. `GET()` - 6 edges
10. `ItemPicker()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `ConsumablePicker Component` --shares_data_with--> `Tarots.png - Balatro Tarot/Consumable Cards Spritesheet (2x)`  [EXTRACTED]
  PROGRESS.md → web/public/sprites/Tarots.png
- `Development Supabase: balatro-challenge-hub-dev` --semantically_similar_to--> `PostgreSQL Database`  [INFERRED] [semantically similar]
  docs/dev-environment.md → PLAN.md
- `Production Supabase: balatro-challenge-hub` --semantically_similar_to--> `PostgreSQL Database`  [INFERRED] [semantically similar]
  docs/dev-environment.md → PLAN.md
- `mod/src/api.lua — HTTP Client` --semantically_similar_to--> `luasocket HTTP Client (src/api.lua)`  [INFERRED] [semantically similar]
  mod/AGENTS.md → PLAN.md
- `Phase 2: Next.js Scaffold + Auth` --references--> `Web App (Next.js + Bun)`  [INFERRED]
  PROGRESS.md → PLAN.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Build Phases (Plan → Progress)** — plan_challenge_loader_codebase, progress_phase_1_vps_database, progress_phase_2_nextjs_auth, progress_phase_3_api_routes, progress_phase_4_builder_page, progress_phase_5_hub_detail, progress_phase_6_mod_api_client, progress_phase_7_mod_ui_integration, progress_phase_8_polish_deploy [EXTRACTED 1.00]
- **Visual Challenge Builder Component Tree** — plan_visual_challenge_builder, progress_itempicker, progress_jokerpicker, progress_consumablepicker, progress_voucherpicker, progress_deckeditor, progress_selecteditemcard, progress_descriptiontext [EXTRACTED 1.00]
- **Dual Environment (Production + Dev) Supabase + Fly.io Deployment** — docs_dev_environment_dev_environment, docs_dev_environment_production_supabase, docs_dev_environment_dev_supabase, workflows_deploy_deploy_workflow [INFERRED 0.85]
- **Balatro Card Sprite Atlas System (2x Retina)** — sprites_tarots, sprites_jokers, sprites_blindchips, sprites_vouchers, sprites_boosters, sprites_8bitdeck, sprites_8bitdeck_opt2 [INFERRED 0.85]

## Communities (48 total, 22 thin omitted)

### Community 0 - "Picker Components & Stories"
Cohesion: 0.06
Nodes (36): ConsumablePicker(), ConsumablePickerProps, SET_COLORS, Default, SAMPLE_CONSUMABLES, Story, ItemPicker(), ItemPickerProps (+28 more)

### Community 1 - "API Routes & Shared Libraries"
Cohesion: 0.09
Nodes (30): baseUrl(), callbackUrl(), GET(), DELETE(), PUT(), createSchema, POST(), POST() (+22 more)

### Community 2 - "Documentation & Architecture Plans"
Cohesion: 0.06
Nodes (39): Development Environment Architecture, Development Supabase: balatro-challenge-hub-dev, Production Supabase: balatro-challenge-hub, claimGuestContent(), createGuestSession(), guest_id Column on Content Table, Guest User Access Design, Bun Runtime (+31 more)

### Community 3 - "Challenge Detail & Sprites"
Cohesion: 0.08
Nodes (22): Challenge Code Detail Page, Challenge Builder View, ChallengeDetailPage(), ChallengeRow, GameItem, ItemEntry, loadLookup(), SpriteConfig (+14 more)

### Community 4 - "Dev Dependencies"
Cohesion: 0.08
Nodes (26): devDependencies, @chromatic-com/storybook, eslint, eslint-config-next, eslint-plugin-storybook, mockdate, msw, msw-storybook-addon (+18 more)

### Community 5 - "Package Configuration"
Cohesion: 0.08
Nodes (23): dependencies, jose, next, pg, react, react-dom, @supabase/ssr, @supabase/supabase-js (+15 more)

### Community 6 - "Deck Editor"
Cohesion: 0.11
Nodes (16): buildStandardDeck(), CardInstance, DeckCard, DeckEditorProps, EDITIONS, ENHANCEMENTS, plainInstance(), RANKS (+8 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Explore Page & Supabase Client"
Cohesion: 0.18
Nodes (6): ChallengeRow, SortKey, ChallengeRow, ExplorePage(), fetchChallenges(), createClient()

### Community 9 - "In-Game Mod Architecture"
Cohesion: 0.18
Nodes (13): mod/src/api.lua — HTTP Client, mod/lovely/challenge_add.toml — Challenge Tab Patch, mod/main.lua — Entry Point, SMODS.Challenges Registration, mod/src/ui.lua — UI, In-Game Mod (Steamodded/Lua), luasocket HTTP Client (src/api.lua), No Auth for Mod API (+5 more)

### Community 10 - "Mod Source: API & UI"
Cohesion: 0.23
Nodes (7): HubAPI.get_by_code(), HubAPI.increment_plays(), HubAPI.request(), HubAPI.test_connection(), G.FUNCS.challenge_hub_add_open(), G.FUNCS.challenge_hub_add_play(), G.UIDEF.challenge_hub_add_overlay()

### Community 11 - "Zod Validation Schemas"
Cohesion: 0.18
Nodes (10): bannedItemSchema, ChallengeJson, challengeJsonSchema, consumableSchema, deckCardSchema, deckSchema, editionSchema, jokerSchema (+2 more)

### Community 12 - "Mod Manifest"
Cohesion: 0.22
Nodes (8): author, dependencies, description, id, main_file, name, prefix, version

### Community 13 - "MSW Service Worker"
Cohesion: 0.42
Nodes (8): activeClientIds, getResponse(), handleRequest(), IS_MOCKED_RESPONSE, resolveMainClient(), respondWithMock(), sendToClient(), serializeRequest()

### Community 15 - "Root Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 16 - "Install Page"
Cohesion: 0.50
Nodes (3): getPlatform(), InstallPage(), PLATFORM_PATHS

### Community 17 - "Middleware"
Cohesion: 0.60
Nodes (3): createClient(), config, middleware()

## Ambiguous Edges - Review These
- `luasocket HTTP Client (src/api.lua)` → `Build Mod GitHub Actions Workflow`  [AMBIGUOUS]
  .github/workflows/build-mod.yml · relation: conceptually_related_to

## Knowledge Gaps
- **191 isolated node(s):** `id`, `name`, `prefix`, `author`, `description` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `luasocket HTTP Client (src/api.lua)` and `Build Mod GitHub Actions Workflow`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Tarots.png - Balatro Tarot/Consumable Cards Spritesheet (2x)` connect `Challenge Detail & Sprites` to `Documentation & Architecture Plans`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Web App (Next.js + Bun)` (e.g. with `Phase 2: Next.js Scaffold + Auth` and `Phase 8: Polish + Deploy`) actually correct?**
  _`Web App (Next.js + Bun)` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `id`, `name`, `prefix` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Picker Components & Stories` be split into smaller, more focused modules?**
  _Cohesion score 0.05731523378582202 - nodes in this community are weakly interconnected._
- **Should `API Routes & Shared Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.0935374149659864 - nodes in this community are weakly interconnected._
- **Should `Documentation & Architecture Plans` be split into smaller, more focused modules?**
  _Cohesion score 0.06342780026990553 - nodes in this community are weakly interconnected._