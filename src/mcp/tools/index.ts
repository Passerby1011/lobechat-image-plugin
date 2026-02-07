import { Tool } from '@modelcontextprotocol/sdk/types.js';

// 导入统一入口工具
import { unifiedTool, executeUnifiedTool, PLATFORM_DEFAULT_MODELS } from './unified';

// 导入各平台工具
import { tongyiTools, executeTongyiTool, executeTongyiFromUnified } from './tongyi';
import { doubaoTools, executeDoubaoTool, executeDoubaoFromUnified } from './doubao';
import { siliconflowTools, executeSiliconflowTool, executeSiliconflowFromUnified } from './siliconflow';
import { hunyuanTools, executeHunyuanTool, executeHunyuanFromUnified } from './hunyuan';
import { zhipuTools, executeZhipuTool, executeZhipuFromUnified } from './zhipu';
import { xaiTools, executeXaiTool, executeXaiFromUnified } from './xai';

/**
 * 获取环境变量中的 API Key
 */
function getApiKey(envKey: string): string {
  const key = process.env[envKey];
  if (!key) {
    throw new Error(`Missing API key: ${envKey}. Please set it in environment variables.`);
  }
  return key;
}

/**
 * 聚合所有 MCP 工具
 * 只包含各平台专属工具（不包含 generate_image 统一入口）
 */
export const allMcpTools: Tool[] = [
  // 各平台专属工具
  ...tongyiTools,
  ...doubaoTools,
  ...siliconflowTools,
  ...hunyuanTools,
  ...zhipuTools,
  ...xaiTools,
];

/**
 * 统一执行入口
 * 根据工具名称路由到对应的执行函数
 */
export async function executeToolByName(
  name: string,
  args: Record<string, any>
): Promise<any> {
  // 统一入口工具
  if (name === 'generate_image') {
    return executeUnifiedTool(args, {
      tongyi: (a) => executeTongyiFromUnified(a, getApiKey('ALIBABA_API_KEY')),
      doubao: (a) => executeDoubaoFromUnified(a, getApiKey('ARK_API_KEY')),
      siliconflow: (a) => executeSiliconflowFromUnified(a, getApiKey('SILICONFLOW_API_KEY')),
      hunyuan: (a) => executeHunyuanFromUnified(a, getApiKey('TENCENT_SECRET_ID'), getApiKey('TENCENT_SECRET_KEY')),
      zhipu: (a) => executeZhipuFromUnified(a, getApiKey('ZHIPU_API_KEY')),
      xai: (a) => executeXaiFromUnified(a, getApiKey('XAI_API_KEY')),
    });
  }

  // 通义万相工具
  if (name.startsWith('tongyi_')) {
    return executeTongyiTool(name, args, getApiKey('ALIBABA_API_KEY'));
  }

  // 豆包工具
  if (name.startsWith('doubao_')) {
    return executeDoubaoTool(name, args, getApiKey('ARK_API_KEY'));
  }

  // 硅基流动工具
  if (name.startsWith('siliconflow_')) {
    return executeSiliconflowTool(name, args, getApiKey('SILICONFLOW_API_KEY'));
  }

  // 腾讯混元工具
  if (name.startsWith('hunyuan_')) {
    return executeHunyuanTool(
      name,
      args,
      getApiKey('TENCENT_SECRET_ID'),
      getApiKey('TENCENT_SECRET_KEY')
    );
  }

  // 智谱 AI 工具
  if (name.startsWith('zhipu_')) {
    return executeZhipuTool(name, args, getApiKey('ZHIPU_API_KEY'));
  }

  // xAI 工具
  if (name.startsWith('xai_')) {
    return executeXaiTool(name, args, getApiKey('XAI_API_KEY'));
  }

  throw new Error(`Unknown tool: ${name}`);
}

// 导出各模块供外部使用
export {
  unifiedTool,
  tongyiTools,
  doubaoTools,
  siliconflowTools,
  hunyuanTools,
  zhipuTools,
  xaiTools,
  PLATFORM_DEFAULT_MODELS,
};
