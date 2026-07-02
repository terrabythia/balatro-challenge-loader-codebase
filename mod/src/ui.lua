--- Challenge Hub UI
--- Adds a "Load Hub Challenge" button to the Challenges tab and handles
--- the text input flow for entering challenge codes. On "Play", fetches
--- the challenge and starts a run immediately.

return function()
  sendInfoMessage("Challenge Hub: UI module loaded", "Challenge Hub")

  -- ============================================================
  -- State
  -- ============================================================
  -- Ensure common global tables exist to avoid runtime errors when mods
  -- are loaded early or the game's globals haven't been fully initialized.
  if not G then G = {} end
  G.FUNCS = G.FUNCS or {}
  G.UIDEF = G.UIDEF or {}
  G.C = G.C or {}
  G.C.UI = G.C.UI or {}
  -- Provide safe fallback colours if the game's colour constants are missing
  G.C.WHITE = G.C.WHITE or {255,255,255}
  G.C.RED = G.C.RED or {255,0,0}
  G.C.BLUE = G.C.BLUE or {0,122,255}
  G.C.UI.TEXT_LIGHT = G.C.UI.TEXT_LIGHT or G.C.WHITE
  G.C.UI.TEXT_INACTIVE = G.C.UI.TEXT_INACTIVE or G.C.WHITE

  G.CHALLENGE_HUB_CODE = G.CHALLENGE_HUB_CODE or ""
  G.CHALLENGE_HUB_STATUS = G.CHALLENGE_HUB_STATUS or ""
  G.CHALLENGE_HUB_STATUS_COLOUR = G.CHALLENGE_HUB_STATUS_COLOUR or G.C.WHITE

  -- ============================================================
  -- Callback: open the "Load Hub Challenge" text input screen
  -- ============================================================
  function G.FUNCS.challenge_hub_add_open(e)
    G.CHALLENGE_HUB_CODE = ""
    G.CHALLENGE_HUB_STATUS = ""
    -- Debug: confirm callback is invoked
    sendInfoMessage("Challenge Hub: Opening overlay", "Challenge Hub")
    -- Push a new overlay menu on top of the challenges screen,
    -- just like multiplayer does for "create lobby" / "join lobby".
    local def = G.UIDEF.challenge_hub_add_overlay()
    -- Inspect the returned UI definition for non-string text fields that may crash getWidth.
    local function scan_node(node, path)
      if type(node) ~= 'table' then return end
      local path = path or "root"
      if node.config and type(node.config) == "table" then
        for k, v in pairs(node.config) do
          if k == "text" or k == "prompt_text" or k == "label" or k == "ref_value" or k == "ref_table" then
            local t = type(v)
            sendInfoMessage(("Challenge Hub UI inspect: %s.config.%s => %s"):format(path, k, t), "Challenge Hub")
            if k == "ref_table" and node.config.ref_value and type(node.config.ref_value) == "string" then
              local ok, val = pcall(function() return v[node.config.ref_value] end)
              if ok then
                sendInfoMessage(("Challenge Hub UI inspect: %s.ref_value '%s' => %s"):format(path, node.config.ref_value, type(val)), "Challenge Hub")
              end
            end
            if (k == "text" or k == "prompt_text") and type(v) == "table" then
              -- Attempt to coerce simple text tables to a string to avoid engine error.
              local ok, joined = pcall(function() return table.concat(v, " ") end)
              if ok and type(joined) == "string" then
                sendInfoMessage(("Challenge Hub UI: coerced %s at %s to string"):format(k, path), "Challenge Hub")
                node.config[k] = joined
              end
            end
          end
        end
      end
      -- Recurse into known child arrays
      for _, key in ipairs({"nodes", "contents", "children"}) do
        if node[key] and type(node[key]) == "table" then
          for i, child in ipairs(node[key]) do
            scan_node(child, path .. "." .. key .. "[" .. tostring(i) .. "]")
          end
        end
      end
    end
    scan_node(def)
    G.FUNCS.overlay_menu({ definition = def })
  end

  -- ============================================================
  -- Callback: close overlay and return to challenges tab
  -- ============================================================
  function G.FUNCS.challenge_hub_add_back(e)
    G.CHALLENGE_HUB_STATUS = ""
    G.FUNCS.exit_overlay_menu()
  end

  -- ============================================================
  -- Callback: fetch challenge by code and start run immediately
  -- ============================================================
  function G.FUNCS.challenge_hub_add_play(e)
    -- Debug: indicate the Play callback was invoked
    sendInfoMessage("Challenge Hub: Play pressed", "Challenge Hub")
    local code = G.CHALLENGE_HUB_CODE
    if not code or code == "" then
      G.CHALLENGE_HUB_STATUS = "Please enter a code"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    -- Normalize code: uppercase, remove whitespace
    code = code:upper():gsub("%s+", "")

    -- Auto-insert dash if missing (e.g. "GL4SSH0RDE" -> "GL4SS-H0RDE")
    if #code == 10 and not code:find("-") then
      code = code:sub(1, 5) .. "-" .. code:sub(6, 10)
    end

    G.CHALLENGE_HUB_CODE = code
    G.CHALLENGE_HUB_STATUS = "Downloading..."
    G.CHALLENGE_HUB_STATUS_COLOUR = G.C.WHITE

    -- Fetch from API
    local data, err = HubAPI.get_by_code(code)

    if not data then
      G.CHALLENGE_HUB_STATUS = err or "Failed to fetch challenge"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    local challenge_data = data.json_data
    if not challenge_data then
      G.CHALLENGE_HUB_STATUS = "Invalid challenge data from server"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    -- Build challenge table for direct play (not persistent)
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

    -- Start the run immediately at stake 1
    G.FUNCS.start_run(e, { stake = 1, challenge = challenge })

    sendInfoMessage(
      "Challenge Hub: Playing '" .. (challenge_data.name or code) .. "'",
      "Challenge Hub"
    )
  end

  -- ============================================================
  -- UI: overlay text input screen for challenge code
  -- ============================================================
  function G.UIDEF.challenge_hub_add_overlay()
    G.CHALLENGE_HUB_CODE = G.CHALLENGE_HUB_CODE or ""

    -- Use create_UIBox_generic_options so we get a proper overlay with
    -- a built-in back button, matching multiplayer's join_lobby pattern.
    return create_UIBox_generic_options({
      back_func = "challenge_hub_add_back",
      back_label = { "Back" },
      contents = {
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.2 },
          nodes = {
            {
              n = G.UIT.T,
              config = {
                text = "Load Hub Challenge",
                scale = 0.6,
                colour = G.C.UI.TEXT_LIGHT,
                shadow = true,
              },
            },
          },
        },
        -- Code format hint
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.1 },
          nodes = {
            {
              n = G.UIT.T,
              config = {
                text = "Enter the 10-character code (e.g. GL4SS-H0RDE)",
                scale = 0.35,
                colour = G.C.UI.TEXT_INACTIVE,
              },
            },
          },
        },
        -- Text input
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.2 },
          nodes = {
            create_text_input({
              w = 5,
              max_length = 11,
              all_caps = true,
              prompt_text = "Code...",
              ref_table = G,
              ref_value = "CHALLENGE_HUB_CODE",
            }),
          },
        },
        -- Status message
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.1, minh = 0.5 },
          nodes = {
            {
              n = G.UIT.T,
              config = {
                ref_table = G,
                ref_value = "CHALLENGE_HUB_STATUS",
                scale = 0.35,
                colour = G.CHALLENGE_HUB_STATUS_COLOUR,
                shadow = true,
              },
            },
          },
        },
        -- Play button
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.3 },
          nodes = {
            UIBox_button({
              label = { "Play" },
              button = "challenge_hub_add_play",
              colour = G.C.BLUE,
              minw = 3,
              scale = 0.45,
            }),
          },
        },
      },
    })
  end
end
