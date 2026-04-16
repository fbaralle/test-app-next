import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL = 60; // 1 minute cache

export async function GET(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const kv = env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return NextResponse.json(
        { error: "KV binding not available" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || "default";
    const cacheKey = `cache:${key}`;

    // Try to get from KV cache
    const cached = await kv.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        data: JSON.parse(cached),
        cached: true,
        key,
      });
    }

    // Generate fresh data (simulated)
    const freshData = {
      timestamp: new Date().toISOString(),
      key,
      value: `Data for ${key} generated at ${Date.now()}`,
    };

    // Store in KV with TTL
    await kv.put(cacheKey, JSON.stringify(freshData), {
      expirationTtl: CACHE_TTL,
    });

    return NextResponse.json({
      data: freshData,
      cached: false,
      key,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cache error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;
    const kv = env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return NextResponse.json(
        { error: "KV binding not available" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      key?: string;
      value?: unknown;
      seed?: boolean;
    };

    // Handle seed request - add demo data
    if (body.seed) {
      const demoData = [
        { key: "user:1", value: { name: "Alice", email: "alice@example.com" } },
        { key: "user:2", value: { name: "Bob", email: "bob@example.com" } },
        { key: "config:theme", value: { mode: "dark", accent: "blue" } },
        { key: "stats:visitors", value: { today: 1234, total: 56789 } },
      ];

      for (const item of demoData) {
        await kv.put(`cache:${item.key}`, JSON.stringify(item.value), {
          expirationTtl: 3600, // 1 hour
        });
      }

      return NextResponse.json({
        success: true,
        message: "Demo cache data seeded",
        keys: demoData.map((d) => d.key),
      });
    }

    const { key, value } = body;
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await kv.put(`cache:${key}`, JSON.stringify(value), {
      expirationTtl: CACHE_TTL,
    });

    return NextResponse.json({ success: true, key });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cache error" },
      { status: 500 }
    );
  }
}
