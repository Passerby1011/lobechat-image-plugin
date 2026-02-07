import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allMcpTools, executeToolByName } from './tools';

/**
 * 创建 MCP Server 实例
 * 支持 stdio 和 Streamable HTTP 两种传输方式
 */
export function createMcpServer() {
  const server = new Server(
    {
      name: 'lobechat-image-plugins',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 列出所有可用工具
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allMcpTools,
  }));

  // 处理工具调用
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await executeToolByName(name, args || {});
      
      // 根据结果类型返回不同格式
      if (result.images && result.images.length > 0) {
        // 图像生成成功，返回图片 URL 和 Markdown
        return {
          content: [
            {
              type: 'text',
              text: result.markdownResponse || '',
            },
            // 如果有图片，也可以返回图片类型（MCP 支持）
            ...result.images.map((url: string) => ({
              type: 'image' as const,
              data: url,
              mimeType: 'image/png',
            })),
          ],
        };
      }
      
      // 普通结果
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' 
              ? result 
              : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`[MCP] Tool ${name} error:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message || 'Unknown error occurred'}`,
          },
        ],
        isError: true,
      };
    }
  });

  // 错误处理
  server.onerror = (error) => {
    console.error('[MCP Server Error]', error);
  };

  return server;
}
