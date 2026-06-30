import fs from "fs";
import path from "path";
import TestPickerView from "./view";

export default function TestPickerPage() {
  const jokers = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "jokers.json"), "utf-8")
  );
  const descriptions = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "data", "joker-descriptions.json"), "utf-8")
  );

  return <TestPickerView jokers={jokers} descriptions={descriptions} />;
}
