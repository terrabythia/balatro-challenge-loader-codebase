import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import JokerPicker from "./joker-picker";
import type { PickerItem } from "./item-picker";

const SAMPLE_JOKERS: PickerItem[] = [
  {
    id: "j_joker", name: "Joker", pos: { x: 0, y: 0 },
    rarity: 1, cost: 2,
    config: { mult: 4 },
  },
  {
    id: "j_greedy_joker", name: "Greedy Joker", pos: { x: 6, y: 1 },
    rarity: 1, cost: 5,
    config: { extra: { s_mult: 3, suit: "Diamonds" } },
  },
  {
    id: "j_lusty_joker", name: "Lusty Joker", pos: { x: 7, y: 1 },
    rarity: 1, cost: 5,
    config: { extra: { s_mult: 3, suit: "Hearts" } },
  },
  {
    id: "j_funny_joker", name: "Funny Joker", pos: { x: 1, y: 0 },
    rarity: 2, cost: 8, discovered: true,
    config: { extra: 20 },
  },
  {
    id: "j_blackboard", name: "Blackboard", pos: { x: 4, y: 2 },
    rarity: 3, cost: 10,
    config: { x_mult: 3 },
  },
  {
    id: "j_hack", name: "Hack", pos: { x: 3, y: 2 },
    rarity: 2, cost: 12,
    config: { extra: { h_size: 33 } },
  },
  {
    id: "j_blueprint", name: "Blueprint", pos: { x: 0, y: 7 },
    rarity: 3, cost: 12,
    config: {},
  },
  {
    id: "j_perkeo", name: "Perkeo", pos: { x: 7, y: 7 },
    rarity: 4, cost: 20,
    config: { extra: { cards_destroyed: 0 } },
  },
];

const SAMPLE_DESC: Record<string, string[]> = {
  j_joker: ["+#1# Mult"],
  j_greedy_joker: ["Played cards with", "{C:diamonds}Diamond{} suit", "give +#1# Mult when scored"],
  j_lusty_joker: ["Played cards with", "{C:hearts}Heart{} suit", "give +#1# Mult when scored"],
  j_funny_joker: ["+#1# Mult if played hand", "contains a {C:attention}#2#{}"],
  j_blackboard: ["X#1# Mult if all cards", "held in hand are", "{C:clubs}Spades{} or {C:clubs}Clubs{}"],
  j_hack: ["Retrigger each played", "{C:attention}#1#, #2#, #3#, or #4#{}"],
  j_blueprint: ["Copies ability of", "Joker to the right"],
  j_perkeo: ["Creates a {C:dark_edition}Negative{} copy", "of {C:attention}#1#{} random", "consumable card in", "possession at end of shop"],
};

const meta = {
  component: JokerPicker,
  tags: ["ai-generated"],
  args: {
    items: SAMPLE_JOKERS,
    descriptions: SAMPLE_DESC,
    onSelect: (item) => console.log("Selected:", item.name, item.id),
  },
} satisfies Meta<typeof JokerPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FilteredSearch: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText("Search jokers...");
    await userEvent.type(input, "Joker");
    // Should only show "Joker" and the suit jokers
    await expect(canvas.getByText("Joker")).toBeVisible();
    await expect(canvas.getByText("Greedy Joker")).toBeVisible();
    await expect(canvas.getByText("Lusty Joker")).toBeVisible();
    await expect(canvas.getByText("Funny Joker")).toBeVisible();
    // Blueprint should not appear
    await expect(canvas.queryByText("Blueprint")).toBeNull();
  },
};
