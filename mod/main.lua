--- Challenge Loader
--- Scans the challenges/ directory for JSON files and registers each as a SMODS.Challenge.
--- Includes HTTP client (src/api.lua) for fetching challenges from the Challenge Hub.
--- No custom items — all challenges use vanilla jokers, consumables, vouchers, etc.

local mod = SMODS.current_mod

-- Load HTTP API client
-- SMODS.load_file returns a compiled chunk; chunk() returns the module's init function
local ok, api_chunk = pcall(SMODS.load_file, "src/api.lua")
if ok and api_chunk then
    local ok_init, api_init = pcall(api_chunk)
    if ok_init and api_init then
        api_init()
    else
        sendWarnMessage("Challenge Hub: HTTP client init failed: " .. tostring(api_init), "Challenge Hub")
    end
else
    sendWarnMessage("Challenge Hub: Failed to load HTTP client: " .. tostring(api_chunk), "Challenge Hub")
end

-- Load UI module (adds "Load Hub Challenge" button to Challenges tab)
local ok2, ui_chunk = pcall(SMODS.load_file, "src/ui.lua")
if ok2 and ui_chunk then
    local ok_init2, ui_init = pcall(ui_chunk)
    if ok_init2 and ui_init then
        ui_init()
    else
        sendWarnMessage("Challenge Hub: UI init failed: " .. tostring(ui_init), "Challenge Hub")
    end
else
    sendWarnMessage("Challenge Hub: Failed to load UI: " .. tostring(ui_chunk), "Challenge Hub")
end

-- Shared function to register a hub challenge into SMODS.Challenges.
-- Used by both the cache loader and the live Play button flow.
_G.register_hub_challenge = function(challenge_data)
    local challenge = {
        id = challenge_data.key or "hub_challenge",
        name = challenge_data.name or challenge_data.key or "Hub Challenge",
        jokers = challenge_data.jokers or {},
        consumeables = challenge_data.consumeables or {},
        vouchers = challenge_data.vouchers or {},
        deck = challenge_data.deck or { type = "Challenge Deck" },
        restrictions = challenge_data.restrictions or {},
        rules = challenge_data.rules or {},
    }
    local proxy = { id = challenge.id }
    setmetatable(proxy, { __index = challenge })
    proxy.calculate = function(self, context) end
    SMODS.Challenges[challenge.id] = proxy
    return challenge
end

-- Load cached hub challenges so they survive game restarts.
-- Without this, re-entering a saved hub-challenge run crashes because
-- SMODS.Challenges[id] is nil (only lived in memory from the Play flow).
local function load_cached_challenges()
    local hub_dir = mod.path .. "hub_challenges/"
    local ok, files = pcall(SMODS.NFS.getDirectoryItems, hub_dir)
    if not ok or not files or #files == 0 then
        return
    end

    for _, filename in ipairs(files) do
        if not filename:match("%.json$") then
            goto continue
        end

        local file_path = hub_dir .. filename
        local ok2, raw = pcall(SMODS.NFS.read, file_path)
        if not ok2 or not raw then
            goto continue
        end

        local ok3, data = pcall(JSON.decode, raw)
        if not ok3 or not data or not data.json_data then
            goto continue
        end

        register_hub_challenge(data.json_data)

        ::continue::
    end
end

load_cached_challenges()

-- Test connection to Challenge Hub server
if HubAPI then
    local connected, err = HubAPI.test_connection()
    if connected then
        sendInfoMessage("Challenge Hub: Connected to server!", "Challenge Hub")
    else
        sendWarnMessage("Challenge Hub: Could not connect (" .. tostring(err) .. ")", "Challenge Hub")
    end
end
