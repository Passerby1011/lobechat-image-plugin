import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { hunyuanTools, executeHunyuanTool } from '@/mcp/tools/hunyuan';

const config = {
  serverName: 'lobechat-hunyuan-image',
  serverVersion: '1.0.0',
  tools: hunyuanTools,
  executeToolByName: async (name: string, args: Record<string, any>) => {
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;
    if (!secretId || !secretKey) {
      throw new Error('Missing TENCENT_SECRET_ID or TENCENT_SECRET_KEY. Please set them via environment variables or x-tencent-secret-id/x-tencent-secret-key headers.');
    }
    return executeHunyuanTool(name, args, secretId, secretKey);
  },
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
