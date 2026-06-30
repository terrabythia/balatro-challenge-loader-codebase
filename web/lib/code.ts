import { randomBytes } from "crypto";

// Generates short test codes like "GL4SS-H0RDE"
export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1 (ambiguous)
  const bytes = randomBytes(6);
  const parts: string[] = [];

  for (let i = 0; i < 2; i++) {
    let part = "";
    for (let j = 0; j < 5; j++) {
      part += chars[bytes[i * 5 + j] % chars.length];
    }
    parts.push(part);
  }

  return parts.join("-");
}
