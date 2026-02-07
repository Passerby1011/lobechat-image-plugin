import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { siliconflowTools, executeSiliconflowTool } from '@/mcp/tools/siliconflow';

const config = {
  serverName: 'lobechat-siliconflow-image',
  serverVersion: '1.0.0',
  tools: siliconflowTools,
  executeToolByName: async (name: string, args: Record<string, any>) => {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      throw new Error('Missing SILICONFLOW_API_KEY. Please set it via environment variable or x-siliconflow-api-key header.');
    }
    return executeSiliconflowTool(name, args, apiKey);
  },
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
