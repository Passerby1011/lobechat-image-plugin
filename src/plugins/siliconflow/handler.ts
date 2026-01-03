import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = "https://api.siliconflow.cn/v1";

/**
 * SiliconFlow 支持的模型列表
 */
const SILICON_MODELS = [
  "black-forest-labs/FLUX.1-schnell",
  "black-forest-labs/FLUX.1-dev",
  "black-forest-labs/FLUX.1-pro",
  "black-forest-labs/FLUX-1.1-pro",
  "Kwai-Kolors/Kolors",
  "Qwen/Qwen-Image",
  "Qwen/Qwen-Image-Edit-2509"
];

export const siliconflowHandler: PluginHandler = {
  id: "siliconflow-image",
  name: "SiliconFlow Image Generator",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.SILICONFLOW_API_KEY;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "SiliconFlow API Key 未配置。请前往控制台获取 API Key。",
      });
    }

    // --- 参数预处理与校验 ---
    const { 
      prompt, 
      model = "black-forest-labs/FLUX.1-schnell", 
      image_size = "1024x1024", 
      size, 
      negative_prompt,
      seed,
      num_inference_steps,
      guidance_scale,
      n,
      batch_size = 1,
      prompt_extension = false,
      image
    } = body;

    // 1. 必填项校验
    if (!prompt) {
      return NextResponse.json({ message: "参数 prompt (提示词) 是必须的。" }, { status: 400 });
    }

    // 2. 模型有效性检查
    if (!SILICON_MODELS.includes(model)) {
      return NextResponse.json({ message: `不支持的模型 ID: ${model}` }, { status: 400 });
    }

    try {
      // 3. 构建请求体，确保参数名符合 SiliconFlow API 标准
      const requestBody: any = { 
        model, 
        prompt, 
        image_size: size || image_size,
        batch_size: parseInt(String(batch_size || n || 1))
      };
      
      if (negative_prompt) requestBody.negative_prompt = negative_prompt;
      if (seed !== undefined) requestBody.seed = parseInt(String(seed));
      if (num_inference_steps) requestBody.num_inference_steps = parseInt(String(num_inference_steps));
      if (guidance_scale) requestBody.guidance_scale = parseFloat(String(guidance_scale));
      if (prompt_extension !== undefined) requestBody.prompt_extension = Boolean(prompt_extension);
      if (image) requestBody.image = image;

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
        console.error("[SiliconFlow Plugin] API 错误:", respData);
        return NextResponse.json(
          { message: `SiliconFlow API 错误: ${respData.message || "请求失败"}` }, 
          { status: response.status }
        );
      }

      const imageUrls: string[] = [];
      const images = respData.images || respData.data || [];

      // 4. 图片结果持久化
      for (const img of images) {
        const source = img.url || img.b64_json;
        if (source) {
          const type = img.url ? "url" : "b64_json";
          const permanentUrl = await saveImageToStorage(source, type, "siliconflow-image");
          imageUrls.push(permanentUrl);
        }
      }

      if (imageUrls.length === 0) return NextResponse.json({ message: "未生成任何有效图像。" }, { status: 500 });

      // --- 构建响应 ---
      const extraInfo: Record<string, any> = {
        "推理时间": `${respData.timings?.inference || 'N/A'}ms`,
        "尺寸": size || image_size,
        "种子": respData.seed || seed || 'N/A'
      };

      return NextResponse.json({ 
        markdownResponse: formatImageMarkdown(imageUrls, {
          prompt,
          model,
          extraInfo
        }),
        images: imageUrls,
        metadata: { prompt, model, extraInfo }
      });
    } catch (error: any) {
      console.error("[SiliconFlow Plugin] 内部错误:", error);
      return NextResponse.json({ message: error.message || "内部处理异常。" }, { status: 500 });
    }
  }
};
