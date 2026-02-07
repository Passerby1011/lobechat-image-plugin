import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { doubaoTools, executeDoubaoTool } from '@/mcp/tools/doubao';

const config = {
  serverName: 'lobechat-doubao-image',
  serverVersion: '1.0.0',
  tools: doubaoTools,
  executeToolByName: async (name: string, args: Record<string, any>) => {
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ARK_API_KEY. Please set it via environment variable or x-ark-api-key header.');
    }
    return executeDoubaoTool(name, args, apiKey);
  },
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
