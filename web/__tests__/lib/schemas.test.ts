import { describe, test, expect } from "bun:test";
import { hasChallengeContent, type ChallengeJson } from "@/lib/schemas";

const mk = (overrides: Partial<ChallengeJson> = {}): ChallengeJson => ({
  key: "test",
  name: "Test Challenge",
  jokers: [],
  ...overrides,
} as ChallengeJson);

describe("hasChallengeContent", () => {
  test("returns false for empty challenge", () => {
    expect(hasChallengeContent(mk())).toBe(false);
  });

  test("returns true with jokers", () => {
    expect(hasChallengeContent(mk({ jokers: [{ id: "j_joker" }] }))).toBe(
      true,
    );
  });

  test("returns true with consumables", () => {
    expect(
      hasChallengeContent(mk({ consumeables: [{ id: "c_tarot" }] })),
    ).toBe(true);
  });

  test("returns true with vouchers", () => {
    expect(hasChallengeContent(mk({ vouchers: [{ id: "v_blank" }] }))).toBe(
      true,
    );
  });

  test("returns true with rules modifiers", () => {
    expect(
      hasChallengeContent(
        mk({ rules: { modifiers: [{ id: "dollars", value: 20 }] } }),
      ),
    ).toBe(true);
  });

  test("returns true with banned_cards", () => {
    expect(
      hasChallengeContent(
        mk({
          restrictions: { banned_cards: [{ id: "j_joker" }] },
        }),
      ),
    ).toBe(true);
  });

  test("returns true with banned_other", () => {
    expect(
      hasChallengeContent(
        mk({
          restrictions: {
            banned_other: [{ id: "bl_arm", type: "blind" }],
          },
        }),
      ),
    ).toBe(true);
  });

  test("returns true with deck cards", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: { type: "Challenge Deck", cards: [{ s: "H", r: "A" }] },
        }),
      ),
    ).toBe(true);
  });

  test("returns true with yes_suits (partial suit inclusion)", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: {
            type: "Challenge Deck",
            yes_suits: { H: true, C: true },
          },
        }),
      ),
    ).toBe(true);
  });

  test("returns false with all 4 suits included (full suit set)", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: {
            type: "Challenge Deck",
            yes_suits: { H: true, C: true, D: true, S: true },
          },
        }),
      ),
    ).toBe(false);
  });

  test("returns true with no_suits", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: {
            type: "Challenge Deck",
            no_suits: { H: true },
          },
        }),
      ),
    ).toBe(true);
  });

  test("returns true with yes_ranks (partial)", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: {
            type: "Challenge Deck",
            yes_ranks: { A: true, K: true },
          },
        }),
      ),
    ).toBe(true);
  });

  test("returns false with all 13 ranks included", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: {
            type: "Challenge Deck",
            yes_ranks: {
              "2": true, "3": true, "4": true, "5": true, "6": true,
              "7": true, "8": true, "9": true, T: true, J: true,
              Q: true, K: true, A: true,
            },
          },
        }),
      ),
    ).toBe(false);
  });

  test("returns true with no_ranks", () => {
    expect(
      hasChallengeContent(
        mk({
          deck: {
            type: "Challenge Deck",
            no_ranks: { "2": true },
          },
        }),
      ),
    ).toBe(true);
  });
});
