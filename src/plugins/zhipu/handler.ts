import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

/**
 * 智谱 AI 支持的模型列表
 */
const ZHIPU_MODELS = [
  "cogview-4-250304",
  "cogview-4",
  "cogview-3-flash"
];

export const zhipuHandler: PluginHandler = {
  id: "zhipuai-image",
  name: "ZhipuAI Image Generator",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.ZHIPUAI_API_KEY;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "智谱 AI API Key 未配置。请前往智谱 AI 开放平台获取 API Key。",
      });
    }

    // --- 参数预处理与校验 ---
    const { 
      prompt, 
      size = "1024x1024", 
      user_id, 
      model = "cogview-4",
      quality = "standard",
      watermark_enabled = true
    } = body;

    // 1. 必填项校验
    if (!prompt) {
      return NextResponse.json({ message: "参数 prompt (提示词) 是必须的。" }, { status: 400 });
    }

    // 2. 模型有效性检查
    if (!ZHIPU_MODELS.includes(model)) {
      return NextResponse.json({ message: `不支持的模型 ID: ${model}` }, { status: 400 });
    }

    try {
      // 3. 构建请求体，只包含 API 支持的参数
      const requestBody: any = { 
        model, 
        prompt, 
        size, 
        user_id,
        watermark_enabled
      };

      // 特殊参数校验：只有旗舰模型支持 quality
      if (model === "cogview-4-250304") {
        requestBody.quality = quality;
      }

      const response = await fetch(`${BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      });

      const respData = await response.json();

      if (!response.ok) {
        console.error("[ZhipuAI Plugin] API 错误:", respData);
        return NextResponse.json(
          { message: `智谱 AI API 错误: ${respData.error?.message || "请求失败"}` }, 
          { status: response.status }
        );
      }

      const imageUrls: string[] = [];
      if (respData.data && Array.isArray(respData.data)) {
        for (const img of respData.data) {
          if (img.url) {
            const pUrl = await saveImageToStorage(img.url, "url", "zhipuai-image");
            imageUrls.push(pUrl);
          }
        }
      }

      if (imageUrls.length === 0) return NextResponse.json({ message: "未生成任何图像。" }, { status: 500 });

      // --- 构建响应 ---
      const extraInfo: Record<string, any> = { "尺寸": size };
      if (model === "cogview-4-250304") {
        extraInfo["质量"] = quality === "hd" ? "高清 (HD)" : "标准";
      }

      return NextResponse.json({
        markdownResponse: formatImageMarkdown(imageUrls, {
          prompt,
          model: `智谱 CogView (${model})`,
          extraInfo
        }),
        images: imageUrls,
        metadata: { prompt, model, extraInfo }
      });

    } catch (error: any) {
      console.error("[ZhipuAI Plugin] 内部错误:", error);
      return NextResponse.json({ message: error.message || "内部处理异常。" }, { status: 500 });
    }
  }
};
