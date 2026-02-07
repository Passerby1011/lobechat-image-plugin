import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { doubaoHandler } from '../../plugins/doubao/handler';

/**
 * 豆包 (字节跳动) MCP 工具定义
 */
export const doubaoTools: Tool[] = [
  {
    name: 'doubao_generate_image',
    description: `使用字节跳动豆包 Seedream 模型生成图像。以高质量创意图著称。

**支持的模型**:
- seedream-3.0: 最新版创意生图 (默认)
- seedream-2.0: 稳定版

**特色功能**: 组图连贯生成、高质量创意图、多样化风格`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图像生成提示词',
        },
        model: {
          type: 'string',
          description: '模型名称',
          enum: ['seedream-3.0', 'seedream-2.0'],
          default: 'seedream-3.0',
        },
        size: {
          type: 'string',
          description: '输出图像尺寸',
          default: '1024*1024',
        },
        aspect_ratio: {
          type: 'string',
          description: '宽高比，如 "16:9"、"1:1"、"9:16"',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
        },
        negative_prompt: {
          type: 'string',
          description: '反向提示词',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'doubao_edit_image',
    description: `使用豆包 SeedEdit 进行图像编辑。

**功能**: 基于参考图进行智能编辑、风格迁移、局部修改等。`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '编辑指令，描述如何修改图像',
        },
        image_url: {
          type: 'string',
          description: '需要编辑的原图 URL',
        },
        edit_mode: {
          type: 'string',
          description: '编辑模式',
          enum: ['style_transfer', 'inpaint', 'outpaint'],
          default: 'style_transfer',
        },
      },
      required: ['prompt', 'image_url'],
    },
  },
];

/**
 * 执行豆包工具
 */
export async function executeDoubaoTool(
  toolName: string,
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  const context = {
    body: {} as any,
    settings: {
      ARK_API_KEY: apiKey,
    },
  };

  if (toolName === 'doubao_generate_image') {
    context.body = {
      model: args.model || 'seedream-3.0',
      prompt: args.prompt,
      size: args.size || '1024*1024',
      aspect_ratio: args.aspect_ratio,
      negative_prompt: args.negative_prompt,
    };
  } else if (toolName === 'doubao_edit_image') {
    context.body = {
      model: 'seededit-3.0',
      prompt: args.prompt,
      image_url: args.image_url,
      edit_mode: args.edit_mode || 'style_transfer',
    };
  } else {
    throw new Error(`Unknown doubao tool: ${toolName}`);
  }

  const response = await doubaoHandler.handle(context);
  return response.json();
}

/**
 * 执行豆包（用于统一入口）
 */
export async function executeDoubaoFromUnified(
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  return executeDoubaoTool('doubao_generate_image', args, apiKey);
}
