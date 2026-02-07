import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { zhipuHandler } from '../../plugins/zhipu/handler';

/**
 * 智谱 AI MCP 工具定义
 */
export const zhipuTools: Tool[] = [
  {
    name: 'zhipu_generate_image',
    description: `使用智谱 AI CogView 模型生成图像。以汉字精准生成著称。

**支持的模型**:
- cogview-4: 最新旗舰版 (默认)
- cogview-3-plus: 增强版
- cogview-3: 标准版

**特色**: 汉字精准生成、中文理解优秀、多尺寸支持`,
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '图像生成提示词。对中文描述有极好的理解能力。',
        },
        model: {
          type: 'string',
          description: '模型名称',
          enum: ['cogview-4', 'cogview-3-plus', 'cogview-3'],
          default: 'cogview-4',
        },
        size: {
          type: 'string',
          description: '输出图像尺寸',
          enum: ['1024x1024', '768x1344', '1344x768', '864x1152', '1152x864'],
          default: '1024x1024',
        },
      },
      required: ['prompt'],
    },
  },
];

/**
 * 执行智谱 AI 工具
 */
export async function executeZhipuTool(
  toolName: string,
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  if (toolName !== 'zhipu_generate_image') {
    throw new Error(`Unknown zhipu tool: ${toolName}`);
  }

  const context = {
    body: {
      model: args.model || 'cogview-4',
      prompt: args.prompt,
      size: args.size || '1024x1024',
    },
    settings: {
      ZHIPU_API_KEY: apiKey,
    },
  };

  const response = await zhipuHandler.handle(context);
  return response.json();
}

export async function executeZhipuFromUnified(
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  return executeZhipuTool('zhipu_generate_image', args, apiKey);
}
