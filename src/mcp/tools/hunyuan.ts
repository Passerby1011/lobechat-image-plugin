import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { hunyuanHandler } from '../../plugins/hunyuan/handler';

/**
 * 腾讯混元 MCP 工具定义
 */
export const hunyuanTools: Tool[] = [
  {
    name: 'hunyuan_generate_image',
    description: `使用腾讯混元模型生成图像。以极速生成著称，秒级出图。

**支持的模型**:
- hunyuan-lite: 极速同步版 (默认，秒级出图)
- hunyuan-standard: 标准版
- hunyuan-pro: 专业版 (最高画质)

**特色**: 极速响应、同步接口、企业级稳定`,
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
          enum: ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'],
          default: 'hunyuan-lite',
        },
        resolution: {
          type: 'string',
          description: '输出分辨率',
          enum: ['1024x1024', '1280x720', '720x1280', '1920x1080', '1080x1920'],
          default: '1024x1024',
        },
        negative_prompt: {
          type: 'string',
          description: '反向提示词',
        },
      },
      required: ['prompt'],
    },
  },
];

/**
 * 执行腾讯混元工具
 */
export async function executeHunyuanTool(
  toolName: string,
  args: Record<string, any>,
  secretId: string,
  secretKey: string
): Promise<any> {
  if (toolName !== 'hunyuan_generate_image') {
    throw new Error(`Unknown hunyuan tool: ${toolName}`);
  }

  const context = {
    body: {
      model: args.model || 'hunyuan-lite',
      prompt: args.prompt,
      resolution: args.resolution || '1024x1024',
      negative_prompt: args.negative_prompt,
    },
    settings: {
      TENCENT_SECRET_ID: secretId,
      TENCENT_SECRET_KEY: secretKey,
    },
  };

  const response = await hunyuanHandler.handle(context);
  return response.json();
}

export async function executeHunyuanFromUnified(
  args: Record<string, any>,
  secretId: string,
  secretKey: string
): Promise<any> {
  return executeHunyuanTool('hunyuan_generate_image', args, secretId, secretKey);
}
