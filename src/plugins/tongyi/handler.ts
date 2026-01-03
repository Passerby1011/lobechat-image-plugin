import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

/**
 * 通义系列模型配置与参数校验
 */
const TONGYI_CONFIG = {
  // 同步接口模型 (Qwen-Image, Wan2.6-T2I, Z-Image)
  SYNC: [
    'qwen-image-max',
    'qwen-image-plus',
    'qwen-image',
    'wan2.6-t2i',
    'z-image-turbo'
  ],
  // 异步接口模型 (Wan2.5, Wan2.2, Qwen-MT-Image)
  ASYNC: [
    'wan2.5-t2i-preview',
    'wan2.2-t2i-flash',
    'qwen-mt-image'
  ],
  // 复杂/编辑类模型 (Qwen-Image-Edit, Wan2.6-Image)
  COMPLEX: [
    'qwen-image-edit-plus',
    'wan2.6-image'
  ]
};

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

    // --- 参数预处理与校验 ---
    const model = body.model || 'qwen-image-max';
    const input = body.input || {};
    const parameters = body.parameters || {};

    // 统一获取提示词 (处理同步接口的多模态格式和普通格式)
    const prompt = input.prompt || (input.messages?.[0]?.content?.find((c: any) => c.text)?.text);
    // 统一获取参考图
    const refImages = input.images || input.messages?.[0]?.content?.filter((c: any) => c.image).map((c: any) => c.image) || [];

    // 必填项校验
    if (!prompt && model !== 'qwen-mt-image') {
      return NextResponse.json({ message: '参数 prompt (提示词) 缺失。' }, { status: 400 });
    }

    try {
      let imageUrls: string[] = [];
      let finalPrompt = prompt;

      // --- 根据模型分发逻辑 ---
      if (model === 'qwen-mt-image') {
        // --- 模式 1: 图像翻译 (异步) ---
        const image_url = refImages[0] || body.image_url;
        if (!image_url) return NextResponse.json({ message: '图像翻译模式必须提供参考图 (image_url)。' }, { status: 400 });

        const response = await fetch(`${BASE_URL}/services/aigc/image2image/image-synthesis`, {
          method: 'POST',
          headers: {
            'X-DashScope-Async': 'enable',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen-mt-image',
            input: {
              image_url,
              source_lang: parameters.source_lang || 'auto',
              target_lang: parameters.target_lang || 'zh'
            }
          })
        });

        const initialData = await response.json();
        if (!response.ok) throw new Error(initialData.message || '翻译任务启动失败');
        
        const results = await pollTaskStatus(initialData.output.task_id, apiKey);
        
        // 图像翻译的结果处理 (兼容数组和单个对象返回)
        const items = Array.isArray(results) ? results : [results];
        for (const res of items) {
          const url = res.url || res.image_url;
          if (url) {
            const pUrl = await saveImageToStorage(url, "url", "tongyi-translate");
            imageUrls.push(pUrl);
          }
        }
        finalPrompt = `图像翻译 [${parameters.source_lang || 'auto'} -> ${parameters.target_lang || 'zh'}]`;

      } else if (TONGYI_CONFIG.SYNC.includes(model) || TONGYI_CONFIG.COMPLEX.includes(model)) {
        // --- 模式 2: 多模态生成与编辑 (同步接口) ---
        const contents: any[] = [];
        // 添加参考图
        refImages.forEach((img: string) => contents.push({ image: img }));
        // 添加文本描述
        if (prompt) contents.push({ text: prompt });

        const requestBody: any = {
          model,
          input: {
            messages: [{ role: "user", content: contents }]
          },
          parameters: {
            // 针对不同模型的默认分辨率兜底
            size: parameters.size || (model.includes('wan') ? '1280*1280' : (model === 'qwen-image-max' ? '1664*928' : '1024*1024')),
            n: parameters.n || 1,
            prompt_extend: parameters.prompt_extend ?? true,
            ...parameters
          }
        };

        const response = await fetch(`${BASE_URL}/services/aigc/multimodal-generation/generation`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (!response.ok) {
          return NextResponse.json({ message: data.message || '图像生成失败' }, { status: response.status });
        }

        const choices = data.output?.choices || [];
        for (const choice of choices) {
          const items = choice.message?.content || [];
          for (const item of items) {
            if (item.type === 'image') {
              const permanentUrl = await saveImageToStorage(item.image, "url", "tongyi-image");
              imageUrls.push(permanentUrl);
            }
          }
        }
      } else if (TONGYI_CONFIG.ASYNC.includes(model)) {
        // --- 模式 3: 传统异步接口 (Wan2.5, Wan2.2) ---
        const response = await fetch(`${BASE_URL}/services/aigc/text2image/image-synthesis`, {
          method: 'POST',
          headers: {
            'X-DashScope-Async': 'enable',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            model, 
            input: input.prompt ? input : { prompt }, 
            parameters: { size: '1024*1024', n: 1, prompt_extend: true, ...parameters }
          })
        });

        const initialData = await response.json();
        if (!response.ok) throw new Error(initialData.message || '异步任务提交失败');

        const results = await pollTaskStatus(initialData.output.task_id, apiKey);
        for (const res of results) {
          const pUrl = await saveImageToStorage(res.url, "url", "tongyi-image");
          imageUrls.push(pUrl);
        }
      } else {
        return NextResponse.json({ message: `模型 ${model} 不在支持列表中。` }, { status: 400 });
      }

      if (imageUrls.length === 0) return NextResponse.json({ message: '未获取到生成的图片数据。' }, { status: 500 });

      // --- 格式化响应 ---
      const markdownResponse = formatImageMarkdown(imageUrls, {
        prompt: finalPrompt,
        model: model,
        extraInfo: {
          "尺寸": parameters.size || "默认",
          "反向提示词": input.negative_prompt || "无",
          "参考图数量": refImages.length
        }
      });

      return NextResponse.json({ 
        markdownResponse,
        images: imageUrls,
        metadata: {
          prompt: finalPrompt,
          model,
          extraInfo: { "尺寸": parameters.size || "默认", "参考图数量": refImages.length }
        }
      });
    } catch (error: any) {
      console.error("[Tongyi Plugin] Error:", error);
      return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
  }
};

/**
 * 轮询任务状态
 */
async function pollTaskStatus(taskId: string, apiKey: string): Promise<any> {
  let statusData: any;
  let retryCount = 0;
  const maxRetries = 60; // 约 90 秒超时

  do {
    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    statusData = await response.json();
    
    if (!statusData || !statusData.output) {
      throw new Error('通义 API 响应格式异常');
    }

    if (statusData.output.task_status === 'FAILED') {
      // 这里的报错通常就是模型层透传的错误
      const errorMsg = statusData.output.message || statusData.output.code || '任务执行失败 (FAILED)';
      throw new Error(`通义 API 报错: ${errorMsg}`);
    }
    
    if (statusData.output.task_status === 'SUCCEEDED') break;

    await new Promise((resolve) => setTimeout(resolve, 1500));
    retryCount++;
  } while (retryCount < maxRetries && (statusData.output.task_status === 'RUNNING' || statusData.output.task_status === 'PENDING'));
  
  if (statusData.output.task_status !== 'SUCCEEDED') {
    throw new Error('任务查询超时');
  }

  // 图像翻译的结果可能直接在 output 中，也可能在 results 数组中
  return statusData.output.results || statusData.output;
}
