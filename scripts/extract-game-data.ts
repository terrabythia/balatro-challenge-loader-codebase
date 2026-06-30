/**
 * Extracts Balatro game data (jokers, consumables, vouchers, blinds, tags)
 * from the game.lua file inside Balatro.love.
 *
 * Usage: bun run scripts/extract-game-data.ts
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

const BALATRO_APP =
  "/Users/sanderbruggeman/Library/Application Support/Steam/steamapps/common/Balatro/Balatro.app";
const LOVE_FILE = join(BALATRO_APP, "Contents/Resources/Balatro.love");
const TMP_DIR = "/tmp/balatro_extract";

// ---- Step 1: Extract game.lua from Balatro.love ----
if (!existsSync(join(TMP_DIR, "game.lua"))) {
  console.log("Extracting game.lua from Balatro.love...");
  execSync(
    `mkdir -p "${TMP_DIR}" && unzip -o "${LOVE_FILE}" game.lua -d "${TMP_DIR}"`,
    { stdio: "pipe" }
  );
}

const raw = readFileSync(join(TMP_DIR, "game.lua"), "utf-8");

// ---- Step 2: Parse a single key=value pair from Lua table body ----
// Returns [key, rawValueString] or null
function nextPair(
  body: string,
  startAt: number
): { key: string; rawValue: string; nextAt: number } | null {
  let i = startAt;
  let depth = 0;

  // Skip whitespace
  while (i < body.length && body[i] === " ") i++;
  if (i >= body.length) return null;

  // Read key
  let key = "";
  while (i < body.length && body[i] !== "=" && body[i] !== " ") {
    key += body[i];
    i++;
  }
  // Skip whitespace and =
  while (i < body.length && (body[i] === " " || body[i] === "=")) i++;

  // Read value (handle nested tables and strings)
  let rawValue = "";
  let inString: string | null = null;

  while (i < body.length) {
    const ch = body[i];

    if (inString) {
      rawValue += ch;
      if (ch === inString && body[i - 1] !== "\\") {
        inString = null;
      }
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      rawValue += ch;
      i++;
      continue;
    }

    if (ch === "{" || ch === "[") {
      depth++;
      rawValue += ch;
      i++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      depth--;
      if (depth < 0) {
        i++;
        break;
      }
      rawValue += ch;
      i++;
      continue;
    }

    if (ch === "," && depth === 0) {
      i++; // skip comma
      break;
    }

    rawValue += ch;
    i++;
  }

  return { key: key.trim(), rawValue: rawValue.trim(), nextAt: i };
}

// Parse a simple Lua value from raw string
function parseRaw(raw: string): unknown {
  raw = raw.trim();

  // Boolean / nil
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "nil" || raw === "") return null;

  // Number
  if (/^-?\d+(\.\d+)?$/.test(raw)) return parseFloat(raw);

  // Quoted string
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  // Nested table {x=0,y=0}
  if (raw.startsWith("{") && raw.endsWith("}")) {
    const obj: Record<string, unknown> = {};
    let pos = 1; // skip opening {
    while (true) {
      const pair = nextPair(raw, pos);
      if (!pair) break;
      obj[pair.key] = parseRaw(pair.rawValue);
      pos = pair.nextAt;
      if (pos >= raw.length - 1) break;
    }
    return obj;
  }

  return raw;
}

// Parse a full line like: `j_joker = {name = "Joker", pos = {x=0,y=0}, ...}`
function parseEntry(
  line: string
): { key: string; data: Record<string, unknown> } | null {
  const match = line.trim().match(/^(\w+)\s*=\s*\{(.+)\},?\s*$/);
  if (!match) return null;

  const key = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};

  let pos = 0;
  while (true) {
    const pair = nextPair(body, pos);
    if (!pair) break;
    data[pair.key] = parseRaw(pair.rawValue);
    pos = pair.nextAt;
  }

  return { key, data };
}

// ---- Step 3: Extract all entries ----
const lines = raw.split("\n");
const jokers: Record<string, unknown>[] = [];
const consumables: Record<string, unknown>[] = [];
const vouchers: Record<string, unknown>[] = [];
const blinds: Record<string, unknown>[] = [];

for (const line of lines) {
  const entry = parseEntry(line);
  if (!entry) continue;

  const { key, data } = entry;

  // Jokers
  if (
    key.startsWith("j_") &&
    data.set === "Joker" &&
    data.name &&
    data.pos
  ) {
    jokers.push({ id: key, ...data });
  }

  // Tarot, Planet, Spectral
  if (
    key.startsWith("c_") &&
    (data.set === "Tarot" || data.set === "Planet" || data.set === "Spectral") &&
    data.name &&
    data.pos
  ) {
    consumables.push({ id: key, ...data });
  }

  // Vouchers
  if (key.startsWith("v_") && data.name && data.pos) {
    vouchers.push({ id: key, ...data });
  }

  // Blinds
  if (key.startsWith("bl_") && data.name && data.pos) {
    blinds.push({ id: key, ...data });
  }
}

// ---- Step 4: Extract sprite atlases ----
const spriteDir = join(import.meta.dir, "..", "web", "public", "sprites");
execSync(`mkdir -p "${spriteDir}"`);

const atlases = [
  "resources/textures/2x/Jokers.png",
  "resources/textures/2x/Tarots.png",
  "resources/textures/2x/Vouchers.png",
  "resources/textures/2x/BlindChips.png",
  "resources/textures/2x/boosters.png",
];

for (const atlas of atlases) {
  const name = atlas.split("/").pop()!;
  console.log(`Extracting ${name}...`);
  execSync(
    `unzip -o "${LOVE_FILE}" "${atlas}" -d "${TMP_DIR}"`,
    { stdio: "pipe" }
  );
  execSync(`cp "${TMP_DIR}/${atlas}" "${spriteDir}/${name}"`);
}

console.log(`Sprites extracted to: ${spriteDir}`);

// ---- Step 5: Write JSON data ----
const outDir = join(import.meta.dir, "..", "web", "public", "data");
execSync(`mkdir -p "${outDir}"`);

writeFileSync(join(outDir, "jokers.json"), JSON.stringify(jokers, null, 2));
writeFileSync(
  join(outDir, "consumables.json"),
  JSON.stringify(consumables, null, 2)
);
writeFileSync(
  join(outDir, "vouchers.json"),
  JSON.stringify(vouchers, null, 2)
);
writeFileSync(join(outDir, "blinds.json"), JSON.stringify(blinds, null, 2));

console.log(`\nExtracted ${jokers.length} jokers`);
console.log(`Extracted ${consumables.length} consumables`);
console.log(`Extracted ${vouchers.length} vouchers`);
console.log(`Extracted ${blinds.length} blinds`);
console.log(`Data: ${outDir}`);
console.log(`Sprites: ${spriteDir}`);
