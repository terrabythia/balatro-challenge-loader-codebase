import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  const modDir = path.join(process.cwd(), "..", "mod");
  const tmpZip = path.join(os.tmpdir(), `challenge-loader-${Date.now()}.zip`);

  try {
    execSync(
      `cd "${modDir}" && zip -r "${tmpZip}" . -x "NEXT_AGENT.md" "challenges/*"`,
      { stdio: "pipe", timeout: 10000 },
    );

    const zipData = readFileSync(tmpZip);
    unlinkSync(tmpZip);

    return new NextResponse(zipData, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="challenge-loader-mod.zip"',
      },
    });
  } catch (err) {
    console.error("Failed to create mod zip:", err);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 },
    );
  }
}
