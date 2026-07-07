# Challenge Loader Codebase — Agent Conventions

## PR / Merge Request workflow

- **Always create a feature branch** before making changes for a PR. Never commit directly to `development`.
- **Target `development`** as the base branch for all PRs. Never target `main` directly.
- **Branch naming**: use kebab-case, descriptive (e.g. `remove-unreferenced-boosters`, `fix-auth-callback`).
- **PR titles and descriptions** must be in English.
- Use `gh pr create` (GitHub CLI) to create PRs — not the web UI.
