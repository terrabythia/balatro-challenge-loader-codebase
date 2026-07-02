import { randomBytes } from "crypto";

// 30-char alphabet (no I, O, 0, 1 — ambiguous in fonts).
// 7 chars = 30^7 ≈ 21.9B combinations — collision-safe for community-scale usage.
export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(7);
  let code = "";

  for (let i = 0; i < 7; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}
