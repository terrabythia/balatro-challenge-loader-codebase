import fs from "fs";
import path from "path";
import BuildView from "./view";

export default async function BuildPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const jokers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "jokers.json"), "utf-8")
  );
  const descriptions = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "joker-descriptions.json"), "utf-8")
  );
  const consumables = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "consumables.json"), "utf-8")
  );
  const vouchers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "vouchers.json"), "utf-8")
  );
  const blinds = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "blinds.json"), "utf-8")
  );

  return (
    <BuildView
      jokers={jokers}
      descriptions={descriptions}
      consumables={consumables}
      vouchers={vouchers}
      blinds={blinds}
      editCode={code ?? null}
    />
  );
}
