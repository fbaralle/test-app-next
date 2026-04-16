import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;

    // Try to find R2 bucket - it might have different binding names
    const r2 = (env?.WEBFLOW_CLOUD_MEDIA ??
      env?.R2_BUCKET ??
      env?.MEDIA) as R2Bucket | undefined;

    if (!r2) {
      return NextResponse.json(
        {
          error: "R2 binding not available",
          availableBindings: env ? Object.keys(env) : [],
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const exportId = searchParams.get("id");

    if (!exportId) {
      // List recent exports
      const list = await r2.list({ prefix: "exports/", limit: 10 });
      const exports = list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      }));
      return NextResponse.json({ exports });
    }

    // Get specific export
    const object = await r2.get(`exports/${exportId}`);
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
  try {
    const ctx = await getCloudflareContext();
    const env = ctx?.env as Record<string, unknown> | undefined;

    // Try to find R2 bucket
    const r2 = (env?.WEBFLOW_CLOUD_MEDIA ??
      env?.R2_BUCKET ??
      env?.MEDIA) as R2Bucket | undefined;

    if (!r2) {
      return NextResponse.json(
        {
          error: "R2 binding not available",
          availableBindings: env ? Object.keys(env) : [],
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    // Handle seed request - add demo data
    if (body.seed) {
      const demoExports = [
        {
          id: "demo-report-1",
          type: "report",
          title: "Monthly Analytics Report",
          data: { views: 12500, clicks: 890, conversions: 45 },
        },
        {
          id: "demo-backup-1",
          type: "backup",
          title: "Database Backup",
          data: { tables: 15, rows: 50000, size: "2.3MB" },
        },
        {
          id: "demo-config-1",
          type: "config",
          title: "Site Configuration Export",
          data: { theme: "dark", language: "en", timezone: "UTC" },
        },
      ];

      for (const item of demoExports) {
        const exportData = {
          id: item.id,
          createdAt: new Date().toISOString(),
          type: item.type,
          title: item.title,
          data: item.data,
        };

        await r2.put(`exports/${item.id}`, JSON.stringify(exportData), {
          httpMetadata: {
            contentType: "application/json",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Demo exports created",
        exports: demoExports.map((e) => e.id),
      });
    }

    const exportId = `export-${Date.now()}`;
    const exportData = {
      id: exportId,
      createdAt: new Date().toISOString(),
      data: body,
    };

    await r2.put(`exports/${exportId}`, JSON.stringify(exportData), {
      httpMetadata: {
        contentType: "application/json",
      },
    });

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
