import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const ratingSchema = z.object({
  content_id: z.number().int().positive(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

// POST /api/ratings (auth required)
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await db.query(
      `INSERT INTO ratings (content_id, user_id, score, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (content_id, user_id)
       DO UPDATE SET score = $3, comment = $4`,
      [
        parsed.data.content_id,
        session.userId,
        parsed.data.score,
        parsed.data.comment || null,
      ]
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Content not found" },
      { status: 404 }
    );
  }
}
