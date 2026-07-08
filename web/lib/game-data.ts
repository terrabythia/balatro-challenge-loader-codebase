import fs from "fs";
import path from "path";
import type { SpriteConfig } from "@/types";

// ---- Game data item shape (matches what extract-game-data.ts produces) ----

export interface GameItem {
  id: string;
  name: string;
  set?: string;
  effect?: string;
  pos?: { x: number; y: number };
  soul_pos?: { x: number; y: number };
}

// ---- Sprite entry (for item lists with optional detail text) ----

export interface ItemSpriteEntry {
  src: string;
  sheetWidth: number;
  sheetHeight: number;
  cellWidth: number;
  cellHeight: number;
  pos: { x: number; y: number };
  displayWidth?: number;
  overlayPos?: { x: number; y: number };
}

export interface ItemEntry {
  name: string;
  detail?: string;
  sprite?: ItemSpriteEntry;
}

// ---- Data loading ----

const DATA_DIR = path.join(process.cwd(), "public", "data");

/**
 * Load a game-data JSON file (jokers.json, consumables.json, etc.)
 * and return it as a Map keyed by item ID.
 */
export function loadLookup(filename: string): Map<string, GameItem> {
  const items: GameItem[] = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, filename), "utf-8"),
  );
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * Load a game-data JSON file and return the raw parsed array.
 */
export function loadGameData(filename: string) {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, filename), "utf-8"),
  );
}

// ---- Sprite helpers ----

/**
 * Build a sprite entry from a GameItem and its SpriteConfig.
 * Returns undefined when the item has no position data (can't render).
 */
export function spriteFor(
  item: GameItem | undefined,
  spriteConfig: SpriteConfig,
): ItemSpriteEntry | undefined {
  if (item?.pos) {
    return {
      ...spriteConfig,
      pos: item.pos,
      overlayPos: item.soul_pos,
    };
  }
  return undefined;
}

/**
 * Resolve an array of raw challenge JSON entries (jokers, consumables, or vouchers)
 * into ItemEntry objects with names and sprites from the game data lookup.
 *
 * @param rawItems - The raw JSON array from challenge data
 * @param lookup - Map from item ID to GameItem
 * @param spriteConfig - SpriteConfig for this item type
 * @param detailFn - Optional callback to produce detail text per entry (e.g. edition)
 */
export function resolveItems(
  rawItems: Array<{ id: string; edition?: string; eternal?: boolean }> | undefined,
  lookup: Map<string, GameItem>,
  spriteConfig: SpriteConfig,
  detailFn?: (entry: { id: string; edition?: string; eternal?: boolean }) => string | undefined,
): ItemEntry[] {
  if (!rawItems) return [];
  return rawItems.map((entry) => {
    const item = lookup.get(entry.id);
    return {
      name: item?.name ?? entry.id,
      detail: detailFn?.(entry),
      sprite: spriteFor(item, spriteConfig),
    };
  });
}
