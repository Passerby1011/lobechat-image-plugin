import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

/**
 * 豆包模型有效性校验
 */
const DOUBAO_MODELS = [
  "doubao-seedream-4-5-251128",
  "doubao-seedream-4-0-250828",
  "doubao-seedream-3-0-t2i-250415",
  "doubao-seededit-3-0-i2i-250628"
];

export const doubaoHandler: PluginHandler = {
  id: "doubao-image",
  name: "Doubao Image Generator",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.ARK_API_KEY || settings.VOLC_ACCESS_KEY_ID;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "火山引擎 ARK API Key 未配置。请前往火山引擎控制台获取 API Key。",
      });
    }

    // --- 参数预处理与校验 ---
    const {
      prompt,
      model = "doubao-seedream-4-5-251128",
      size = "2048x2048",
      response_format = "url",
      image,
      seed,
      guidance_scale,
      stream = false,
      sequential_image_generation = "disabled",
      sequential_image_generation_options,
      watermark = true
    } = body;

    // 1. 必填项校验
    if (!prompt) {
      return NextResponse.json({ message: "参数 'prompt' (提示词) 是必须的。" }, { status: 400 });
    }

    // 2. 模型有效性校验
    if (!DOUBAO_MODELS.includes(model)) {
      return NextResponse.json({ message: `不支持的模型 ID: ${model}` }, { status: 400 });
    }

    try {
      // 3. 参数清洗与构建 (只保留 API 支持的参数)
      const requestBody: any = {
        model,
        prompt,
        size: model.includes('seededit') && size === '2048x2048' ? 'adaptive' : size, // 编辑模型默认为 adaptive
        response_format,
        watermark
      };

      // 参考图处理 (SeedEdit 仅支持单图，Seedream 支持多图)
      if (image) {
        if (model.includes('seededit')) {
          requestBody.image = Array.isArray(image) ? image[0] : image;
        } else {
          requestBody.image = image;
        }
      }

      // 针对不同模型的参数过滤
      if (model.includes('seedream-3-0') || model.includes('seededit')) {
        if (seed !== undefined) requestBody.seed = seed;
        if (guidance_scale !== undefined) requestBody.guidance_scale = guidance_scale;
      }

      // 组图逻辑处理 (仅 4.5/4.0 支持)
      if (!model.includes('seedream-3-0') && !model.includes('seededit')) {
        requestBody.sequential_image_generation = sequential_image_generation;
        if (sequential_image_generation === 'auto' && sequential_image_generation_options) {
          requestBody.sequential_image_generation_options = sequential_image_generation_options;
        }
      }

      // 调用火山引擎 Ark API
      const response = await fetch(`${ARK_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const arkResponse = await response.json();

      // 检查 API 返回的错误
      if (!response.ok || arkResponse.error) {
        const error = arkResponse.error || { message: "API 请求失败", code: "unknown" };
        console.error("[Doubao Plugin] API 错误:", error);

        if (error.code === 'content_policy_violation') {
          return NextResponse.json({ message: "图像生成失败：输入内容未能通过安全审核。" }, { status: 400 });
        }

        return NextResponse.json({ message: `火山引擎 API 错误: ${error.message}` }, { status: response.status });
      }

      const data = arkResponse.data;
      if (!data || !Array.isArray(data)) {
        return NextResponse.json({ message: "API 响应格式异常，未找到图片数据。" }, { status: 500 });
      }

      // 持久化图片
      const imageUrls: string[] = [];
      for (const item of data) {
        const source = item.url || item.b64_json;
        const type = item.url ? "url" : "b64_json";
        if (source) {
          const savedUrl = await saveImageToStorage(source, type, "doubao-image");
          imageUrls.push(savedUrl);
        }
      }

      if (imageUrls.length === 0) return NextResponse.json({ message: "未生成任何有效图像。" }, { status: 500 });

      // --- 构建响应 ---
      const extraInfo: Record<string, any> = {
        "模型": model,
        "尺寸": size
      };
      if (arkResponse.usage) extraInfo["计算消耗"] = arkResponse.usage.total_tokens;

      return NextResponse.json({
        markdownResponse: formatImageMarkdown(imageUrls, {
          prompt,
          model: `豆包 Seedream (${model})`,
          extraInfo
        }),
        images: imageUrls,
        metadata: { prompt, model, extraInfo }
      });

    } catch (error: any) {
      console.error("[Doubao Plugin] 插件内部错误:", error);
      return NextResponse.json({ message: error.message || "内部处理异常。" }, { status: 500 });
    }
  }
};
