# Graph Report - .  (2026-07-07)

## Corpus Check
- 104 files · ~76,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 410 nodes · 0 edges · 48 communities (24 shown, 24 thin omitted)
- Extraction: 0% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
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
- [[_COMMUNITY_Mod Manifest|Mod Manifest]]
- [[_COMMUNITY_MSW Service Worker|MSW Service Worker]]
- [[_COMMUNITY_Navigation & Guest UI|Navigation & Guest UI]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Install Page|Install Page]]
- [[_COMMUNITY_Middleware|Middleware]]
- [[_COMMUNITY_Auth Callback Test|Auth Callback Test]]
- [[_COMMUNITY_Content List Test|Content List Test]]
- [[_COMMUNITY_Storybook Config|Storybook Config]]
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
1. `prefix` - 0 edges
2. `author` - 0 edges
3. `main_file` - 0 edges
4. `build-mod.sh script` - 0 edges
5. `bump-mod-version.sh script` - 0 edges
6. `fly-secrets-dev.sh script` - 0 edges
7. `config` - 0 edges
8. `mswHandlers` - 0 edges
9. `preview` - 0 edges
10. `mockQuery` - 0 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (48 total, 24 thin omitted)

### Community 0 - "Picker Components & Stories"
Cohesion: 0.06
Nodes (32): ConsumablePickerProps, SET_COLORS, Default, SAMPLE_CONSUMABLES, Story, ItemPickerProps, PickerItem, CssCheck (+24 more)

### Community 1 - "API Routes & Shared Libraries"
Cohesion: 0.06
Nodes (41): Development Environment Architecture, Development Supabase: balatro-challenge-hub-dev, Production Supabase: balatro-challenge-hub, guest_id Column on Content Table, Guest User Access Design, mod/src/api.lua — HTTP Client, mod/lovely/challenge_add.toml — Challenge Tab Patch, mod/main.lua — Entry Point (+33 more)

### Community 2 - "Documentation & Architecture Plans"
Cohesion: 0.13
Nodes (5): SECRET, Session, db, pool, ratingSchema

### Community 3 - "Challenge Detail & Sprites"
Cohesion: 0.12
Nodes (11): createSchema, bannedItemSchema, ChallengeJson, challengeJsonSchema, consumableSchema, deckCardSchema, deckSchema, editionSchema (+3 more)

### Community 4 - "Dev Dependencies"
Cohesion: 0.08
Nodes (26): devDependencies, @chromatic-com/storybook, eslint, eslint-config-next, eslint-plugin-storybook, mockdate, msw, msw-storybook-addon (+18 more)

### Community 5 - "Package Configuration"
Cohesion: 0.08
Nodes (12): ChallengeRow, GameItem, ItemEntry, SpriteConfig, SPRITES, BUTTON_SIZE, CODE_COLOR, CodeDisplayProps (+4 more)

### Community 6 - "Deck Editor"
Cohesion: 0.08
Nodes (23): dependencies, jose, next, pg, react, react-dom, @supabase/ssr, @supabase/supabase-js (+15 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.11
Nodes (14): CardInstance, DeckCard, DeckEditorProps, EDITIONS, ENHANCEMENTS, RANKS, SEALS, Default (+6 more)

### Community 8 - "Explore Page & Supabase Client"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "In-Game Mod Architecture"
Cohesion: 0.15
Nodes (15): Challenge Code Detail Page, Challenge Builder View, Visual Challenge Builder, ConsumablePicker Component, DeckEditor Component, DescriptionText Component, Extract Game Data Script (scripts/extract-game-data.ts), ItemPicker Component (+7 more)

### Community 10 - "Mod Source: API & UI"
Cohesion: 0.18
Nodes (3): ChallengeRow, SortKey, ChallengeRow

### Community 12 - "Mod Manifest"
Cohesion: 0.22
Nodes (8): author, dependencies, description, id, main_file, name, prefix, version

### Community 15 - "Root Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **235 isolated node(s):** `id`, `name`, `prefix`, `author`, `description` (+230 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `id`, `name`, `prefix` to the rest of the system?**
  _241 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Picker Components & Stories` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `API Routes & Shared Libraries` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Documentation & Architecture Plans` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Challenge Detail & Sprites` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._
- **Should `Package Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._