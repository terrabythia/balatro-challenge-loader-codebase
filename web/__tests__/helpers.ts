// Mock helper — create a minimal NextRequest-like object for API route testing
export function mockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
}): Request {
  const url = new URL(options.url || "http://localhost:3000/api/content");
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const init: RequestInit = { method: options.method || "GET" };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    init.headers = { "content-type": "application/json" };
  }

  return new Request(url.toString(), init);
}
