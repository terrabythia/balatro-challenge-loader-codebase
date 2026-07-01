import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VoucherPicker from "./voucher-picker";
import type { PickerItem } from "./item-picker";

const SAMPLE_VOUCHERS: PickerItem[] = [
  { id: "v_overstock_norm", name: "Overstock", pos: { x: 0, y: 0 }, cost: 10 },
  { id: "v_clearance_sale", name: "Clearance Sale", pos: { x: 3, y: 0 }, cost: 10 },
  { id: "v_hone", name: "Hone", pos: { x: 4, y: 0 }, cost: 10 },
  { id: "v_seed_money", name: "Seed Money", pos: { x: 0, y: 1 }, cost: 10 },
  { id: "v_money_tree", name: "Money Tree", pos: { x: 3, y: 1 }, cost: 10 },
  { id: "v_blank", name: "Blank", pos: { x: 0, y: 2 }, cost: 10 },
  { id: "v_antimatter", name: "Antimatter", pos: { x: 1, y: 2 }, cost: 10 },
  { id: "v_magic_trick", name: "Magic Trick", pos: { x: 0, y: 3 }, cost: 10 },
];

const meta = {
  component: VoucherPicker,
  tags: ["ai-generated"],
  args: {
    items: SAMPLE_VOUCHERS,
    onSelect: (item) => console.log("Selected:", item.name, item.id),
  },
} satisfies Meta<typeof VoucherPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
