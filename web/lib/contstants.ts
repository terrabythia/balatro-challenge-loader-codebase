import { inverseObject } from "@/utils/objects/inverseObject";
import type { SpriteConfig } from "@/types";

export const SUIT_NAMES = ["Hearts", "Clubs", "Diamonds", "Spades"];

export const RANK_NAMES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export const SUIT_SHORT_CODE: Record<string, string> = {
  Hearts: "H",
  Clubs: "C",
  Diamonds: "D",
  Spades: "S",
};

export const RANK_SHORT_CODE: Record<string, string> = {
  A: "A",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "T",
  J: "J",
  Q: "Q",
  K: "K",
};

export const SUIT_SHORT_TO_FULL: Record<string, string> =
  inverseObject(SUIT_SHORT_CODE);

export const RANK_SHORT_TO_FULL: Record<string, string> =
  inverseObject(RANK_SHORT_CODE);

export const JOKER_SPRITE: SpriteConfig = {
  src: "/sprites/Jokers.png",
  sheetWidth: 710,
  sheetHeight: 1520,
  cellWidth: 71,
  cellHeight: 95,
};

export const CONSUMABLE_SPRITE: SpriteConfig = {
  src: "/sprites/Tarots.png",
  sheetWidth: 710,
  sheetHeight: 570,
  cellWidth: 71,
  cellHeight: 95,
};

export const VOUCHER_SPRITE: SpriteConfig = {
  src: "/sprites/Vouchers.png",
  sheetWidth: 639,
  sheetHeight: 380,
  cellWidth: 71,
  cellHeight: 95,
};

export const BLIND_SPRITE = {
  src: "/sprites/BlindChips.png",
  sheetWidth: 1428,
  sheetHeight: 2108,
  cellWidth: 1428,
  cellHeight: 68,
} as const;

export const SPRITES: Record<string, SpriteConfig> = {
  joker: JOKER_SPRITE,
  consumable: CONSUMABLE_SPRITE,
  voucher: VOUCHER_SPRITE,
  blind: BLIND_SPRITE,
};
