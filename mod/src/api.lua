--- Challenge Hub API Client
--- Handles HTTP requests to the Challenge Hub server using luasocket.
--- Provides get_by_code() and test_connection().

return function()
  sendInfoMessage("Challenge Hub: HTTP client loaded", "Challenge Hub")
  local socket = require("socket")

  -- ============================================================
  -- CONFIGURATION
  -- ============================================================
  local API_HOST = "hub.challenge-hub.online"
  local API_USE_HTTPS = false
  -- ============================================================

  local HubAPI = {}

  --- Try socket.http first (handles chunked encoding, redirects, etc.)
  --- Falls back to ssl.https for HTTPS, then raw TCP.
  local http = nil
  if API_USE_HTTPS then
    pcall(function() http = require("ssl.https") end)
    if not http then
      sendWarnMessage("Challenge Hub: luasec not available — HTTPS requests may fail. Install luasec for HTTPS support.", "Challenge Hub")
      pcall(function() http = require("socket.http") end)
    end
  else
    pcall(function() http = require("socket.http") end)
  end

  local scheme = API_USE_HTTPS and http and "https" or "http"

  --- Perform an HTTP request.
  --- Returns (data, nil) on success, or (nil, error_message) on failure.
  function HubAPI.request(method, path)
    if http then
      -- Use the high-level HTTP library (handles chunked encoding, etc.)
      local url = scheme .. "://" .. API_HOST .. path
      local body, status_code = http.request(url)
      if status_code == 200 and body then
        local ok, data = pcall(JSON.decode, body)
        if ok and data then
          return data
        end
        return nil, "Invalid JSON response"
      end
      return nil, "Server returned HTTP " .. tostring(status_code)
    end

    -- Fallback: raw TCP (HTTP only — no TLS support for raw sockets)
    if API_USE_HTTPS then
      return nil, "Cannot connect via HTTPS without luasec. Install luasec for HTTPS support."
    end

    local client, err = socket.tcp()
    if not client then
      return nil, "socket.tcp() failed: " .. (err or "unknown")
    end

    client:settimeout(5)
    client:setoption("tcp-nodelay", true)

    local ok, connect_err = client:connect(API_HOST, 80)
    if not ok then
      client:close()
      return nil, "Connection failed: " .. (connect_err or "unknown")
    end

    local host_header = API_HOST

    local req = method .. " " .. path .. " HTTP/1.0\r\n"
      .. "Host: " .. host_header .. "\r\n"
      .. "Connection: close\r\n"
      .. "User-Agent: ChallengeHub/1.0\r\n"
      .. "Accept: application/json\r\n"
      .. "\r\n"

    client:send(req)

    -- Read response line by line (more reliable than receive("*a"))
    local status_line, recv_err = client:receive("*l")
    if not status_line then
      client:close()
      return nil, "No status line: " .. (recv_err or "unknown")
    end

    local status_code = status_line:match("HTTP/%d%.%d (%d+)")

    -- Read headers until empty line
    local content_length = 0
    while true do
      local header_line, header_err = client:receive("*l")
      if not header_line or header_line == "" then
        break
      end
      local cl = header_line:lower():match("content%-length:%s*(%d+)")
      if cl then
        content_length = tonumber(cl) or 0
      end
    end

    -- Read body (Next.js uses chunked encoding, so read line by line until nil/close)
    local body_lines = {}
    while true do
      local chunk, chunk_err = client:receive("*l")
      if not chunk then
        break
      end
      body_lines[#body_lines + 1] = chunk
    end
    client:close()

    local body = table.concat(body_lines, "\n")

    if body == "" and content_length == 0 then
      return nil, "No response body"
    end

    if status_code ~= "200" then
      local parsed = JSON.decode(body)
      if parsed and parsed.error then
        return nil, parsed.error
      end
      return nil, "Server returned HTTP " .. (status_code or "?")
    end

    local ok2, data = pcall(JSON.decode, body)
    if not ok2 or not data then
      return nil, "Invalid JSON response from server"
    end

    return data
  end

  --- Fetch a challenge (draft or published) by its test code.
  --- Returns (challenge_data, nil) or (nil, error_message).
  function HubAPI.get_by_code(code)
    local path = "/api/content/" .. code
    return HubAPI.request("GET", path)
  end

  --- Test that the server is reachable and responding.
  --- Returns (true, nil) or (false, error_message).
  function HubAPI.test_connection()
    local data, err = HubAPI.request("GET", "/api/health")
    if data and data.status == "ok" then
      return true
    end
    return false, err or "unexpected response"
  end

  -- Expose globally for use by other modules
  _G.HubAPI = HubAPI
end
