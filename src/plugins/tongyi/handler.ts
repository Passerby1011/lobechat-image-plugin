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
