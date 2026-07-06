# Development Environment

Two separate environments, isolated from production.

## Architecture

```
main branch     → balatro-challenge-hub      (production Supabase project)
development     → balatro-challenge-hub-dev  (separate Supabase project)
```

## Setup Steps

### 1. Create a second Supabase project

- Go to supabase.com → New project → name: `challenge-hub-dev`
- Copy the connection string (DB password is separate from production)
- Copy the publishable key and URL
- Run migrations: `supabase db push` (after linking)

### 2. Create the dev Fly.io app

```bash
cd challenge-loader-codebase
git checkout development

# Create dev fly.toml (different app name)
# ... or just use --app flag with fly commands
fly apps create balatro-challenge-hub-dev
```

### 3. Set Fly.io secrets for dev

```bash
fly secrets set \
  --app balatro-challenge-hub-dev \
  DATABASE_URL="postgresql://postgres:DEV_DB_PASS@db.DEV_PROJECT_REF.supabase.co:5432/postgres" \
  BASE_URL="https://balatro-challenge-hub-dev.fly.dev" \
  DISCORD_CLIENT_ID="..." \
  DISCORD_CLIENT_SECRET="..." \
  JWT_SECRET="$(openssl rand -hex 32)" \
  NEXT_PUBLIC_SUPABASE_URL="https://DEV_PROJECT_REF.supabase.co" \
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

### 4. Create a dev Discord app (optional but recommended)

- Go to Discord Developer Portal → New Application → "Challenge Hub Dev"
- Copy client ID and secret
- Add redirect URI: `https://balatro-challenge-hub-dev.fly.dev/api/auth/callback`

### 5. Fly.io config for dev

Create `fly.dev.toml` (or modify CI to use `--app` flag):

```toml
app = "balatro-challenge-hub-dev"
primary_region = "ams"

[build]
  dockerfile = "Dockerfile"

  [build.args]
    NEXT_PUBLIC_SUPABASE_URL = "https://DEV_PROJECT_REF.supabase.co"
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_..."

[env]
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = false
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
```

### 6. GitHub Actions

Update `.github/workflows/deploy.yml` to handle both branches:

```yaml
name: Deploy

on:
  push:
    branches: [main, development]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref_name == 'main' && 'Production' || 'Development' }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Push Supabase migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets[github.ref_name == 'main' && 'SUPABASE_DB_PASSWORD' || 'SUPABASE_DB_PASSWORD_DEV'] }}
          SUPABASE_PROJECT_ID: ${{ secrets[github.ref_name == 'main' && 'SUPABASE_PROJECT_ID' || 'SUPABASE_PROJECT_ID_DEV'] }}
        run: |
          supabase link --project-ref "$SUPABASE_PROJECT_ID"
          supabase db push --password "$SUPABASE_DB_PASSWORD"

      - uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: |
          if [ "${{ github.ref_name }}" = "development" ]; then
            flyctl deploy --app balatro-challenge-hub-dev --remote-only
          else
            flyctl deploy --remote-only
          fi
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

(This needs GitHub environment "Development" with its own secrets.)

### 7. GitHub Secrets

Add to Development environment:

| Secret | Value |
|---|---|
| `SUPABASE_DB_PASSWORD` | Dev Supabase DB password |
| `SUPABASE_PROJECT_ID` | Dev Supabase project ref |
| `FLY_API_TOKEN` | Same token (accesses all apps in org) |
| `SUPABASE_ACCESS_TOKEN` | Same token |

### 8. Local dev

Local `.env` already points to local Supabase. No changes needed. Run `supabase start` for local DB, `bun run dev` for the Next.js app.

## Workflow

```
git checkout development
# ... make changes ...
git push origin development
# → deploys to balatro-challenge-hub-dev.fly.dev

git checkout main
git merge development
git push origin main
# → deploys to hub.challenge-hub.online
```
