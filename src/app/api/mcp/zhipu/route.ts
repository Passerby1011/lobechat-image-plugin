import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { zhipuTools, executeZhipuTool } from '@/mcp/tools/zhipu';

const config = {
  serverName: 'lobechat-zhipu-image',
  serverVersion: '1.0.0',
  tools: zhipuTools,
  executeToolByName: async (name: string, args: Record<string, any>) => {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ZHIPU_API_KEY. Please set it via environment variable or x-zhipu-api-key header.');
    }
    return executeZhipuTool(name, args, apiKey);
  },
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
