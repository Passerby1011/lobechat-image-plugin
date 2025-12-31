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
  getManifest: () => ({
    "identifier": "siliconflow-image",
    "api": [
      {
        "url": "/api/generate",
        "name": "generateImage",
        "description": "使用SiliconFlow的图像生成API，根据文本提示生成图片",
        "parameters": {
          "type": "object",
          "properties": {
            "model": {
              "type": "string",
              "description": "使用的模型名称",
              "enum": [
                "black-forest-labs/FLUX.1-schnell",
                "black-forest-labs/FLUX.1-dev",
                "black-forest-labs/FLUX.1-pro"
              ],
              "default": "black-forest-labs/FLUX.1-schnell"
            },
            "prompt": {
              "type": "string",
              "description": "用于生成图片的文本描述",
              "minLength": 1
            },
            "negative_prompt": {
              "type": "string",
              "description": "负向提示，用于排除不希望出现的图像元素"
            },
            "image_size": {
              "type": "string",
              "description": "图像的尺寸大小，格式为宽x高",
              "enum": [
                "1024x1024",
                "960x1280",
                "768x1024",
                "720x1440",
                "720x1280"
              ],
              "default": "1024x1024"
            },
            "seed": {
              "type": "integer",
              "description": "随机数种子，用于控制生成图像的随机性",
              "minimum": 1,
              "maximum": 9999999999
            },
            "num_inference_steps": {
              "type": "integer",
              "description": "推理步数，控制生成的图像与提示的匹配程度，范围为1-50",
              "minimum": 1,
              "maximum": 50,
              "default": 20
            }
          },
          "required": ["prompt", "model", "image_size"]
        }
      }
    ],
    "meta": {
      "avatar": "🎨",
      "description": "此插件使用SiliconFlow的图像生成API，根据文本提示生成高质量图像。",
      "tags": ["图片", "生成", "FLUX", "SiliconFlow"],
      "title": "SiliconFlow 图像生成器"
    },
    "settings": {
      "type": "object",
      "required": ["SILICONFLOW_API_KEY"],
      "properties": {
        "SILICONFLOW_API_KEY": {
          "type": "string",
          "title": "SiliconFlow API 令牌",
          "description": "用于调用SiliconFlow图像生成API的Bearer Token"
        }
      }
    },
    "version": "1",
    "systemRole": "此插件使用SiliconFlow的图像生成API，根据文本提示生成图像。注意：生成的图像URL已持久化存储。"
  }),
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
