--- Challenge Hub UI
--- "Load Hub Challenge" button on the Challenges tab, code input overlay,
--- and challenge fetch + start-run flow.

return function()
  sendInfoMessage("Challenge Hub: UI module loaded", "Challenge Hub")

  -- Captured during mod init — SMODS.current_mod is nil during UI callbacks
  local mod_path = SMODS.current_mod.path

  -- Ensure common globals exist
  if not G then G = {} end
  G.FUNCS = G.FUNCS or {}
  G.UIDEF = G.UIDEF or {}
  G.C = G.C or {}
  G.C.UI = G.C.UI or {}
  G.C.WHITE = G.C.WHITE or {255,255,255}
  G.C.RED = G.C.RED or {255,0,0}
  G.C.BLUE = G.C.BLUE or {0,122,255}
  G.C.UI.TEXT_LIGHT = G.C.UI.TEXT_LIGHT or G.C.WHITE
  G.C.UI.TEXT_INACTIVE = G.C.UI.TEXT_INACTIVE or G.C.WHITE

  G.CHALLENGE_HUB_CODE = G.CHALLENGE_HUB_CODE or ""
  G.CHALLENGE_HUB_STATUS = G.CHALLENGE_HUB_STATUS or ""
  G.CHALLENGE_HUB_STATUS_COLOUR = G.CHALLENGE_HUB_STATUS_COLOUR or G.C.WHITE

  -- ============================================================
  -- Open overlay
  -- ============================================================
  function G.FUNCS.challenge_hub_add_open(e)
    G.CHALLENGE_HUB_CODE = ""
    G.CHALLENGE_HUB_STATUS = ""

    local def = G.UIDEF.challenge_hub_add_overlay()

    -- Coerce any table-typed text fields to strings before the engine tries
    -- to measure them (getWidth crashes on tables).
    local function fix_text_fields(node)
      if type(node) ~= "table" then return end
      if node.config then
        for _, key in ipairs({"text", "prompt_text"}) do
          if type(node.config[key]) == "table" then
            local ok, joined = pcall(function() return table.concat(node.config[key], " ") end)
            if ok and type(joined) == "string" then
              node.config[key] = joined
            end
          end
        end
      end
      for _, key in ipairs({"nodes", "contents", "children"}) do
        if type(node[key]) == "table" then
          for _, child in ipairs(node[key]) do
            fix_text_fields(child)
          end
        end
      end
    end
    fix_text_fields(def)

    G.FUNCS.overlay_menu({ definition = def })
  end

  -- ============================================================
  -- Close overlay
  -- ============================================================
  function G.FUNCS.challenge_hub_add_back(e)
    G.CHALLENGE_HUB_STATUS = ""
    G.FUNCS.exit_overlay_menu()
  end

  -- ============================================================
  -- Paste from clipboard via text input simulation
  -- (same approach as base game's G.FUNCS.paste_seed)
  -- ============================================================
  function G.FUNCS.challenge_hub_paste(e)
    local text_input_e = e.UIBox:get_UIE_by_ID("text_input")
    if not text_input_e then
      G.CHALLENGE_HUB_STATUS = "Text input unavailable"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    local clip = nil
    if love and love.system and love.system.getClipboardText then
      clip = love.system.getClipboardText()
    end

    if not clip or clip == "" then
      G.CHALLENGE_HUB_STATUS = "Clipboard empty"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    local code = clip:upper():gsub("%s+", ""):gsub("-", "")

    G.CONTROLLER.text_input_hook = text_input_e.children[1].children[1]
    G.CONTROLLER.text_input_id = "text_input"

    for _ = 1, 7 do
      G.FUNCS.text_input_key({ key = "right" })
    end
    for _ = 1, 7 do
      G.FUNCS.text_input_key({ key = "backspace" })
    end

    local len = math.min(#code, 7)
    for i = 1, len do
      G.FUNCS.text_input_key({ key = code:sub(i, i) })
    end

    G.FUNCS.text_input_key({ key = "return" })
  end

  -- ============================================================
  -- Fetch challenge and start run
  -- ============================================================
  function G.FUNCS.challenge_hub_add_play(e)
    local code = G.CHALLENGE_HUB_CODE
    if not code or code == "" then
      G.CHALLENGE_HUB_STATUS = "Please enter a code"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    code = code:upper():gsub("%s+", ""):gsub("-", "")

    G.CHALLENGE_HUB_CODE = code

    if not HubAPI then
      G.CHALLENGE_HUB_STATUS = "HTTP client not loaded — check socket"
      G.CHALLENGE_HUB_STATUS_COLOUR = G.C.RED
      return
    end

    G.CHALLENGE_HUB_STATUS = "Downloading..."
    G.CHALLENGE_HUB_STATUS_COLOUR = G.C.WHITE

    -- Defer the HTTP fetch to the next frame so the UI renders the loading indicator
    G.E_MANAGER:add_event(Event({
      trigger = 'immediate',
      func = function()
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

        local challenge = register_hub_challenge(challenge_data)

        -- Cache the challenge so it survives game restarts
        local cache_dir = mod_path .. "hub_challenges/"
        SMODS.NFS.createDirectory(cache_dir)
        local cache_path = cache_dir .. code .. ".json"
        SMODS.NFS.write(cache_path, JSON.encode(data))

        G.FUNCS.start_run(e, { stake = 1, challenge = challenge })
        HubAPI.increment_plays(code)
      end
    }))
  end

  -- ============================================================
  -- Overlay UI definition
  -- ============================================================
  function G.UIDEF.challenge_hub_add_overlay()
    G.CHALLENGE_HUB_CODE = G.CHALLENGE_HUB_CODE or ""

    return create_UIBox_generic_options({
      back_func = "challenge_hub_add_back",
      back_label = "Back",
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
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.1 },
          nodes = {
            {
              n = G.UIT.T,
              config = {
                text = "Enter the 7-character code (e.g. GL4SSH0R)",
                scale = 0.35,
                colour = G.C.UI.TEXT_INACTIVE,
              },
            },
          },
        },
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.2 },
          nodes = {
            create_text_input({
              w = 4.2,
              max_length = 7,
              all_caps = true,
              prompt_text = "Code...",
              ref_table = G,
              ref_value = "CHALLENGE_HUB_CODE",
            }),
          },
        },
        {
          n = G.UIT.R,
          config = { align = "cm", padding = 0.1 },
          nodes = {
            UIBox_button({
              label = { "Paste" },
              button = "challenge_hub_paste",
              colour = G.C.BLUE,
              minw = 1.5,
              scale = 0.3,
              col = true,
            }),
          },
        },
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
