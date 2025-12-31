import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = "https://api.siliconflow.cn/v1";

export const siliconflowHandler: PluginHandler = {
  id: "siliconflow-image",
  name: "SiliconFlow Image Generator",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.SILICONFLOW_API_KEY;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "SiliconFlow API key is required.",
      });
    }

    const { 
      prompt, 
      model = "black-forest-labs/FLUX.1-schnell", 
      image_size = "1024x1024", 
      negative_prompt,
      seed,
      num_inference_steps
    } = body;

    if (!prompt) {
      return NextResponse.json({ message: "Prompt is required." }, { status: 400 });
    }

    try {
      const requestBody: any = { model, prompt, image_size };
      if (negative_prompt) requestBody.negative_prompt = negative_prompt;
      if (seed) requestBody.seed = seed;
      if (num_inference_steps) requestBody.num_inference_steps = num_inference_steps;

      const response = await axios.post(
        `${BASE_URL}/images/generations`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const respData = response.data;
      const imageUrls: string[] = [];

      // 遍历结果并持久化
      for (const img of respData.images) {
        const permanentUrl = await saveImageToStorage(img.url, "url", "siliconflow-image");
        imageUrls.push(permanentUrl);
      }

      // 统一 Markdown 响应
      const markdownResponse = formatImageMarkdown(imageUrls, {
        prompt,
        model,
        extraInfo: {
          "推理时间": `${respData.timings?.inference || 'N/A'}ms`,
          "种子": respData.seed || seed || 'N/A'
        }
      });

      return NextResponse.json({ markdownResponse });
    } catch (error: any) {
      console.error("[SiliconFlow Plugin] Error:", error);
      return NextResponse.json(
        { message: error.response?.data?.message || "Failed to generate image" },
        { status: error.response?.status || 500 }
      );
    }
  }
};
