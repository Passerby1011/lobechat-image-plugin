import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { tongyiTools, executeTongyiTool } from '@/mcp/tools/tongyi';

const config = {
  serverName: 'lobechat-tongyi-image',
  serverVersion: '1.0.0',
  tools: tongyiTools,
  executeToolByName: async (name: string, args: Record<string, any>) => {
    const apiKey = process.env.ALIBABA_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ALIBABA_API_KEY. Please set it via environment variable or x-alibaba-api-key header.');
    }
    return executeTongyiTool(name, args, apiKey);
  },
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
