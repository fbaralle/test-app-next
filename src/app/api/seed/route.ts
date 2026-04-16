import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;

    const results: Record<string, { success: boolean; message?: string; error?: string }> = {};

    // Seed D1 (Favorites)
    const db = env?.DB as D1Database | undefined;
    if (db) {
      try {
        const demoCoins = ["bitcoin", "ethereum", "solana", "cardano", "polkadot"];
        for (const coinId of demoCoins) {
          await db
            .prepare(
              "INSERT OR IGNORE INTO favorites (user_id, coin_id, created_at) VALUES (?, ?, ?)"
            )
            .bind("demo-user", coinId, Date.now() - Math.random() * 86400000)
            .run();
        }
        results.d1 = { success: true, message: `Seeded ${demoCoins.length} favorites` };
      } catch (e) {
        results.d1 = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
    } else {
      results.d1 = { success: false, error: "DB binding not available" };
    }

    // Seed KV (SESSIONS)
    const sessions = env?.SESSIONS as KVNamespace | undefined;
    if (sessions) {
      try {
        const demoData = [
          { key: "user:1", value: { name: "Alice", email: "alice@example.com" } },
          { key: "user:2", value: { name: "Bob", email: "bob@example.com" } },
          { key: "config:theme", value: { mode: "dark", accent: "blue" } },
        ];
        for (const item of demoData) {
          await sessions.put(`cache:${item.key}`, JSON.stringify(item.value), {
            expirationTtl: 3600,
          });
        }
        results.kv_sessions = { success: true, message: `Seeded ${demoData.length} cache entries` };
      } catch (e) {
        results.kv_sessions = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
    } else {
      results.kv_sessions = { success: false, error: "SESSIONS binding not available" };
    }

    // Seed KV (FLAGS)
    const flags = env?.FLAGS as KVNamespace | undefined;
    if (flags) {
      try {
        const demoFlags = [
          { key: "feature:dark-mode", value: { enabled: true, rollout: 100 } },
          { key: "feature:new-dashboard", value: { enabled: true, rollout: 50 } },
          { key: "feature:beta-api", value: { enabled: false, rollout: 0 } },
        ];
        for (const item of demoFlags) {
          await flags.put(item.key, JSON.stringify(item.value));
        }
        results.kv_flags = { success: true, message: `Seeded ${demoFlags.length} feature flags` };
      } catch (e) {
        results.kv_flags = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
    } else {
      results.kv_flags = { success: false, error: "FLAGS binding not available" };
    }

    // Seed R2 (Exports)
    const r2 = (env?.WEBFLOW_CLOUD_MEDIA ?? env?.R2_BUCKET ?? env?.MEDIA) as R2Bucket | undefined;
    if (r2) {
      try {
        const demoExports = [
          {
            id: "demo-report",
            type: "report",
            title: "Monthly Analytics Report",
            data: { views: 12500, clicks: 890, conversions: 45 },
          },
          {
            id: "demo-backup",
            type: "backup",
            title: "Database Backup",
            data: { tables: 15, rows: 50000, size: "2.3MB" },
          },
        ];
        for (const item of demoExports) {
          await r2.put(
            `exports/${item.id}`,
            JSON.stringify({
              ...item,
              createdAt: new Date().toISOString(),
            }),
            { httpMetadata: { contentType: "application/json" } }
          );
        }
        results.r2 = { success: true, message: `Seeded ${demoExports.length} exports` };
      } catch (e) {
        results.r2 = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
      }
    } else {
      results.r2 = { success: false, error: "R2 binding not available" };
    }

    const allSuccess = Object.values(results).every((r) => r.success);

    return NextResponse.json({
      success: allSuccess,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
