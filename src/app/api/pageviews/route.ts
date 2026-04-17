import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

const VIEWS_KEY = "pageviews:total";
const UNIQUE_KEY = "pageviews:unique";

export async function GET() {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    const kv = env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return NextResponse.json(
        { error: "SESSIONS KV binding not available" },
        { status: 503 }
      );
    }

    const [totalViews, uniqueVisitors] = await Promise.all([
      kv.get(VIEWS_KEY),
      kv.get(UNIQUE_KEY),
    ]);

    return NextResponse.json({
      totalViews: parseInt(totalViews || "0", 10),
      uniqueVisitors: parseInt(uniqueVisitors || "0", 10),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "KV error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as unknown as Record<string, unknown> | undefined;
    const kv = env?.SESSIONS as KVNamespace | undefined;

    if (!kv) {
      return NextResponse.json(
        { error: "SESSIONS KV binding not available" },
        { status: 503 }
      );
    }

    // Get visitor ID from request body or generate one
    const body = (await request.json().catch(() => ({}))) as { visitorId?: string };
    const visitorId = body.visitorId || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Increment total views
    const currentTotal = await kv.get(VIEWS_KEY);
    const newTotal = (parseInt(currentTotal || "0", 10) + 1).toString();
    await kv.put(VIEWS_KEY, newTotal);

    // Check if this is a unique visitor (track for 24 hours)
    const visitorKey = `visitor:${visitorId}`;
    const existingVisitor = await kv.get(visitorKey);

    let isNewVisitor = false;
    if (!existingVisitor) {
      isNewVisitor = true;
      // Mark visitor as seen for 24 hours
      await kv.put(visitorKey, "1", { expirationTtl: 86400 });

      // Increment unique visitors
      const currentUnique = await kv.get(UNIQUE_KEY);
      const newUnique = (parseInt(currentUnique || "0", 10) + 1).toString();
      await kv.put(UNIQUE_KEY, newUnique);
    }

    return NextResponse.json({
      success: true,
      totalViews: parseInt(newTotal, 10),
      isNewVisitor,
      visitorId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "KV error" },
      { status: 500 }
    );
  }
}
