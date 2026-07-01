import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import ItemPicker, { type PickerItem } from "./item-picker";

const SAMPLE_ITEMS: PickerItem[] = [
  { id: "j_joker", name: "Joker", pos: { x: 0, y: 0 }, rarity: 1, cost: 2 },
  { id: "j_greedy_joker", name: "Greedy Joker", pos: { x: 6, y: 1 }, rarity: 1, cost: 5 },
  { id: "j_lusty_joker", name: "Lusty Joker", pos: { x: 7, y: 1 }, rarity: 1, cost: 5 },
  { id: "j_funny_joker", name: "Funny Joker", pos: { x: 1, y: 0 }, rarity: 2, cost: 8 },
  { id: "j_hack", name: "Hack", pos: { x: 3, y: 2 }, rarity: 2, cost: 12 },
  { id: "j_blackboard", name: "Blackboard", pos: { x: 4, y: 2 }, rarity: 3, cost: 10 },
  { id: "j_blueprint", name: "Blueprint", pos: { x: 0, y: 7 }, rarity: 3, cost: 12 },
  { id: "j_hallucination", name: "Hallucination", pos: { x: 5, y: 2 }, rarity: 1, cost: 4 },
  { id: "j_perkeo", name: "Perkeo", pos: { x: 7, y: 7 }, rarity: 4, cost: 20 },
  { id: "j_triboulet", name: "Triboulet", pos: { x: 8, y: 7 }, rarity: 4, cost: 20 },
];

const meta = {
  component: ItemPicker,
  tags: ["ai-generated"],
  args: {
    items: SAMPLE_ITEMS,
    spriteUrl: "/sprites/Jokers.png",
    spriteWidth: 710,
    spriteHeight: 1520,
    cellWidth: 71,
    cellHeight: 95,
    placeholder: "Search jokers...",
    onSelect: (item) => console.log("Selected:", item.name),
  },
} satisfies Meta<typeof ItemPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTooltips: Story = {
  args: {
    getTitle: (item) => `${item.name} (Rarity ${item.rarity}, $${item.cost})`,
    renderTooltip: (item) => (
      <div className="text-xs space-y-1 min-w-32 max-w-56">
        <p className="font-semibold text-sm text-white">{item.name}</p>
        <p className="text-white/60">
          Rarity {item.rarity as number} · ${item.cost as number}
        </p>
      </div>
    ),
  },
};

export const EmptySearch: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText("Search jokers...");
    await userEvent.type(input, "zzz_nonexistent", { delay: 10 });
    await expect(
      canvas.getByText('No items match "zzz_nonexistent"')
    ).toBeVisible();
  },
};

export const CssCheck: Story = {
  args: {
    placeholder: "Search...",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByPlaceholderText("Search...");
    // rounded-lg = 0.5rem = 8px — proves Tailwind loaded
    await expect(getComputedStyle(input).borderRadius).toBe("8px");
  },
};
