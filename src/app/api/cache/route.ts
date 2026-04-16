import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

const CACHE_TTL = 60; // 1 minute cache

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "default";
  const cacheKey = `cache:${key}`;

  try {
    // Try to get from KV cache
    const cached = await env.SESSIONS.get(cacheKey);
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
    await env.SESSIONS.put(cacheKey, JSON.stringify(freshData), {
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
