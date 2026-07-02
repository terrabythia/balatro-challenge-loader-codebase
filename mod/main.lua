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

local function load_challenges()
    local challenges_dir = mod.path .. "challenges/"
    local files = SMODS.NFS.getDirectoryItems(challenges_dir)

    if not files or #files == 0 then
        sendInfoMessage("Challenge Loader: No files found in challenges/", "Challenge Loader")
        return
    end

    for _, filename in ipairs(files) do
        if not filename:match("%.json$") then
            goto continue
        end

        local file_path = challenges_dir .. filename
        local ok, raw = pcall(SMODS.NFS.read, file_path)

        if not ok or not raw then
            sendWarnMessage(
                ("Challenge Loader: Failed to read %s"):format(filename),
                "Challenge Loader"
            )
            goto continue
        end

        local ok2, data = pcall(JSON.decode, raw)

        if not ok2 or not data then
            sendWarnMessage(
                ("Challenge Loader: Failed to parse JSON in %s"):format(filename),
                "Challenge Loader"
            )
            goto continue
        end

        if not data.key then
            sendWarnMessage(
                ("Challenge Loader: Skipping %s — missing 'key' field"):format(filename),
                "Challenge Loader"
            )
            goto continue
        end

        -- Build the challenge from JSON data
        local challenge = {
            key = data.key,
            loc_txt = {
                name = data.name or data.key,
            },
            jokers = data.jokers or {},
            consumeables = data.consumeables or {},
            vouchers = data.vouchers or {},
            deck = data.deck or { type = "Challenge Deck" },
            restrictions = data.restrictions or {},
            rules = data.rules or {},
        }

        SMODS.Challenge(challenge)

        sendInfoMessage(
            ("Challenge Loader: Registered challenge '%s' from %s"):format(data.name or data.key, filename),
            "Challenge Loader"
        )

        ::continue::
    end
end

load_challenges()

-- Test connection to Challenge Hub server
if HubAPI then
  local connected, err = HubAPI.test_connection()
  if connected then
    sendInfoMessage("Challenge Hub: Connected to server!", "Challenge Hub")
  else
    sendWarnMessage("Challenge Hub: Could not connect (" .. tostring(err) .. ")", "Challenge Hub")
  end
end
