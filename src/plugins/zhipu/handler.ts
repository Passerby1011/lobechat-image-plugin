import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

export const zhipuHandler: PluginHandler = {
  id: "zhipuai-image",
  name: "ZhipuAI Image Generator",
  getManifest: () => ({
    "identifier": "zhipuai-image",
    "api": [
      {
        "url": "/api/generate",
        "name": "generateImage",
        "description": "智谱AI图像生成",
        "parameters": {
          "type": "object",
          "properties": {
            "model": {
              "type": "string",
              "enum": ["cogview-3-flash", "cogview-3", "cogview-3-plus"],
              "default": "cogview-3-flash"
            },
            "prompt": { "type": "string" },
            "size": { "type": "string", "default": "1024x1024" }
          },
          "required": ["prompt", "model"]
        }
      }
    ],
    "meta": {
      "avatar": "🧠",
      "description": "智谱AI CogView 图像生成器",
      "tags": ["image", "zhipu", "cogview"],
      "title": "智谱AI 图像生成器"
    },
    "settings": {
      "type": "object",
      "required": ["ZHIPUAI_API_KEY"],
      "properties": {
        "ZHIPUAI_API_KEY": { "type": "string", "title": "API Key" }
      }
    },
    "version": "1"
  }),
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.ZHIPUAI_API_KEY;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "ZhipuAI API key is required.",
      });
    }

    const { prompt, size = "1024x1024", user_id, model } = body;

    if (!prompt || !model) {
      return NextResponse.json({ message: "Prompt and Model are required." }, { status: 400 });
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/images/generations`,
        { model, prompt, size, user_id },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const respData = response.data;
      const imageUrls: string[] = [];

      for (const img of respData.data) {
        const pUrl = await saveImageToStorage(img.url, "url", "zhipuai-image");
        imageUrls.push(pUrl);
      }

      return NextResponse.json({
        markdownResponse: formatImageMarkdown(imageUrls, {
          prompt,
          model,
          extraInfo: { "尺寸": size }
        })
      });
    } catch (error: any) {
      console.error("[ZhipuAI Plugin] Error:", error);
      return NextResponse.json(
        { message: error.response?.data?.error?.message || "Failed to generate image" },
        { status: error.response?.status || 500 }
      );
    }
  }
};
