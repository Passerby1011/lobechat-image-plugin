import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * 统一入口工具 - generate_image
 * 这是推荐给普通用户的主要工具，通过 platform 参数路由到不同平台
 */
export const unifiedTool: Tool = {
  name: 'generate_image',
  description: `全能 AI 图像生成工具。一个工具支持多个平台：

🎨 **支持的平台**:
- tongyi: 阿里通义万相 (默认，支持文生图、图编辑、图翻译，最高画质)
- doubao: 字节豆包 Seedream (高质量创意图，组图连贯生成)
- siliconflow: 硅基流动 FLUX/SD (开源模型，多样化风格)
- hunyuan: 腾讯混元 (极速生成，秒级出图)
- zhipu: 智谱 CogView (汉字精准生成)
- xai: xAI Grok (创意视觉生成)

💡 **使用示例**:
- "帮我生成一只可爱的猫咪" → 使用默认平台 tongyi
- "用 doubao 生成赛博朋克风格的城市" → 指定使用豆包
- "生成一张 1920x1080 的风景图" → 指定尺寸

不指定 platform 时默认使用 tongyi（通义万相）。`,
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: '图像生成提示词，描述你想要生成的图像内容。支持中英文。',
      },
      platform: {
        type: 'string',
        description: '选择 AI 平台。不指定时默认使用 tongyi。',
        enum: ['tongyi', 'doubao', 'siliconflow', 'hunyuan', 'zhipu', 'xai'],
        default: 'tongyi',
      },
      model: {
        type: 'string',
        description: '模型名称（可选）。每个平台有默认模型，高级用户可指定具体模型。',
      },
      size: {
        type: 'string',
        description: '图像尺寸，格式为 "宽*高"，如 "1024*1024"、"1920*1080"。',
        default: '1024*1024',
      },
      reference_images: {
        type: 'array',
        items: { type: 'string' },
        description: '参考图 URL 列表（可选）。用于图生图、图像编辑等场景。',
      },
      negative_prompt: {
        type: 'string',
        description: '反向提示词（可选）。描述不希望出现在图像中的内容。',
      },
    },
    required: ['prompt'],
  },
};

/**
 * 平台默认模型映射
 */
export const PLATFORM_DEFAULT_MODELS: Record<string, string> = {
  tongyi: 'qwen-image-max',
  doubao: 'seedream-3.0',
  siliconflow: 'flux-1-schnell',
  hunyuan: 'hunyuan-lite',
  zhipu: 'cogview-4',
  xai: 'grok-2-image',
};

/**
 * 执行统一入口工具
 */
export async function executeUnifiedTool(
  args: Record<string, any>,
  executors: {
    tongyi: (args: any) => Promise<any>;
    doubao: (args: any) => Promise<any>;
    siliconflow: (args: any) => Promise<any>;
    hunyuan: (args: any) => Promise<any>;
    zhipu: (args: any) => Promise<any>;
    xai: (args: any) => Promise<any>;
  }
): Promise<any> {
  const platform = args.platform || 'tongyi';
  
  // 构造统一的参数格式
  const normalizedArgs = {
    prompt: args.prompt,
    model: args.model || PLATFORM_DEFAULT_MODELS[platform],
    size: args.size || '1024*1024',
    reference_images: args.reference_images || [],
    negative_prompt: args.negative_prompt,
  };

  // 根据平台路由到对应的执行器
  switch (platform) {
    case 'tongyi':
      return executors.tongyi(normalizedArgs);
    case 'doubao':
      return executors.doubao(normalizedArgs);
    case 'siliconflow':
      return executors.siliconflow(normalizedArgs);
    case 'hunyuan':
      return executors.hunyuan(normalizedArgs);
    case 'zhipu':
      return executors.zhipu(normalizedArgs);
    case 'xai':
      return executors.xai(normalizedArgs);
    default:
      throw new Error(`Unknown platform: ${platform}. Supported: tongyi, doubao, siliconflow, hunyuan, zhipu, xai`);
  }
}
