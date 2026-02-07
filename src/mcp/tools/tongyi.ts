import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { tongyiHandler } from '../../plugins/tongyi/handler';

/**
 * 通义万相 MCP 工具定义
 */
export const tongyiTools: Tool[] = [
  {
    name: 'tongyi_generate_image',
    description: `使用阿里云通义万相生成图像。支持文生图、图生图、图像编辑等功能。

**支持的模型**:
- qwen-image-max: 最高画质文生图 (默认)
- qwen-image-plus: 高质量文生图
- qwen-image-edit-plus: 图像编辑与融合
- wan2.6-t2i: 最新版文生图
- wan2.6-image: 图生图

**特色功能**: 多图融合、风格迁移、智能编辑`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图像生成提示词，描述你想要生成的图像内容。支持中英文。',
        },
        model: {
          type: 'string',
          description: '模型名称',
          enum: [
            'qwen-image-max',
            'qwen-image-plus',
            'qwen-image-edit-plus',
            'wan2.6-t2i',
            'wan2.6-image',
            'z-image-turbo',
          ],
          default: 'qwen-image-max',
        },
        size: {
          type: 'string',
          description: '输出图像尺寸。qwen-image-max 默认 1664*928，wan2.6 默认 1280*1280。',
          default: '1024*1024',
        },
        reference_images: {
          type: 'array',
          items: { type: 'string' },
          description: '参考图 URL 列表。图像编辑模式下支持 1-3 张参考图。',
        },
        negative_prompt: {
          type: 'string',
          description: '反向提示词，描述不希望出现的内容。',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'tongyi_translate_image',
    description: `使用通义图像翻译功能。保持原图排版的高保真图像文字翻译。

**用途**: 翻译图片中的文字，保持原有布局和设计。
**支持语言**: 自动识别源语言，支持翻译为中文、英文、日文等。`,
    inputSchema: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: '需要翻译的图片 URL',
        },
        source_lang: {
          type: 'string',
          description: '源语言。auto 为自动识别。',
          enum: ['auto', 'zh', 'en', 'ja', 'ko'],
          default: 'auto',
        },
        target_lang: {
          type: 'string',
          description: '目标语言',
          enum: ['zh', 'en', 'ja', 'ko'],
          default: 'zh',
        },
      },
      required: ['image_url'],
    },
  },
];

/**
 * 执行通义万相工具
 */
export async function executeTongyiTool(
  toolName: string,
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  // 构造请求上下文
  const context = {
    body: {} as any,
    settings: {
      ALIBABA_API_KEY: apiKey,
    },
  };

  if (toolName === 'tongyi_generate_image') {
    context.body = {
      model: args.model || 'qwen-image-max',
      input: {
        prompt: args.prompt,
        images: args.reference_images || [],
        negative_prompt: args.negative_prompt,
      },
      parameters: {
        size: args.size || '1024*1024',
        n: 1,
      },
    };
  } else if (toolName === 'tongyi_translate_image') {
    context.body = {
      model: 'qwen-mt-image',
      image_url: args.image_url,
      parameters: {
        source_lang: args.source_lang || 'auto',
        target_lang: args.target_lang || 'zh',
      },
    };
  } else {
    throw new Error(`Unknown tongyi tool: ${toolName}`);
  }

  // 调用现有的 handler
  const response = await tongyiHandler.handle(context);
  return response.json();
}

/**
 * 执行通义万相（用于统一入口）
 */
export async function executeTongyiFromUnified(
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  return executeTongyiTool('tongyi_generate_image', args, apiKey);
}
