import fs from "fs";
import path from "path";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import BuildView from "./view";

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Load static game data
  const jokers = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", "jokers.json"),
      "utf-8",
    ),
  );
  const descriptions = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", "joker-descriptions.json"),
      "utf-8",
    ),
  );
  const consumables = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", "consumables.json"),
      "utf-8",
    ),
  );
  const vouchers = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", "vouchers.json"),
      "utf-8",
    ),
  );
  const blinds = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "data", "blinds.json"),
      "utf-8",
    ),
  );

  // Load draft from DB if editing (server-side, no loading flash)
  let initialDraft: {
    name: string;
    description: string | null;
    status: string;
    json_data: Record<string, unknown>;
  } | null = null;

  const session = await getSession();
  const isGuest = session?.isGuest ?? false;

  if (code && session) {
    const ownershipColumn = isGuest ? "guest_id" : "author_id";
    const result = await db.query(
      `SELECT name, description, status, json_data FROM content WHERE code = $1 AND ${ownershipColumn} = $2`,
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
