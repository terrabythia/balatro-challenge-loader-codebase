import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ConsumablePicker from "./consumable-picker";
import type { PickerItem } from "./item-picker";

const SAMPLE_CONSUMABLES: PickerItem[] = [
  { id: "c_fool", name: "The Fool", pos: { x: 0, y: 0 }, set: "Tarot", cost: 3, effect: "Disable Blind Effect" },
  { id: "c_magician", name: "The Magician", pos: { x: 1, y: 0 }, set: "Tarot", cost: 3, effect: "Enhance" },
  { id: "c_high_priestess", name: "The High Priestess", pos: { x: 2, y: 0 }, set: "Tarot", cost: 3, effect: "Round Bonus" },
  { id: "c_empress", name: "The Empress", pos: { x: 3, y: 0 }, set: "Tarot", cost: 3, effect: "Enhance" },
  { id: "c_emperor", name: "The Emperor", pos: { x: 4, y: 0 }, set: "Tarot", cost: 3, effect: "Create" },
  { id: "c_mercury", name: "Mercury", pos: { x: 0, y: 1 }, set: "Planet", cost: 3, effect: "Level Up" },
  { id: "c_venus", name: "Venus", pos: { x: 1, y: 1 }, set: "Planet", cost: 3, effect: "Level Up" },
  { id: "c_earth", name: "Earth", pos: { x: 2, y: 1 }, set: "Planet", cost: 3, effect: "Level Up" },
  { id: "c_familiar", name: "The Familiar", pos: { x: 0, y: 2 }, set: "Spectral", cost: 4, effect: "Enhance" },
  { id: "c_grim", name: "Grim", pos: { x: 1, y: 2 }, set: "Spectral", cost: 4, effect: "Destroy" },
];

const meta = {
  component: ConsumablePicker,
  tags: ["ai-generated"],
  args: {
    items: SAMPLE_CONSUMABLES,
    onSelect: (item) => console.log("Selected:", item.name, item.id),
  },
} satisfies Meta<typeof ConsumablePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
