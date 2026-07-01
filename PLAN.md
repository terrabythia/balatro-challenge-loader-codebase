# Challenge Loader Codebase — Full Plan

## Overview

A community hub for creating, sharing, and playing custom Balatro challenges (and eventually jokers, decks, etc.). Two components:

1. **Web App** (Next.js + Bun on VPS) — visual challenge builder, hub for browsing/rating, Discord OAuth login, and REST API (all in one process)
2. **In-Game Mod** (Steamodded/Lua) — browse, install, playtest challenges from inside Balatro

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    VPS (Hostinger)                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ PostgreSQL (Docker)                               │   │
│  │  users, content, ratings                          │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
│  ┌────────────────▼─────────────────────────────────┐   │
│  │ Next.js App (Bun, single process, port 3000)     │   │
│  │                                                  │   │
│  │  Pages:                                          │   │
│  │    /          → Landing + popular challenges      │   │
│  │    /hub       → Browse, search, filter, ratings   │   │
│  │    /build     → Visual challenge builder          │   │
│  │    /login     → Discord OAuth (NextAuth.js)       │   │
│  │                                                  │   │
│  │  API Routes (same process, same port):           │   │
│  │    GET  /api/content?type=&search=&sort=          │   │
│  │    GET  /api/content/:code                        │   │
│  │    POST /api/content          (auth required)     │   │
│  │    PUT  /api/content/:code    (auth required)     │   │
│  │    POST /api/content/:code/publish (auth req'd)   │   │
│  │    POST /api/ratings          (auth required)     │   │
│  │                                                  │   │
│  │  Auth: NextAuth.js (Discord provider)             │   │
│  │  DB:  Bun.sql or pg (Postgres driver)            │   │
│  └────────────────┬─────────────────────────────────┘   │
│                   │                                      │
│  ┌────────────────▼─────────────────────────────────┐   │
│  │ Nginx Reverse Proxy                               │   │
│  │  hub.domain.com :443 → :3000  (HTTPS, web app)    │   │
│  │  Port 3001 → :3000  (plain HTTP, mod's API)       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬────────────────────────────────────┘
                      │ Plain HTTP (luasocket, port 3001)
                      ▼
┌──────────────────────────────────────────────────────────┐
│              In-Game Mod (Steamodded / Lua)              │
│                                                          │
│  src/api.lua     → luasocket HTTP calls to VPS:3001     │
│  src/ui.lua      → config tab (browse, playtest, manage)│
│  src/loader.lua  → JSON → SMODS.Challenge               │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Challenge Hub              [Refresh]             │    │
│  │                                                 │    │
│  │ ── Playtest ─────────────────────────────────── │    │
│  │ Paste code: [__________]    [Fetch & Play]      │    │
│  │                                                 │    │
│  │ ── Discover ─────────────────────────────────── │    │
│  │ 🔍 [Search...]                                  │    │
│  │ ★4.8  Glass Horde           [Install]           │    │
│  │ ★4.2  Eternal Test          [Install]           │    │
│  │ ★3.9  Loaded Start          [Installed ✓]       │    │
│  │                                                 │    │
│  │ ── Installed ────────────────────────────────── │    │
│  │ 📦 Loaded Start             [Remove]            │    │
│  │ 📦 Eternal Test             [Remove]            │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Why No Express?

Next.js API routes handle everything the Express server would have done:

| Concern | Next.js API Route | Express |
|---|---|---|
| HTTP routing | `route.ts` files (file-based routing) | `app.get(...)` |
| Auth middleware | NextAuth `getServerSession()` | Custom middleware |
| Database queries | Same `pg` / `Bun.sql` driver | Same driver |
| JSON responses | `NextResponse.json()` | `res.json()` |
| Request validation | `zod` (same library) | Same library |
| TypeScript types | Shared across pages + API | Separate project or monorepo |

One process, one port, one set of types. Nginx routes both the web app (HTTPS) and the mod's API (plain HTTP) to the same Next.js instance.

### Why Bun?

- **Bun is an official Next.js runtime** — `bun --bun next dev/build/start` works out of the box ([docs](https://bun.sh/docs/guides/ecosystem/nextjs))
- **Native TypeScript** — no `ts-node`, no `tsx`, zero build step for API code
- **Faster than Node.js** — Bun's HTTP server benchmarks 4-5x Node.js
- **Smaller Docker images** — `oven/bun:1-alpine` (~90MB) vs Node alpine (~120MB)
- **`.env` loading built-in** — no `dotenv` dependency
- **`Bun.sql` optional** — built-in Postgres client if we want to skip `pg`

---

## Tech Stack (Final)

| Layer | Technology | Notes |
|---|---|---|
| Runtime | **Bun 1.x** | `bun --bun next dev/build/start` |
| Framework | **Next.js 14** (App Router) | Pages + API routes in one app |
| Styling | **Tailwind CSS** | Utility-first, no component library |
| Auth | **NextAuth.js** (Discord provider) | `app/api/auth/[...nextauth]/route.ts` |
| Database driver | **`pg`** or **`Bun.sql`** | Both work with Bun, `Bun.sql` is native |
| Validation | **zod** | Type-safe request/response validation |
| Hosting | **Docker on VPS** | Two containers: Postgres + Bun/Next.js |
| Reverse proxy | **Nginx** | HTTPS for web, plain HTTP for mod API |

---

## File Structure

```
challenge-hub/
├── docker-compose.yml
├── Dockerfile                  (Bun + Next.js)
├── package.json
├── bun.lockb
├── .env
├── next.config.ts
│
├── app/
│   ├── layout.tsx              (root layout + providers)
│   ├── page.tsx                (landing page)
│   │
│   ├── hub/
│   │   └── page.tsx            (browse + search)
│   │
│   ├── build/
│   │   └── page.tsx            (visual challenge builder)
│   │
│   ├── challenge/
│   │   └── [code]/
│   │       └── page.tsx        (detail page + ratings)
│   │
│   ├── login/
│   │   └── page.tsx            (Discord login button)
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts    (NextAuth config)
│       │
│       ├── content/
│       │   ├── route.ts        (GET list, POST create)
│       │   └── [code]/
│       │       ├── route.ts    (GET by code, PUT update, DELETE)
│       │       └── publish/
│       │           └── route.ts (POST publish)
│       │
│       └── ratings/
│           └── route.ts        (POST create)
│
├── lib/
│   ├── db.ts                   (Postgres client)
│   ├── auth.ts                 (getServerSession helper)
│   └── validation.ts           (zod schemas per content type)
│
├── components/
│   ├── challenge-builder.tsx   (the builder form)
│   ├── challenge-card.tsx      (hub listing card)
│   ├── rating-stars.tsx        (star rating component)
│   └── code-display.tsx        (copyable test code)
│
└── db/
    └── schema.sql              (database migrations)
```

---

## Database Schema (PostgreSQL)

```sql
-- Users (populated on first Discord login)
CREATE TABLE users (
  id         TEXT PRIMARY KEY,        -- Discord user ID (snowflake)
  username   TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- All content types in one extensible table
CREATE TABLE content (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL
              CHECK (type IN ('challenge', 'joker', 'deck')),
  code        TEXT UNIQUE NOT NULL,   -- short code for playtesting
  author_id   TEXT REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  json_data   JSONB NOT NULL,         -- type-specific payload (see below)
  sprite_url  TEXT,                   -- for jokers/decks with custom art
  status      TEXT DEFAULT 'draft'
              CHECK (status IN ('draft', 'published')),
  downloads   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_type_status ON content(type, status);
CREATE INDEX idx_content_code ON content(code);

-- Ratings
CREATE TABLE ratings (
  id           SERIAL PRIMARY KEY,
  content_id   INTEGER REFERENCES content(id) ON DELETE CASCADE,
  user_id      TEXT REFERENCES users(id),
  score        INTEGER CHECK (score >= 1 AND score <= 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, user_id)       -- one rating per user per content
);
```

### Extending to new content types

Adding a new type later requires one SQL change and one validation function:

```sql
ALTER TABLE content DROP CONSTRAINT content_type_check;
ALTER TABLE content ADD CONSTRAINT content_type_check
  CHECK (type IN ('challenge', 'joker', 'deck', 'voucher', 'blind'));
```

```ts
// lib/validation.ts
import { z } from "zod";

const challengeSchema = z.object({
  key: z.string(),
  name: z.string(),
  jokers: z.array(z.object({
    id: z.string(),
    eternal: z.boolean().optional(),
    edition: z.string().optional(),
  })),
  consumeables: z.array(z.object({ id: z.string() })).optional(),
  vouchers: z.array(z.object({ id: z.string() })).optional(),
  restrictions: z.object({
    banned_cards: z.array(z.object({ id: z.string() })).optional(),
    banned_tags: z.array(z.object({ id: z.string() })).optional(),
    banned_other: z.array(z.object({
      id: z.string(),
      type: z.string(),
    })).optional(),
  }).optional(),
  rules: z.object({
    custom: z.array(z.object({ id: z.string() })).optional(),
    modifiers: z.array(z.object({
      id: z.string(),
      value: z.number(),
    })).optional(),
  }).optional(),
  deck: z.object({ type: z.string() }).optional(),
});

const contentSchemas = {
  challenge: challengeSchema,
  joker:     jokerSchema,     // TBD
  deck:      deckSchema,      // TBD
} as const;
```

---

## API Routes

All endpoints at `/api/` on the Next.js server. Nginx routes both port 443 (web) and port 3001 (mod API) to port 3000.

### Public (no auth — used by the mod)

| Method | Path | Query Params | Returns |
|---|---|---|---|
| `GET` | `/api/content` | `?type=challenge&search=&sort=rating&tags=` | Paginated list of published content |
| `GET` | `/api/content/[code]` | — | Single content item by test code |

### Authenticated (Discord session — used by web app pages)

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/api/content` | `{type, name, description, tags, json_data}` | Created content (status: draft) |
| `PUT` | `/api/content/[code]` | Partial content fields | Updated content |
| `POST` | `/api/content/[code]/publish` | — | Published content |
| `DELETE` | `/api/content/[code]` | — | Deleted content |
| `POST` | `/api/ratings` | `{content_id, score, comment}` | Created rating |

### Response Examples

**`GET /api/content?type=challenge`**
```json
{
  "items": [
    {
      "code": "GL4SS-H0RDE",
      "type": "challenge",
      "name": "Glass Horde",
      "author": "Sander",
      "description": "Start with 4 Glass Jokers...",
      "tags": ["hard", "glass"],
      "avg_rating": 4.8,
      "rating_count": 42,
      "downloads": 1234,
      "created_at": "2026-06-30T..."
    }
  ],
  "total": 156
}
```

**`GET /api/content/GL4SS-H0RDE`**
```json
{
  "code": "GL4SS-H0RDE",
  "type": "challenge",
  "name": "Glass Horde",
  "author": "Sander",
  "description": "Start with 4 Glass Jokers. High risk!",
  "tags": ["hard", "glass"],
  "json_data": {
    "key": "glass_horde",
    "name": "Glass Horde",
    "jokers": [
      {"id": "j_glass", "eternal": false},
      {"id": "j_glass", "eternal": false},
      {"id": "j_glass", "eternal": false},
      {"id": "j_glass", "eternal": false}
    ],
    "restrictions": {
      "banned_other": [{"id": "bl_plant", "type": "blind"}]
    }
  },
  "avg_rating": 4.8,
  "rating_count": 42,
  "downloads": 1234
}
```

### Example API Route Implementation

```ts
// app/api/content/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const result = await db.query(
    `SELECT c.*, u.username as author,
            COALESCE(AVG(r.score), 0) as avg_rating,
            COUNT(r.id) as rating_count
     FROM content c
     LEFT JOIN users u ON c.author_id = u.id
     LEFT JOIN ratings r ON r.content_id = c.id
     WHERE c.code = $1 AND c.status = 'published'
     GROUP BY c.id, u.username`,
    [params.code]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
```

```ts
// app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { validateContent } from "@/lib/validation";
import { generateCode } from "@/lib/code";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "challenge";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "rating";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await db.query(
    `SELECT c.code, c.type, c.name, u.username as author,
            c.description, c.tags, c.downloads, c.created_at,
            COALESCE(AVG(r.score), 0) as avg_rating,
            COUNT(r.id) as rating_count
     FROM content c
     LEFT JOIN users u ON c.author_id = u.id
     LEFT JOIN ratings r ON r.content_id = c.id
     WHERE c.status = 'published'
       AND c.type = $1
       AND ($2 = '' OR c.name ILIKE '%' || $2 || '%')
     GROUP BY c.id, u.username
     ORDER BY
       CASE WHEN $3 = 'rating' THEN AVG(r.score) END DESC NULLS LAST,
       CASE WHEN $3 = 'new' THEN c.created_at END DESC,
       CASE WHEN $3 = 'downloads' THEN c.downloads END DESC
     LIMIT $4 OFFSET $5`,
    [type, search, sort, limit, offset]
  );

  const count = await db.query(
    `SELECT COUNT(*) FROM content
     WHERE status = 'published' AND type = $1
       AND ($2 = '' OR name ILIKE '%' || $2 || '%')`,
    [type, search]
  );

  return NextResponse.json({
    items: result.rows,
    total: parseInt(count.rows[0].count),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateContent(body.type, body.json_data);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const code = generateCode();

  const result = await db.query(
    `INSERT INTO content (type, code, author_id, name, description, tags, json_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING code`,
    [body.type, code, session.user.id, body.name, body.description, body.tags, body.json_data]
  );

  return NextResponse.json({ code: result.rows[0].code }, { status: 201 });
}
```

---

## Auth: Discord OAuth via NextAuth.js

```ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { db } from "@/lib/db";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Upsert user in PostgreSQL on first login
      await db.query(
        `INSERT INTO users (id, username, avatar_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE
         SET username = $2, avatar_url = $3`,
        [account!.providerAccountId, user.name, user.image]
      );
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

### Auth Middleware Helper

```ts
// lib/auth.ts
import { getServerSession } from "next-auth";

export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user as { id: string; name: string };
}
```

---

## Docker Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: challenge_hub
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/challenge_hub
      DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: https://hub.yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  pgdata:
```

```dockerfile
# Dockerfile
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun --bun run build

FROM oven/bun:1-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["bun", "--bun", "run", "start"]
```

**package.json scripts (from the Bun + Next.js guide):**
```json
{
  "scripts": {
    "dev": "bun --bun next dev",
    "build": "bun --bun next build",
    "start": "bun --bun next start"
  }
}
```

---

## Deployment: Nginx

```nginx
# Web app (HTTPS)
server {
    listen 443 ssl http2;
    server_name hub.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/hub.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hub.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Mod API (plain HTTP, no TLS — luasocket can't do TLS)
server {
    listen 3001;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

---

## In-Game Mod (Steamodded)

### File Structure

```
challenge-hub/
├── mod.json
├── main.lua
├── src/
│   ├── api.lua         — HTTP client (luasocket, background thread)
│   ├── ui.lua          — Config tab UI (all 3 sections)
│   └── loader.lua      — JSON challenge file loader (already built)
└── challenges/          — installed challenge JSONs land here
```

### mod.json

```json
{
  "id": "challenge_hub",
  "name": "Challenge Hub",
  "prefix": "ch",
  "author": ["Sander"],
  "description": "Browse, install and playtest community challenges from the Challenge Hub.",
  "main_file": "main.lua",
  "version": "1.0.0",
  "dependencies": [
    "Steamodded (>=1.0.0~BETA-0312b)"
  ]
}
```

### main.lua

```lua
local mod = SMODS.current_mod

-- Load subsystems
assert(SMODS.load_file("src/loader.lua"))()
assert(SMODS.load_file("src/api.lua"))()
assert(SMODS.load_file("src/ui.lua"))()

-- Config tab accessible from Mods menu
mod.base.config_tab = function()
    return ChallengeHubUI.build()
end
```

### src/api.lua (HTTP Client)

```lua
-- HTTP client using luasocket in a background love.thread
-- Pattern borrowed from the Multiplayer mod
-- Connects to VPS on port 3001 (plain HTTP, no TLS needed)

local API_HOST = "VPS_IP"   -- configured in mod config
local API_PORT = 3001
local json = require("json")
local socket = require("socket")

local HubAPI = {}

function HubAPI.request(method, path)
    local client = socket.tcp()
    client:settimeout(5)
    local ok, err = client:connect(API_HOST, API_PORT)
    if not ok then
        return nil, err
    end

    local req = method .. " " .. path .. " HTTP/1.1\r\n"
        .. "Host: " .. API_HOST .. ":" .. API_PORT .. "\r\n"
        .. "Connection: close\r\n\r\n"

    client:send(req)
    local response = client:receive("*a")
    client:close()

    -- Parse HTTP response, extract body after headers
    local _, body = response:match("\r?\n\r?\n(.*)")
    if not body then
        return nil, "Empty response"
    end

    return json.decode(body)
end

function HubAPI.list(params)
    local qs = "?status=published"
    if params.type then qs = qs .. "&type=" .. params.type end
    if params.search then qs = qs .. "&search=" .. params.search end
    if params.sort then qs = qs .. "&sort=" .. params.sort end
    return HubAPI.request("GET", "/api/content" .. qs)
end

function HubAPI.get_by_code(code)
    return HubAPI.request("GET", "/api/content/" .. code)
end
```

### src/ui.lua (Config Tab)

```lua
local ChallengeHubUI = {}

function ChallengeHubUI.build()
    -- Returns SMODS UI tree with three sections:
    -- 1. Playtest (code input + fetch button)
    -- 2. Discover (search + scrollable list + install buttons)
    -- 3. Installed (local list + remove buttons)
    --
    -- Uses SMODS UI primitives:
    --   create_text_input, create_button, create_toggle,
    --   create_option_cycle, UIBox, scrollView
end
```

### src/loader.lua (JSON Challenge Loader — Already Built)

```lua
-- Scans challenges/ directory for .json files
-- Parses each one and registers as SMODS.Challenge
-- (This is the existing challenge-loader mod, integrated)
```

### Networking: How the mod talks to the VPS

The Balatro Multiplayer mod proves that `require("socket")` (luasocket) is available in the LÖVE environment. It runs networking in a background thread via `love.thread` so the game loop never blocks.

The mod connects to the VPS on port 3001 (plain HTTP, no TLS). Nginx proxies this to the Next.js app on port 3000. The mod never needs TLS — only the web app users do.

---

## Content Payload Formats

### Challenge JSON (`type: "challenge"`)

```json
{
  "key": "glass_horde",
  "name": "Glass Horde",
  "jokers": [
    { "id": "j_glass", "eternal": false },
    { "id": "j_glass", "eternal": false },
    { "id": "j_glass", "eternal": false },
    { "id": "j_glass", "eternal": false }
  ],
  "consumeables": [
    { "id": "c_hermit" }
  ],
  "vouchers": [
    { "id": "v_seed_money" }
  ],
  "deck": {
    "type": "Challenge Deck"
  },
  "restrictions": {
    "banned_cards": [
      { "id": "v_magic_trick" }
    ],
    "banned_tags": [
      { "id": "tag_standard" }
    ],
    "banned_other": [
      { "id": "bl_plant", "type": "blind" }
    ]
  },
  "rules": {
    "custom": [],
    "modifiers": []
  }
}
```

### Future: Joker JSON (`type: "joker"`)

```json
{
  "key": "my_custom_joker",
  "name": "My Custom Joker",
  "rarity": 2,
  "cost": 6,
  "effect": {
    "type": "mult_per_suit",
    "suit": "Hearts",
    "mult": 4
  },
  "description": "Gives +4 Mult per Heart card played",
  "sprite_data": "base64_encoded_png_or_null"
}
```

### Future: Deck JSON (`type: "deck"`)

```json
{
  "key": "my_custom_deck",
  "name": "My Custom Deck",
  "cards": [
    { "suit": "Hearts", "rank": "Ace", "count": 4 },
    { "suit": "Spades", "rank": "King", "count": 4 }
  ],
  "starting_jokers": [],
  "starting_vouchers": []
}
```

---

## Web App: Builder UI Concept

```
┌────────────────────────────────────────────────────────────┐
│  🔧 Challenge Builder                      [Save] [Publish]│
│                                                            │
│  Name: [_______________________________]                   │
│  Description (optional):                                   │
│  [_______________________________________________________]│
│                                                            │
│  ── Jokers ─────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🃏 Joker (+4 Mult)     [Eternal ☐]  [× Remove]      │ │
│  │ 🃏 Glass Joker (x2)    [Eternal ☐]  [× Remove]      │ │
│  │ 🃏 Greedy Joker (+3)   [Eternal ☐]  [× Remove]      │ │
│  │                                     [+ Add Joker ▾]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ── Consumables ────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ★ Hermit ($$)         [× Remove]                     │ │
│  │                                   [+ Add Consumable] │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ── Vouchers ───────────────────────────────────────────  │
│  │ [+ Add Voucher ▾]                                      │
│                                                            │
│  ── Restrictions ───────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🚫 The Plant (Blind)  [× Remove]                     │ │
│  │ 🚫 Standard Pack      [× Remove]                     │ │
│  │              [+ Add Restriction ▾]                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ── Preview ────────────────────────────────────────────  │
│  ┌──────────────────────────────────┐                     │
│  │ {                                │                     │
│  │   "key": "glass_horde",          │   ← Live JSON      │
│  │   "name": "Glass Horde",         │     preview        │
│  │   "jokers": [...]                │                     │
│  │ }                                │                     │
│  └──────────────────────────────────┘                     │
│                                              [Copy JSON]  │
└────────────────────────────────────────────────────────────┘
```

---

## Playtest Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       PUBLISHING A CHALLENGE                    │
│                                                                 │
│  1. BUILD                                                       │
│     Web App → /build                                            │
│     → Name it, pick jokers, set restrictions                    │
│     → Click "Save Draft"                                        │
│     → Stored in PostgreSQL (status: draft)                      │
│     → Shows: "Test code: GL4SS-H0RDE   [Copy]"                 │
│                                                                 │
│  2. PLAYTEST                                                    │
│     Balatro → Config → Challenge Hub → Playtest tab             │
│     → Paste "GL4SS-H0RDE" → Click "Fetch & Play"               │
│     → Mod calls GET /api/content/GL4SS-H0RDE                    │
│     → Downloads JSON → registers as SMODS.Challenge             │
│     → Starts run immediately                                    │
│     → Full debugging info shown in-game                         │
│                                                                 │
│  3. ITERATE                                                     │
│     Made changes? → Edit in web → Save → New test code          │
│     → Paste new code in-game → Playtest again                   │
│                                                                 │
│  4. PUBLISH                                                     │
│     Happy with it? → Web App → "Publish"                        │
│     → Status: published → Visible in Hub for everyone           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       INSTALLING A CHALLENGE                    │
│                                                                 │
│  1. DISCOVER                                                    │
│     Balatro → Config → Challenge Hub → Discover tab             │
│     → Browse popular, search, filter by tags                    │
│     → Or: find on website, copy code                            │
│                                                                 │
│  2. INSTALL                                                     │
│     → Click "Install" on a challenge                            │
│     → Mod calls GET /api/content/:code                          │
│     → Saves JSON to challenges/ directory                       │
│     → Challenge appears in Installed tab                        │
│     → Available in Challenges menu                              │
│                                                                 │
│  3. REMOVE                                                      │
│     → Installed tab → Click "Remove"                            │
│     → Deletes JSON file → Challenge gone                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Build Phases

| # | Phase | Key Deliverables | Estimated Sessions |
|---|---|---|---|
| **1** | **VPS + Database** | Docker Compose running Postgres, schema migrated, tables created | 1 |
| **2** | **Next.js Scaffold + Auth** | Bun + Next.js setup, Discord OAuth, database connection, navigation | 1 |
| **3** | **API Routes** | All 6 endpoints implemented with zod validation | 1 |
| **4** | **Web App — Builder** | Visual challenge builder page, JSON preview, save draft, publish | 2 |
| **5** | **Web App — Hub** | Browse, search, filter, detail page, ratings | 1-2 |
| **6** | **Mod — API Client** | luasocket HTTP client, background thread, error handling | 1 |
| **7** | **Mod — UI + Integration** | Config tab with all 3 sections, loader integration, playtest flow | 2 |
| **8** | **Polish + Deploy** | Error handling, caching, Nginx, DNS, deploy to VPS | 1 |

**Total: ~9-11 sessions**

---

## Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Bun | Native TS, faster than Node, official Next.js support |
| Framework | Next.js App Router | Pages + API routes in one process. No Express needed. |
| Single `content` table | Yes | Extensible to jokers, decks, vouchers — just add to CHECK constraint |
| Discord OAuth | Yes | Clean OAuth2 flow, NextAuth provider, community standard |
| Mod auth | None (public only) | Mod only reads/installs. Auth only for web publishing |
| Plain HTTP for mod API | Yes (port 3001) | No TLS implementation in LÖVE. Nginx proxies to Next.js |
| No file downloads | API-driven | 100% network-based. Test codes bridge web↔game |
| Docker on VPS | Yes | Two containers: Postgres + Bun/Next.js. Reproducible. |

---

## Open Questions / TODO

- [ ] What OS is the Hostinger VPS running? (needed for Docker setup)
- [ ] Domain name for the hub? (or use VPS IP directly)
- [ ] Test code format: short alphanumeric (`GL4SS`) or human-readable (`glass-horde`)?
- [ ] Should challenge JSON keys be auto-generated from names or user-chosen?
- [ ] Mod: cache downloaded challenges locally to survive restarts without network?
- [ ] Web: rate limiting on API to prevent abuse?
- [ ] Web: admin panel for moderation (report/remove inappropriate content)?
- [ ] Discord application setup (client ID + secret from Discord Developer Portal)

## Builder Validation (TODO)

- [ ] **Name required** — prevent saving draft with empty name (show inline error)
- [ ] **Boss blind limit** — warn when too many bosses are banned per ante range (≤ X banned to guarantee at least one valid boss per ante)
- [ ] **Deck minimum** — warn if deck has very few cards (< ~20), since that may brick the run
- [ ] **Duplicate joker check** — warn when the same joker ID appears multiple times (may cause issues with some jokers)
- [ ] **Publish guard** — require at least one saved draft before publishing (already enforced via UI, add server-side too)
