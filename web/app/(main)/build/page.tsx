import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadGameData } from "@/lib/game-data";
import BuildView from "./view";

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Load static game data
  const jokers = loadGameData("jokers.json");
  const descriptions = loadGameData("joker-descriptions.json");
  const consumables = loadGameData("consumables.json");
  const vouchers = loadGameData("vouchers.json");
  const blinds = loadGameData("blinds.json");

  // Load draft from DB if editing (server-side, no loading flash)
  let initialDraft: {
    name: string;
    description: string | null;
    status: string;
    version: number | null;
    json_data: Record<string, unknown>;
  } | null = null;

  const session = await getSession();
  const isGuest = session?.isGuest ?? false;

  if (code && session) {
    const ownershipColumn = isGuest ? "guest_id" : "author_id";
    const result = await db.query(
      `SELECT name, description, status, version, json_data FROM content WHERE code = $1 AND ${ownershipColumn} = $2`,
      [code, session.userId],
    );
      if (result.rows.length > 0) {
        initialDraft = result.rows[0] as typeof initialDraft;
      }
  }

  return (
    <BuildView
      jokers={jokers}
      descriptions={descriptions}
      consumables={consumables}
      vouchers={vouchers}
      blinds={blinds}
      editCode={code ?? null}
      initialDraft={initialDraft}
      isGuest={isGuest}
    />
  );
}
