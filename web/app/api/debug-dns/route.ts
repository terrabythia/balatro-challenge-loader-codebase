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
  } catch (e: any) {
    results.push(`discord.com FAILED: ${e.code} ${e.message}`);
  }

  // Test 2: google
  try {
    const r = await fetch("https://google.com");
    results.push(`google.com OK (status ${r.status})`);
  } catch (e: any) {
    results.push(`google.com FAILED: ${e.code} ${e.message}`);
  }

  return Response.json({ results });
}
