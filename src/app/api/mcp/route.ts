import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// 动态导入 MCP 模块（避免服务端/客户端冲突）
let mcpServerModule: any = null;

async function getMcpServer() {
  if (!mcpServerModule) {
    mcpServerModule = await import('@/mcp/server');
  }
  return mcpServerModule.createMcpServer();
}

// 会话存储 (生产环境应使用 Redis)
const sessions = new Map<string, any>();
const SESSION_HEADER = 'mcp-session-id';
const SESSION_TTL = 30 * 60 * 1000; // 30 分钟

// 定期清理过期会话
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccess > SESSION_TTL) {
      sessions.delete(sessionId);
      console.log(`[MCP HTTP] Session ${sessionId} expired`);
    }
  }
}, 5 * 60 * 1000); // 每 5 分钟清理一次

/**
 * 从请求头提取 API Keys
 * 支持通过 HTTP Headers 传递各平台的 API Key
 */
function extractApiKeysFromHeaders(req: NextRequest): Record<string, string> {
  const keys: Record<string, string> = {};
  
  // 支持的 API Key Headers
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
 * POST /api/mcp - 处理 MCP JSON-RPC 请求
 * 
 * 支持的方法:
 * - initialize: 初始化会话
 * - tools/list: 列出可用工具
 * - tools/call: 调用工具
 * 
 * API Key 传递方式:
 * 1. 通过 Vercel 环境变量（部署时配置）
 * 2. 通过 HTTP Headers（运行时传递）:
 *    - x-alibaba-api-key: 阿里云 API Key
 *    - x-ark-api-key: 火山引擎 API Key
 *    - x-siliconflow-api-key: 硅基流动 API Key
 *    - x-tencent-secret-id: 腾讯云 Secret ID
 *    - x-tencent-secret-key: 腾讯云 Secret Key
 *    - x-zhipu-api-key: 智谱 API Key
 *    - x-xai-api-key: xAI API Key
 */
export async function POST(req: NextRequest) {
  try {
    // 验证 Origin (防止 DNS 重绑定攻击)
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    // 本地开发时跳过 Origin 检查
    if (origin && !origin.includes('localhost') && !origin.includes(host || '')) {
      console.warn(`[MCP HTTP] Suspicious origin: ${origin}`);
      // 生产环境可启用严格检查
      // return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }

    // 从请求头提取 API Keys 并注入到 process.env
    const headerKeys = extractApiKeysFromHeaders(req);
    for (const [key, value] of Object.entries(headerKeys)) {
      process.env[key] = value;
    }

    const body = await req.json();
    const sessionId = req.headers.get(SESSION_HEADER);
    
    // 处理 JSON-RPC 请求
    const { method, params, id } = body;

    // 处理通知类消息（notifications）- 不需要返回响应
    // MCP 协议中通知消息没有 id 字段
    if (method && method.startsWith('notifications/')) {
      // 通知消息：notifications/initialized, notifications/cancelled 等
      // 直接返回空响应，状态码 202 Accepted
      console.log(`[MCP HTTP] Received notification: ${method}`);
      return new NextResponse(null, { 
        status: 202,
        headers: {
          [SESSION_HEADER]: sessionId || '',
        },
      });
    }

    // 初始化请求 - 创建新会话
    if (method === 'initialize') {
      const newSessionId = randomUUID();
      const server = await getMcpServer();
      
      sessions.set(newSessionId, {
        server,
        lastAccess: Date.now(),
      });

      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'lobechat-image-plugins',
              version: '1.0.0',
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
      const { allMcpTools } = await import('@/mcp/tools/index');
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id,
          result: {
            tools: allMcpTools,
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

    // 调用工具
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      const { executeToolByName } = await import('@/mcp/tools/index');

      try {
        const result = await executeToolByName(name, args || {});
        
        // 格式化响应
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
              content: [
                {
                  type: 'text',
                  text: `Error: ${error.message}`,
                },
              ],
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
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[MCP HTTP] Error:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mcp - SSE 端点（用于服务端推送，可选）
 */
export async function GET(req: NextRequest) {
  const sessionId = req.headers.get(SESSION_HEADER);

  if (!sessionId || !sessions.has(sessionId)) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 400 }
    );
  }

  // 更新会话访问时间
  const session = sessions.get(sessionId)!;
  session.lastAccess = Date.now();

  // 返回 SSE 流（用于服务端主动推送通知）
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 发送心跳保持连接
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // 监听关闭
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      [SESSION_HEADER]: sessionId,
    },
  });
}

/**
 * DELETE /api/mcp - 关闭会话
 */
export async function DELETE(req: NextRequest) {
  const sessionId = req.headers.get(SESSION_HEADER);

  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log(`[MCP HTTP] Session ${sessionId} closed`);
  }

  return new NextResponse(null, { status: 204 });
}

/**
 * OPTIONS - CORS 预检
 */
export async function OPTIONS() {
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
}
