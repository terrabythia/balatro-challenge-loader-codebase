import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import DeckEditor, { buildStandardDeck } from "./deck-editor";

const meta = {
  component: DeckEditor,
  tags: ["ai-generated"],
  args: {
    cards: buildStandardDeck(),
    onChange: (cards) => console.log("Changed:", cards.filter((c) => c.included).length, "cards"),
  },
} satisfies Meta<typeof DeckEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HalfCleared: Story = {
  args: {
    cards: buildStandardDeck().map((c) => ({
      ...c,
      included: c.suit !== "Clubs",
    })),
  },
};
