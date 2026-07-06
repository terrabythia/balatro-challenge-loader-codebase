# Challenge Loader — Agent Notes

## Branching

- **Never push directly to `main` or `development`.**
- Work on feature branches. If no feature branch exists for the current task, create one.
- When a task should have its own feature branch, create it and remind me to merge
  the current feature branch first.
- Push to the feature branch, not to `main`/`development`.

## Mod version

When any file in `mod/` changes, bump the version before committing:

```bash
bash scripts/bump-mod-version.sh
```

The version lives in `mod/mod.json`.

## Key files

| File | Purpose |
|---|---|
| `mod/main.lua` | Entry point — loads API + UI, registers local JSON challenges |
| `mod/src/api.lua` | HTTP client — `HubAPI.get_by_code()`, `HubAPI.send_result()` |
| `mod/src/ui.lua` | UI — "Load Hub Challenge" button, overlay, paste, play, win/loss hooks |
| `mod/lovely/challenge_add.toml` | Patch that injects the button into the Challenges tab |
| `mod/mod.json` | Mod metadata + version |

## Gotchas

- **Text input display**: `create_text_input` copies `ref_table[ref_value]` into an internal letters table at construction time. Changing the ref value externally does NOT update the UI. Use `G.FUNCS.text_input_key` to modify text input contents.
- **SMODS.Challenges**: Custom hub challenges must be registered in `SMODS.Challenges[id]` with a no-op `calculate` method (use a metatable proxy to avoid function-in-table serialization issues during save).
- **Edition double-prefix**: The web builder strips `e_` from edition values before storing JSON. `add_joker` wraps editions as `{[edition] = true}`, and Steamodded's `set_edition` adds another `e_` prefix. The bare edition name (e.g. `"negative"`) is correct.
