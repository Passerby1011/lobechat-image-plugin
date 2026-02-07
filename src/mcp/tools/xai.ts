import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { xaiHandler } from '../../plugins/xai/handler';

/**
 * xAI MCP 工具定义
 */
export const xaiTools: Tool[] = [
  {
    name: 'xai_generate_image',
    description: `使用 xAI Grok 模型生成图像。以创意视觉生成著称。

**支持的模型**:
- grok-2-image: Grok 2 图像生成 (默认)

**特色**: 创意生成、独特风格、快速响应`,
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
          enum: ['grok-2-image'],
          default: 'grok-2-image',
        },
        n: {
          type: 'number',
          description: '生成图像数量',
          default: 1,
          minimum: 1,
          maximum: 4,
        },
      },
      required: ['prompt'],
    },
  },
];

/**
 * 执行 xAI 工具
 */
export async function executeXaiTool(
  toolName: string,
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  if (toolName !== 'xai_generate_image') {
    throw new Error(`Unknown xai tool: ${toolName}`);
  }

  const context = {
    body: {
      model: args.model || 'grok-2-image',
      prompt: args.prompt,
      n: args.n || 1,
    },
    settings: {
      XAI_API_KEY: apiKey,
    },
  };

  const response = await xaiHandler.handle(context);
  return response.json();
}

export async function executeXaiFromUnified(
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  return executeXaiTool('xai_generate_image', args, apiKey);
}
