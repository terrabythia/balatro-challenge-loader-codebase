import { z } from "zod";

// Edition values (without e_ prefix — the web builder strips it)
const editionSchema = z.enum([
  "foil",
  "holo",
  "polychrome",
  "negative",
]);

const jokerSchema = z.object({
  id: z.string().min(1),
  edition: editionSchema.optional(),
  eternal: z.boolean().optional(),
});

const consumableSchema = z.object({
  id: z.string().min(1),
});

const voucherSchema = z.object({
  id: z.string().min(1),
});

const deckCardSchema = z.object({
  s: z.string().min(1),
  r: z.string().min(1),
  e: z.string().optional(),
  d: editionSchema.optional(),
  g: z.string().optional(),
});

const deckSchema = z.object({
  type: z.string().optional(),
  yes_suits: z.record(z.string(), z.boolean()).optional(),
  no_suits: z.record(z.string(), z.boolean()).optional(),
  yes_ranks: z.record(z.string(), z.boolean()).optional(),
  no_ranks: z.record(z.string(), z.boolean()).optional(),
  cards: z.array(deckCardSchema).optional(),
});

const modifierSchema = z.object({
  id: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

const bannedItemSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
});

// Full challenge JSON schema — used for publish validation
export const challengeJsonSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  jokers: z.array(jokerSchema).optional().default([]),
  consumeables: z.array(consumableSchema).optional(),
  vouchers: z.array(voucherSchema).optional(),
  deck: deckSchema.optional(),
  restrictions: z
    .object({
      banned_cards: z.array(bannedItemSchema).optional(),
      banned_other: z.array(bannedItemSchema).optional(),
    })
    .optional(),
  rules: z
    .object({
      modifiers: z.array(modifierSchema).optional(),
    })
    .optional(),
});

export type ChallengeJson = z.infer<typeof challengeJsonSchema>;

// Returns true if the challenge has meaningful content beyond defaults
export function hasChallengeContent(data: ChallengeJson): boolean {
  if (data.jokers && data.jokers.length > 0) return true;
  if (data.consumeables && data.consumeables.length > 0) return true;
  if (data.vouchers && data.vouchers.length > 0) return true;
  if (data.rules?.modifiers && data.rules.modifiers.length > 0) return true;
  if (data.restrictions?.banned_cards && data.restrictions.banned_cards.length > 0) return true;
  if (data.restrictions?.banned_other && data.restrictions.banned_other.length > 0) return true;
  if (data.deck) {
    const d = data.deck;
    if (d.cards && d.cards.length > 0) return true;
    if (d.yes_suits && Object.keys(d.yes_suits).length > 0 && Object.keys(d.yes_suits).length < 4) return true;
    if (d.no_suits && Object.keys(d.no_suits).length > 0) return true;
    if (d.yes_ranks && Object.keys(d.yes_ranks).length > 0 && Object.keys(d.yes_ranks).length < 13) return true;
    if (d.no_ranks && Object.keys(d.no_ranks).length > 0) return true;
  }
  return false;
}
