# Guest User Access

## Overview

Allow users to create draft challenges without Discord authentication.
Guests cannot publish. When a guest later logs in via Discord, their drafts
are transferred to their account.

## UX Flow

```
Login page
├── "Log in with Discord" (existing)
└── "Continue as Guest" (new)
    → Creates ephemeral guest session
    → Redirects to /my-challenges (or /build?new)

Builder (guest)
├── Warning banner: "You're logged in as a guest — challenges can't be published.
│                     Log in with Discord to keep and publish your challenges."
├── Save Draft: works normally
├── Publish: disabled, tooltip explains why

Later: guest clicks "Log in with Discord"
├── OAuth flow completes
├── All drafts with matching guest_id are claimed (author_id = discordUserId)
├── Guest session replaced with full session
├── Confirmation shown: "Your 3 draft challenges have been saved to your account!"
```

## Data Model Changes

### content table

```sql
ALTER TABLE content ADD COLUMN guest_id TEXT;
-- NULL for Discord-authored content
-- SET for guest-created content
-- Cleared when claimed by a Discord user
```

### auth / JWT

| Field | Discord session | Guest session |
|---|---|---|
| `sub` | Discord user ID | Random UUID v4 |
| `isGuest` | `false` or absent | `true` |

Same cookie (`ch_session`), same expiration (30 days).

## Implementation Plan

### Phase 1 — lib/auth.ts changes

- Export `GuestSession` type alongside existing `Session`:
  ```ts
  type Session = { userId: string; isGuest?: boolean } | null;
  ```
- New function `createGuestSession()`: generates random UUID, signs JWT with `isGuest: true`, sets cookie
- `getSession()` returns `{ userId, isGuest: true }` for guest JWTs
- `requireAuth()` accepts optional `{ allowGuest?: boolean }` — if `allowGuest: true`, guest sessions pass through; otherwise guests get 401
- New function `claimGuestContent(guestId: string, discordUserId: string)`: runs UPDATE to transfer ownership

### Phase 2 — API routes

**New: `POST /api/auth/guest`**
- Creates guest session via `createGuestSession()`
- Returns `{ userId, isGuest: true }`

**Modified: `POST /api/content`**
- If guest: stores `guest_id = session.userId`, `author_id = NULL`
- If Discord user: stores `author_id = session.userId` (unchanged)

**Modified: `PUT /api/content/:code`**
- If guest: check `guest_id` matches instead of `author_id`
- If Discord user: unchanged

**Modified: `POST /api/content/:code/publish`**
- If guest: return 403 `{ error: "Log in with Discord to publish challenges" }`

**Modified: `GET /api/auth/callback`**
- After Discord login, before redirect:
  - If previous session was guest (check cookie for guest JWT): call `claimGuestContent(guestId, discordUserId)`
  - Destroy guest session, create Discord session
  - Append `?claimed=N` to redirect URL so UI can show confirmation

### Phase 3 — Frontend

**`/login` page**
- Add "Continue as Guest" button → calls `POST /api/auth/guest` → redirects to `/my-challenges`

**`components/nav.tsx`**
- Read `isGuest` from session
- If guest: show "Guest" label instead of username, add "Log in →" link

**`/my-challenges` page**
- No changes needed — works for both guest and Discord users
- Guest sees their drafts (filtered by `guest_id`)

**`/build` page**
- Read `isGuest` from session
- If guest: show warning banner (amber), disable Publish button with tooltip
- "Save Draft" works normally

**Home redirect after login**
- Read `?claimed=N` query param
- If present: show toast/notification: "N draft challenges saved to your account!"

### Phase 4 — Database migration

```sql
ALTER TABLE content ADD COLUMN guest_id TEXT;

-- Index for claiming lookups
CREATE INDEX idx_content_guest_id ON content(guest_id) WHERE guest_id IS NOT NULL;
```

## Files to Touch

| File | Change |
|---|---|
| `lib/auth.ts` | `createGuestSession()`, `claimGuestContent()`, updated types |
| `app/api/auth/guest/route.ts` | New — guest login endpoint |
| `app/api/auth/callback/route.ts` | Claim guest content after Discord login |
| `app/api/content/route.ts` | Store `guest_id` for guests |
| `app/api/content/[code]/route.ts` | Allow guest access via `guest_id` |
| `app/api/content/[code]/publish/route.ts` | Reject guests |
| `app/login/page.tsx` | Add "Continue as Guest" button |
| `components/nav.tsx` | Show guest state |
| `app/(main)/build/view.tsx` | Guest warning + disabled publish |
| `app/(main)/page.tsx` | Show `?claimed=N` confirmation |
| `supabase/migrations/` | New migration for `guest_id` column |

## Edge Cases

- **Guest cookie expires after 30 days** → drafts are orphaned. Acceptable (same as Discord session expiry). User would need to re-authenticate as same guest to claim them, which is impossible. Could add a cron to delete orphaned guest content after 60 days.
- **Guest logs in as Discord, has existing Discord drafts** → `claimGuestContent` only claims content where `guest_id = oldGuestId AND author_id IS NULL`. Existing Discord content is untouched.
- **Guest creates a draft, then another guest (different browser) creates a draft** → Different guest_ids, no collision. Each guest's drafts are separate and independently claimable.
