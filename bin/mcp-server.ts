#!/usr/bin/env node
/**
 * MCP Server stdio 入口
 * 用于 Claude Desktop、Cursor 等本地 MCP 客户端
 * 
 * 使用方法:
 * 1. 编译: npm run build:mcp
 * 2. 运行: node dist/bin/mcp-server.js
 * 
 * 或配置到 MCP 客户端的 settings 中
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from '../src/mcp/server.js';

async function main() {
  console.error('🎨 LobeChat Image Plugins MCP Server');
  console.error('========================================');
  console.error('');
  
  // 检查必要的环境变量
  const requiredEnvVars = [
    'ALIBABA_API_KEY',
    'ARK_API_KEY', 
    'SILICONFLOW_API_KEY',
    'TENCENT_SECRET_ID',
    'TENCENT_SECRET_KEY',
    'ZHIPU_API_KEY',
    'XAI_API_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error('⚠️  警告: 以下 API Key 未配置，对应平台将不可用:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('');
    console.error('💡 提示: 在 MCP 配置的 env 中设置这些变量');
    console.error('');
  }

  // 检查 Blob 存储
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('⚠️  BLOB_READ_WRITE_TOKEN 未配置，图片可能无法持久化');
    console.error('');
  }

  try {
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    console.error('✅ MCP Server 已启动 (stdio 模式)');
    console.error('');
    console.error('📦 可用工具:');
    console.error('   - generate_image (统一入口，推荐)');
    console.error('   - tongyi_generate_image');
    console.error('   - tongyi_translate_image');
    console.error('   - doubao_generate_image');
    console.error('   - doubao_edit_image');
    console.error('   - siliconflow_generate_image');
    console.error('   - hunyuan_generate_image');
    console.error('   - zhipu_generate_image');
    console.error('   - xai_generate_image');
    console.error('');
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

// 优雅退出
process.on('SIGINT', () => {
  console.error('\n👋 正在关闭 MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n👋 正在关闭 MCP Server...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
