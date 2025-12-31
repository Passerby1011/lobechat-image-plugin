import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

export const tongyiHandler: PluginHandler = {
  id: "tongyi-image",
  name: "通义万相图像生成器",
  getManifest: () => ({
    "identifier": "tongyi-image",
    "api": [
      {
        "url": "/api/generate",
        "name": "generateImage",
        "description": "Generate an image based on the given prompt using Alibaba's Tongyi Wanxiang model",
        "parameters": {
          "type": "object",
          "properties": {
            "model": {
              "type": "string",
              "description": "The model name to use for image generation",
              "default": "wanx2.1-t2i-turbo",
              "enum": [
                "wanx2.1-t2i-turbo",
                "wanx2.1-t2i-plus",
                "wanx2.0-t2i-turbo"
              ]
            },
            "input": {
              "type": "object",
              "properties": {
                "prompt": {
                  "type": "string",
                  "description": "Positive prompt describing elements and visual features desired in the generated image. Supports Chinese and English, up to 800 characters"
                },
                "negative_prompt": {
                  "type": "string",
                  "description": "Negative prompt describing elements you don't want in the image. Supports Chinese and English, up to 500 characters"
                }
              },
              "required": ["prompt"]
            },
            "parameters": {
              "type": "object",
              "properties": {
                "size": {
                  "type": "string",
                  "description": "Resolution of the output image. Width and height should be between 768 and 1440 pixels, up to 2 million pixels total",
                  "default": "1024*1024"
                },
                "n": {
                  "type": "integer",
                  "description": "Number of images to generate, between 1 and 4",
                  "minimum": 1,
                  "maximum": 4,
                  "default": 1
                },
                "seed": {
                  "type": "integer",
                  "description": "Random seed to control generation randomness. Range: [0, 2147483647]",
                  "minimum": 0,
                  "maximum": 2147483647
                },
                "prompt_extend": {
                  "type": "boolean",
                  "description": "Whether to enable intelligent prompt rewriting for better results. Only affects positive prompts",
                  "default": true
                }
              }
            }
          },
          "required": ["model","input"]
        }
      }
    ],
    "meta": {
      "avatar": "🎉",
      "description": "该插件利用阿里巴巴的通义万相模型，根据文本提示生成图像。",
      "tags": ["image", "generator", "tongyi", "wanxiang", "alibaba"],
      "title": "通义万相图像生成器"
    },
    "settings": {
      "type": "object",
      "required": ["ALIBABA_API_KEY"],
      "properties": {
        "ALIBABA_API_KEY": {
          "type": "string",
          "title": "Alibaba API Key",
          "description": "用于使用阿里通义万相模型的API密钥"
        }
      }
    },
    "version": "1",
    "systemRole": "该插件利用阿里巴巴的通义万象模型，根据文本提示生成图像。"
  }),
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.ALIBABA_API_KEY;

    if (!apiKey) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: 'Alibaba API Key is required.',
      });
    }

    const { model, input, parameters } = body;
    const requestParameters = {
      size: '1024*1024',
      n: 1,
      prompt_extend: true,
      ...parameters
    };

    try {
      // 1. 发起生成任务
      const response = await axios.post(
        `${BASE_URL}/services/aigc/text2image/image-synthesis`,
        { model, input, parameters: requestParameters },
        {
          headers: {
            'X-DashScope-Async': 'enable',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status !== 200) {
        return NextResponse.json({ message: 'Failed to start image generation.' }, { status: response.status });
      }

      const taskId = response.data.output.task_id;
      let statusData: any;

      // 2. 轮询状态
      do {
        const statusResponse = await axios.get(`${BASE_URL}/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        statusData = statusResponse.data;
        if (statusData.output.task_status === 'FAILED') break;
        if (statusData.output.task_status !== 'SUCCEEDED') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } while (statusData.output.task_status === 'RUNNING' || statusData.output.task_status === 'PENDING');

      if (statusData.output.task_status !== 'SUCCEEDED') {
        return NextResponse.json({ message: 'Image generation failed or timed out.' }, { status: 500 });
      }

      // 3. 持久化结果
      const results = statusData.output.results || [];
      const imageUrls: string[] = [];
      for (const res of results) {
        const permanentUrl = await saveImageToStorage(res.url, "url", "tongyi-image");
        imageUrls.push(permanentUrl);
      }

      // 4. 格式化响应
      const markdownResponse = formatImageMarkdown(imageUrls, {
        prompt: input.prompt,
        model: model,
        extraInfo: {
          "尺寸": requestParameters.size,
          "反向提示词": input.negative_prompt || "无"
        }
      });

      return NextResponse.json({ markdownResponse });
    } catch (error: any) {
      console.error("[Tongyi Plugin] Error:", error);
      return NextResponse.json(
        { message: error.response?.data?.message || "Internal Error" },
        { status: 500 }
      );
    }
  }
};
