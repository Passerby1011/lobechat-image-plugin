import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

// 会话存储 (生产环境应使用 Redis)
const sessions = new Map<string, any>();
const SESSION_HEADER = 'mcp-session-id';
const SESSION_TTL = 30 * 60 * 1000; // 30 分钟

// 定期清理过期会话
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
      if (now - session.lastAccess > SESSION_TTL) {
        sessions.delete(sessionId);
        console.log(`[MCP HTTP] Session ${sessionId} expired`);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * MCP HTTP 处理器配置
 */
export interface McpHttpConfig {
  /** 服务器名称 */
  serverName: string;
  /** 服务器版本 */
  serverVersion?: string;
  /** 可用的工具列表 */
  tools: Tool[];
  /** 工具执行函数 */
  executeToolByName: (name: string, args: Record<string, any>) => Promise<any>;
}

/**
 * 从请求头提取 API Keys
 */
function extractApiKeysFromHeaders(req: NextRequest): Record<string, string> {
  const keys: Record<string, string> = {};
  
  const keyMappings: Record<string, string> = {
    'x-alibaba-api-key': 'ALIBABA_API_KEY',
    'x-ark-api-key': 'ARK_API_KEY',
    'x-siliconflow-api-key': 'SILICONFLOW_API_KEY',
    'x-tencent-secret-id': 'TENCENT_SECRET_ID',
    'x-tencent-secret-key': 'TENCENT_SECRET_KEY',
    'x-zhipu-api-key': 'ZHIPU_API_KEY',
    'x-xai-api-key': 'XAI_API_KEY',
    'x-blob-token': 'BLOB_READ_WRITE_TOKEN',
  };
  
  for (const [header, envKey] of Object.entries(keyMappings)) {
    const value = req.headers.get(header);
    if (value) {
      keys[envKey] = value;
    }
  }
  
  return keys;
}

/**
 * 创建 MCP HTTP POST 处理器
 */
export function createMcpPostHandler(config: McpHttpConfig) {
  return async function POST(req: NextRequest) {
    try {
      // 从请求头提取 API Keys 并注入到 process.env
      const headerKeys = extractApiKeysFromHeaders(req);
      for (const [key, value] of Object.entries(headerKeys)) {
        process.env[key] = value;
      }

      const body = await req.json();
      const sessionId = req.headers.get(SESSION_HEADER);
      
      const { method, params, id } = body;

      // 处理通知类消息
      if (method && method.startsWith('notifications/')) {
        console.log(`[MCP HTTP] [${config.serverName}] Notification: ${method}`);
        return new NextResponse(null, { 
          status: 202,
          headers: { [SESSION_HEADER]: sessionId || '' },
        });
      }

      // 初始化请求
      if (method === 'initialize') {
        const newSessionId = randomUUID();
        
        sessions.set(newSessionId, {
          serverName: config.serverName,
          lastAccess: Date.now(),
        });

        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: config.serverName,
                version: config.serverVersion || '1.0.0',
              },
              capabilities: {
                tools: {},
              },
            },
          },
          {
            headers: {
              [SESSION_HEADER]: newSessionId,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // 其他请求需要有效会话
      if (!sessionId || !sessions.has(sessionId)) {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32600,
              message: 'Invalid session. Please initialize first.',
            },
          },
          { status: 400 }
        );
      }

      const session = sessions.get(sessionId)!;
      session.lastAccess = Date.now();

      // 列出工具
      if (method === 'tools/list') {
        return NextResponse.json(
          {
            jsonrpc: '2.0',
            id,
            result: { tools: config.tools },
          },
          {
            headers: {
              [SESSION_HEADER]: sessionId,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // 调用工具
      if (method === 'tools/call') {
        const { name, arguments: args } = params;

        try {
          const result = await config.executeToolByName(name, args || {});
          
          let content;
          if (result.images && result.images.length > 0) {
            content = [
              {
                type: 'text',
                text: result.markdownResponse || JSON.stringify(result, null, 2),
              },
            ];
          } else {
            content = [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
              },
            ];
          }

          return NextResponse.json(
            {
              jsonrpc: '2.0',
              id,
              result: { content },
            },
            {
              headers: {
                [SESSION_HEADER]: sessionId,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (error: any) {
          return NextResponse.json(
            {
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
              },
            },
            {
              headers: {
                [SESSION_HEADER]: sessionId,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }

      // 未知方法
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        },
        { status: 400 }
      );
    } catch (error: any) {
      console.error(`[MCP HTTP] [${config.serverName}] Error:`, error);
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message: error.message || 'Internal error' },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 创建 MCP HTTP DELETE 处理器
 */
export function createMcpDeleteHandler() {
  return async function DELETE(req: NextRequest) {
    const sessionId = req.headers.get(SESSION_HEADER);

    if (sessionId && sessions.has(sessionId)) {
      sessions.delete(sessionId);
      console.log(`[MCP HTTP] Session ${sessionId} closed`);
    }

    return new NextResponse(null, { status: 204 });
  };
}

/**
 * 创建 MCP HTTP OPTIONS 处理器
 */
export function createMcpOptionsHandler() {
  return async function OPTIONS() {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': [
          'Content-Type',
          'mcp-session-id',
          'x-alibaba-api-key',
          'x-ark-api-key',
          'x-siliconflow-api-key',
          'x-tencent-secret-id',
          'x-tencent-secret-key',
          'x-zhipu-api-key',
          'x-xai-api-key',
          'x-blob-token',
        ].join(', '),
      },
    });
  };
}
