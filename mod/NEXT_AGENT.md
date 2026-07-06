NEXT AGENT NOTES — Challenge Loader

⚠️  When any file in mod/ changes, bump the version:
   bash scripts/bump-mod-version.sh
   The version lives in mod/mod.json. Commit the change separately.

---

Location: challenge-loader/
Created: 2026-07-02 by assistant
Updated: 2026-07-02 — paste button, code format, crash fixes all resolved

Summary — current status (2026-07-02, end of session)

- ✅ "Load Hub Challenge" button opens overlay. 404 works for unknown codes.
- ✅ Paste button works (reads clipboard, simulates typing via G.FUNCS.text_input_key).
- ✅ Valid code → challenge loads and runs without crashing.
- ✅ Codes are 7-char alphanumeric (no dash). 30-char alphabet (no I/O/0/1). 21.9B combos.
- ✅ Web API (`web/lib/code.ts`) generates 7-char codes; POST retries on collision (postgres 23505).

Files modified this session

- mod/src/ui.lua — main file. Paste impl, code format changes, crash fixes.
- web/lib/code.ts — 7-char alphanumeric code generator (was 5+5 with dash).

Changes made (cumulative, don't re-apply)

1. Defensive globals (G, G.FUNCS, G.UIDEF, G.C, colours) — early initializers.
2. UI overlay scanner — inspects text fields for table types, coerces when safe.
3. Paste button — standalone row below text input, uses G.FUNCS.text_input_key to simulate typing (matches base game's G.FUNCS.paste_seed pattern).
4. Code format: 7 chars, no dash. max_length = 7. Hint text updated. Both play and paste callbacks strip dashes/whitespace on normalize.
5. Crash #1 fix — SMODS.Challenges[G.GAME.challenge] was nil.
   - Root: Steamodded's get_card_areas does SMODS.Challenges[G.GAME.challenge].id during card scoring setup. Custom hub challenges weren't registered.
   - Fix: SMODS.Challenges[challenge.id] = proxy (metatable proxy with no-op calculate method).
6. Crash #2 fix — Channel:push rejected function in challenge table.
   - Root: LÖVE Channel:push can't serialize functions. Putting calculate() on the challenge table broke auto-save serialization.
   - Fix: calculate lives on a proxy table, not on the challenge table passed to start_run. The proxy delegates field access to the real challenge table via __index.

How it works (paste flow)

1. User clicks Paste → G.FUNCS.challenge_hub_paste(e) fires.
2. Finds text input UIE via e.UIBox:get_UIE_by_ID('text_input').
3. Reads love.system.getClipboardText(), normalizes (upper, strip whitespace/dashes).
4. Sets G.CONTROLLER.text_input_hook and text_input_id.
5. Clears existing input: move cursor right 7x, backspace 7x.
6. Types each char via G.FUNCS.text_input_key({key = c}), then 'return' to release.
7. No status message shown (user requested removal).

How it works (challenge start)

1. User clicks Play → fetches challenge from API via HubAPI.get_by_code(code).
2. Builds plain challenge table (id, name, jokers, consumeables, vouchers, deck, restrictions, rules — NO functions).
3. Creates proxy table with calculate() method, registers in SMODS.Challenges[challenge.id].
4. Calls G.FUNCS.start_run(e, { stake = 1, challenge = challenge }) with the clean table.

Web changes

- web/lib/code.ts — generateCode() now returns 7-char string (was "XXXXX-XXXXX").
- web/app/api/content/route.ts — POST handler retries up to 5x on unique-violation (23505). Other errors propagate immediately.

Files worth inspecting

- challenge-loader-codebase/mod/src/ui.lua — all UI + callbacks
- challenge-loader-codebase/mod/main.lua
- challenge-loader-codebase/mod/src/api.lua
- challenge-loader-codebase/mod/lovely/challenge_add.toml — patch that adds "Load Hub Challenge" button
- challenge-loader-codebase/web/lib/code.ts — code generation
- challenge-loader-codebase/web/app/api/content/route.ts — CRUD API

Environment

- Balatro: 1.0.1o-FULL
- Steamodded: 1.0.0~BETA-1620a-STEAMODDED
- LÖVE: 11.5.0
- Lovely: 0.9.0
- Platform: macOS
- Loaded mods: Multiplayer 0.4.3, Challenge Loader 1.0.0

Known quirks / gotchas

- create_text_input initializes an internal letters table from the ref_table value at construction time. Changing the ref_table value externally does NOT update the UI display. Always use G.FUNCS.text_input_key to modify text input contents.
- SMODS.eval_individual calls object:calculate(context) on scoring targets (including challenges). Any challenge registered in SMODS.Challenges MUST have a calculate method.
- LÖVE Channel:push rejects tables containing functions. Keep calculate (and any other methods) on a proxy, not on the game-state challenge table.
- The game sets G.GAME.challenge = args.challenge.id (string key). Steamodded then looks up SMODS.Challenges[thatKey] during scoring. Registration is mandatory for custom challenges.
