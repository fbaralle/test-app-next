import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  created_at: number;
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "anonymous";

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC"
    )
      .bind(userId)
      .all<Favorite>();

    return NextResponse.json({ favorites: results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext();

  try {
    const body = (await request.json()) as { user_id?: string; coin_id?: string };
    const { user_id = "anonymous", coin_id } = body;

    if (!coin_id) {
      return NextResponse.json(
        { error: "coin_id is required" },
        { status: 400 }
      );
    }

    await env.DB.prepare(
      "INSERT OR IGNORE INTO favorites (user_id, coin_id, created_at) VALUES (?, ?, ?)"
    )
      .bind(user_id, coin_id, Date.now())
      .run();

    return NextResponse.json({ success: true, coin_id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id") || "anonymous";
  const coinId = searchParams.get("coin_id");

  if (!coinId) {
    return NextResponse.json({ error: "coin_id is required" }, { status: 400 });
  }

  try {
    await env.DB.prepare(
      "DELETE FROM favorites WHERE user_id = ? AND coin_id = ?"
    )
      .bind(userId, coinId)
      .run();

    return NextResponse.json({ success: true, coin_id: coinId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
