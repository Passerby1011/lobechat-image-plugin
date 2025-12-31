import { NextResponse } from "next/server";
import { pluginRegistry } from "@/plugins";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { pluginId: string } }
) {
  const { pluginId } = params;
  const plugin = pluginRegistry[pluginId];

  if (!plugin) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  // 动态获取当前请求的域名
  const { searchParams } = new URL(req.url);
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  try {
    const manifest = plugin.getManifest();
    
    // 注入动态生成的 API URL
    if (manifest.api && Array.isArray(manifest.api)) {
      manifest.api = manifest.api.map((api: any) => ({
        ...api,
        url: `${baseUrl}/api/${pluginId}${api.url.replace('/api', '')}`
      }));
    }

    return NextResponse.json(manifest);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate manifest" }, { status: 500 });
  }
}
