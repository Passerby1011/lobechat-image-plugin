import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { xaiTools, executeXaiTool } from '@/mcp/tools/xai';

const config = {
  serverName: 'lobechat-xai-image',
  serverVersion: '1.0.0',
  tools: xaiTools,
  executeToolByName: async (name: string, args: Record<string, any>) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing XAI_API_KEY. Please set it via environment variable or x-xai-api-key header.');
    }
    return executeXaiTool(name, args, apiKey);
  },
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
