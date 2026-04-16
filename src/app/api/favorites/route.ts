import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  created_at: number;
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || "anonymous";

    const { results } = await db
      .prepare(
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
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not available" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      user_id?: string;
      coin_id?: string;
      seed?: boolean;
    };

    // Handle seed request - add demo data
    if (body.seed) {
      const demoCoins = ["bitcoin", "ethereum", "solana", "cardano", "polkadot"];
      const userId = body.user_id || "demo-user";

      for (const coinId of demoCoins) {
        await db
          .prepare(
            "INSERT OR IGNORE INTO favorites (user_id, coin_id, created_at) VALUES (?, ?, ?)"
          )
          .bind(userId, coinId, Date.now() - Math.random() * 86400000)
          .run();
      }

      return NextResponse.json({
        success: true,
        message: "Demo data seeded",
        coins: demoCoins,
      });
    }

    const { user_id = "anonymous", coin_id } = body;

    if (!coin_id) {
      return NextResponse.json(
        { error: "coin_id is required" },
        { status: 400 }
      );
    }

    await db
      .prepare(
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
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || "anonymous";
    const coinId = searchParams.get("coin_id");

    if (!coinId) {
      return NextResponse.json(
        { error: "coin_id is required" },
        { status: 400 }
      );
    }

    await db
      .prepare("DELETE FROM favorites WHERE user_id = ? AND coin_id = ?")
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
