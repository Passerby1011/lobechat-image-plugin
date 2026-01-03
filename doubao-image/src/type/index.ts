/**
 * @description: 此文件包含用于豆包文生图插件 (基于火山引擎) 的所有 TypeScript 接口。
 */

// 插件设置接口 (对应 manifest.json 中的 settings)
// 用户在插件配置页面输入的凭证
export interface DoubaoImageSettings {
  VOLC_ACCESS_KEY_ID: string;
  VOLC_SECRET_ACCESS_KEY: string; // 此密钥将安全存储并由插件后端使用
}

// 图像生成请求参数接口 (对应 manifest.json 中的 api.parameters)
// 这是发送到你的插件后端 https://lobechat.doubao-image.230617.xyz/api/generate 的请求体结构
export interface IDoubaoImageGenerationRequest {
  prompt: string; // 必选：用于生成图像的文本描述

  req_key?: 'high_aes_general_v21_L'; // 可选：算法名称，目前固定为此值
  response_format?: 'url' | 'b64_json'; // 可选：指定返回图像的格式，'url' 或 'b64_json'
  seed?: number; // 可选：随机种子，默认为-1（随机）
  scale?: number; // 可选：影响文本描述的程度，范围 [1, 10]
  ddim_steps?: number; // 可选：生成图像的步数，范围 [1, 200]，推荐 [1, 50]
  width?: number; // 可选：生成图像的宽度，范围 [256, 768]
  height?: number; // 可选：生成图像的高度，范围 [256, 768]
  use_pre_llm?: boolean; // 可选：是否开启文本扩写优化
  use_sr?: boolean; // 可选：是否开启AIGC超分
}

// 图像生成API响应中的单个数据项接口
// 代表从你的后端返回的单个图片信息
export interface IDoubaoImageGenerationDataItem {
  url?: string;           // 当 response_format 为 "url" 且成功生成时返回
  b64_json?: string;      // 当 response_format 为 "b64_json" 且成功生成时返回
  revised_prompt?: string; // 可选：来自火山引擎的 'rephraser_result'，可能为空
  error?: string;
}

// 图像生成API响应接口
// 这是你的插件后端 (https://lobechat.doubao-image.230617.xyz/api/generate) 返回的JSON响应结构
export interface IDoubaoImageGenerationResponse {
  created: number; // Unix 时间戳，表示响应创建时间
  data: IDoubaoImageGenerationDataItem[]; // 生成的图像数据数组，对于火山引擎此接口通常包含一个元素

  // 可选的错误信息结构
  error?: {
    message: string; // 错误描述
    code?: string | number; // 错误代码（可选）
    type?: string; // 错误类型（可选，例如 'PluginError', 'VolcEngineError'）
  };
}
