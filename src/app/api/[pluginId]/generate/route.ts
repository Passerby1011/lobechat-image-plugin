import { getPluginSettingsFromRequest } from "@lobehub/chat-plugin-sdk";
import { NextResponse } from "next/server";
import { pluginRegistry } from "@/plugins";

export const runtime = "edge"; // 默认使用 Edge Runtime

export async function POST(
  req: Request,
  { params }: { params: { pluginId: string } }
) {
  const { pluginId } = params;
  const plugin = pluginRegistry[pluginId];

  if (!plugin) {
    return NextResponse.json(
      { error: `Plugin '${pluginId}' not found` },
      { status: 404 }
    );
  }

  try {
    // 1. 统一提取设置 (由 LobeChat 客户端注入)
    const settings = getPluginSettingsFromRequest(req);

    // 2. 解析请求体
    const body = await req.json();

    // 3. 分发给具体的插件处理器
    return await plugin.handle({ body, settings });
  } catch (error: any) {
    console.error(`[Router] Error dispatching to plugin ${pluginId}:`, error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
