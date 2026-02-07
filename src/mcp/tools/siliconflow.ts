import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { siliconflowHandler } from '../../plugins/siliconflow/handler';

/**
 * 硅基流动 MCP 工具定义
 */
export const siliconflowTools: Tool[] = [
  {
    name: 'siliconflow_generate_image',
    description: `使用硅基流动平台生成图像。支持 FLUX、Stable Diffusion、可图等多种开源模型。

**支持的模型**:
- flux-1-schnell: FLUX 快速版 (默认)
- flux-1-dev: FLUX 开发版
- stable-diffusion-xl: SDXL 模型
- kolors: 可图模型

**特色**: 开源模型、多样化风格、高性价比`,
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
          enum: ['flux-1-schnell', 'flux-1-dev', 'stable-diffusion-xl', 'kolors'],
          default: 'flux-1-schnell',
        },
        size: {
          type: 'string',
          description: '输出图像尺寸',
          default: '1024*1024',
        },
        steps: {
          type: 'number',
          description: '推理步数，越高质量越好但速度越慢',
          default: 20,
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
 * 执行硅基流动工具
 */
export async function executeSiliconflowTool(
  toolName: string,
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  if (toolName !== 'siliconflow_generate_image') {
    throw new Error(`Unknown siliconflow tool: ${toolName}`);
  }

  const context = {
    body: {
      model: args.model || 'flux-1-schnell',
      prompt: args.prompt,
      size: args.size || '1024*1024',
      steps: args.steps || 20,
      negative_prompt: args.negative_prompt,
    },
    settings: {
      SILICONFLOW_API_KEY: apiKey,
    },
  };

  const response = await siliconflowHandler.handle(context);
  return response.json();
}

export async function executeSiliconflowFromUnified(
  args: Record<string, any>,
  apiKey: string
): Promise<any> {
  return executeSiliconflowTool('siliconflow_generate_image', args, apiKey);
}
