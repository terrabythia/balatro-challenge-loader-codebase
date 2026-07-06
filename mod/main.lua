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

-- Test connection to Challenge Hub server
if HubAPI then
    local connected, err = HubAPI.test_connection()
    if connected then
        sendInfoMessage("Challenge Hub: Connected to server!", "Challenge Hub")
    else
        sendWarnMessage("Challenge Hub: Could not connect (" .. tostring(err) .. ")", "Challenge Hub")
    end
end
