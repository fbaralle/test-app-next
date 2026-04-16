import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

const PUBLIC_USER = "public";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || PUBLIC_USER;

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
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not available" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      coin_id?: string;
      coin_name?: string;
      coin_symbol?: string;
      coin_image?: string;
    };

    const { coin_id, coin_name, coin_symbol, coin_image } = body;

    if (!coin_id) {
      return NextResponse.json(
        { error: "coin_id is required" },
        { status: 400 }
      );
    }

    await db
      .prepare(
        "INSERT OR IGNORE INTO favorites (user_id, coin_id, coin_name, coin_symbol, coin_image, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(PUBLIC_USER, coin_id, coin_name || null, coin_symbol || null, coin_image || null, Date.now())
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
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    const db = env?.DB as D1Database | undefined;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get("coin_id");

    if (!coinId) {
      return NextResponse.json(
        { error: "coin_id is required" },
        { status: 400 }
      );
    }

    await db
      .prepare("DELETE FROM favorites WHERE user_id = ? AND coin_id = ?")
      .bind(PUBLIC_USER, coinId)
      .run();

    return NextResponse.json({ success: true, coin_id: coinId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Database error" },
      { status: 500 }
    );
  }
}
