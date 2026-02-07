import { createMcpPostHandler, createMcpDeleteHandler, createMcpOptionsHandler } from '@/mcp/http-handler';
import { allMcpTools, executeToolByName } from '@/mcp/tools';

/**
 * 统一 MCP 端点 - 包含所有平台的工具
 * 
 * 端点: /api/mcp
 * 
 * 包含工具:
 * - generate_image (统一入口，推荐使用)
 * - tongyi_generate_image, tongyi_translate_image
 * - doubao_generate_image, doubao_edit_image
 * - siliconflow_generate_image
 * - hunyuan_generate_image
 * - zhipu_generate_image
 * - xai_generate_image
 * 
 * 单独平台端点:
 * - /api/mcp/tongyi
 * - /api/mcp/doubao
 * - /api/mcp/siliconflow
 * - /api/mcp/hunyuan
 * - /api/mcp/zhipu
 * - /api/mcp/xai
 */
const config = {
  serverName: 'lobechat-image-plugins',
  serverVersion: '1.0.0',
  tools: allMcpTools,
  executeToolByName: executeToolByName,
};

export const POST = createMcpPostHandler(config);
export const DELETE = createMcpDeleteHandler();
export const OPTIONS = createMcpOptionsHandler();
