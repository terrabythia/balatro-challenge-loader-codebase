import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DeckEditor, { buildStandardDeck, plainInstance } from "./deck-editor";

const meta = {
  component: DeckEditor,
  tags: ["ai-generated"],
  args: {
    cards: buildStandardDeck(),
    onChange: (cards) =>
      console.log("Changed:", cards.reduce((s, c) => s + c.count, 0), "cards"),
  },
} satisfies Meta<typeof DeckEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SomeRemoved: Story = {
  args: {
    cards: buildStandardDeck().map((c) => ({
      ...c,
      count: c.suit === "Clubs" ? 0 : 1,
      instances: c.suit === "Clubs" ? [] : [plainInstance()],
    })),
  },
};

export const Duplicates: Story = {
  args: {
    cards: buildStandardDeck().map((c) => {
      if (c.rank === "A" && c.suit === "Hearts") {
        return {
          ...c,
          count: 3,
          instances: [plainInstance(), plainInstance(), plainInstance()],
        };
      }
      return c;
    }),
  },
};

export const AllGlass: Story = {
  args: {
    cards: buildStandardDeck().map((c) => ({
      ...c,
      instances: c.instances.map((inst) => ({
        ...inst,
        enhancement: "m_glass",
      })),
    })),
  },
};

export const AllStone: Story = {
  args: {
    cards: buildStandardDeck().map((c) => ({
      ...c,
      instances: c.instances.map((inst) => ({
        ...inst,
        enhancement: "m_stone",
      })),
    })),
  },
};

export const AllSteel: Story = {
  args: {
    cards: buildStandardDeck().map((c) => ({
      ...c,
      instances: c.instances.map((inst) => ({
        ...inst,
        enhancement: "m_steel",
      })),
    })),
  },
};

export const AllGold: Story = {
  args: {
    cards: buildStandardDeck().map((c) => ({
      ...c,
      instances: c.instances.map((inst) => ({
        ...inst,
        enhancement: "m_gold",
      })),
    })),
  },
};
