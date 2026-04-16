import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const exportId = searchParams.get("id");

  if (!exportId) {
    // List recent exports
    try {
      const list = await env.WEBFLOW_CLOUD_MEDIA.list({ prefix: "exports/", limit: 10 });
      const exports = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      }));
      return NextResponse.json({ exports });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "R2 error" },
        { status: 500 }
      );
    }
  }

  // Get specific export
  try {
    const object = await env.WEBFLOW_CLOUD_MEDIA.get(`exports/${exportId}`);
    if (!object) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }

    const data = await object.text();
    return NextResponse.json({
      id: exportId,
      data: JSON.parse(data),
      metadata: {
        size: object.size,
        uploaded: object.uploaded.toISOString(),
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "R2 error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const exportId = `export-${Date.now()}`;
    const exportData = {
      id: exportId,
      createdAt: new Date().toISOString(),
      data: body,
    };

    await env.WEBFLOW_CLOUD_MEDIA.put(
      `exports/${exportId}`,
      JSON.stringify(exportData),
      {
        httpMetadata: {
          contentType: "application/json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      id: exportId,
      url: `/api/export?id=${exportId}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "R2 error" },
      { status: 500 }
    );
  }
}
