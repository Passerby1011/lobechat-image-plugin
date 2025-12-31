import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = "https://api.x.ai/v1";

export const xaiHandler: PluginHandler = {
  id: "xai-image",
  name: "xAI Image Generator",
  getManifest: () => ({
    "identifier": "xai-image",
    "api": [
      {
        "url": "/api/generate",
        "name": "generateImage",
        "description": "Generate an image using xAI API",
        "parameters": {
          "type": "object",
          "properties": {
            "model": {
              "type": "string",
              "description": "Model name",
              "default": "grok-2-image"
            },
            "prompt": {
              "type": "string",
              "description": "Image description"
            },
            "n": {
              "type": "integer",
              "description": "Number of images",
              "default": 1
            },
            "response_format": {
              "type": "string",
              "description": "Response format",
              "enum": ["url", "b64_json"],
              "default": "url"
            }
          },
          "required": ["prompt"]
        }
      }
    ],
    "meta": {
      "avatar": "𝕏",
      "description": "xAI Image Generator using Grok",
      "tags": ["image", "xai", "grok"],
      "title": "xAI 图像生成器"
    },
    "settings": {
      "type": "object",
      "required": ["XAI_API_KEY"],
      "properties": {
        "XAI_API_KEY": {
          "type": "string",
          "title": "xAI API Key"
        }
      }
    },
    "version": "1"
  }),
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.XAI_API_KEY;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "xAI API key is required.",
      });
    }

    const { prompt, model, n, response_format = "url" } = body;

    if (!prompt) {
      return NextResponse.json({ message: "Prompt is required." }, { status: 400 });
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/images/generations`,
        {
          model: model || "grok-2-image",
          prompt: prompt,
          n: n || 1,
          response_format: response_format
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const respData = response.data;
      const imageUrls: string[] = [];

      // 使用共享存储服务进行持久化
      for (const imageData of respData.data) {
        const source = response_format === "b64_json" ? imageData.b64_json : imageData.url;
        const permanentUrl = await saveImageToStorage(
          source,
          response_format === "b64_json" ? "b64_json" : "url",
          "xai-image"
        );
        imageUrls.push(permanentUrl);
      }

      // 使用共享 Markdown 服务格式化响应
      const markdownResponse = formatImageMarkdown(imageUrls, {
        prompt,
        revisedPrompt: respData.data[0]?.revised_prompt,
        model: model || "grok-2-image"
      });

      return NextResponse.json({ markdownResponse });
    } catch (error: any) {
      console.error("[xAI Plugin] Error:", error);
      return NextResponse.json(
        { message: error.response?.data?.error || "Failed to generate image" },
        { status: error.response?.status || 500 }
      );
    }
  }
};
