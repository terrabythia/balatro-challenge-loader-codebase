export async function GET() {
  const results: string[] = [];

  // Test 1: raw DNS
  try {
    const r = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    results.push(`discord.com OK (status ${r.status})`);
  } catch (e: unknown) {
    if (e instanceof Error) {
      const err = e as NodeJS.ErrnoException;
      results.push(`discord.com FAILED: ${err.code} ${err.message}`);
    }
  }

  // Test 2: google
  try {
    const r = await fetch("https://google.com");
    results.push(`google.com OK (status ${r.status})`);
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    results.push(`google.com FAILED: ${err.code} ${err.message}`);
  }

  return Response.json({ results });
}
