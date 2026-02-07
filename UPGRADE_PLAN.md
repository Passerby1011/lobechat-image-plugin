# 🚀 LobeChat Image Plugin 升级计划

> 基于文档分析和当前代码对比，制定的详细升级方案
> 
> 分析日期：2026-01-02

---

## 📊 一、现状分析

### 当前已实现的功能

| 平台 | 当前模型/接口 | 实现方式 |
|------|--------------|---------|
| **阿里通义万相** | 异步文生图 (text2image) | 仅支持异步接口，轮询获取结果 |
| **豆包** | 火山引擎通用2.1 | 使用旧版CV接口，签名复杂 |
| **腾讯混元** | 异步文生图 | 仅支持基础文生图 |
| **智谱AI** | CogView基础版 | 仅支持基础文生图 |
| **硅基流动** | FLUX.1-schnell | 仅支持单一模型 |

### 文档揭示的完整能力

根据提供的5份API文档，各平台实际支持的完整能力远超当前实现：

#### 1️⃣ **阿里云百炼 (通义系列)** - 缺失功能最多

**文档显示支持的模型系列：**
- ✅ 已实现：异步文生图 (wan2.5-t2i)
- ❌ **缺失**：
  - **Qwen-Image 系列**（同步接口，质量最高）
    - `qwen-image-max` - 最高画质，1664px分辨率
    - `qwen-image-plus` - 性价比高
    - `qwen-image` - 基础版
  - **Qwen-Image-Edit**（图像编辑）
    - `qwen-image-edit-plus` - 支持多图融合、局部重绘
  - **Qwen-MT-Image**（图像翻译）
    - `qwen-mt-image` - 保持排版的图片翻译
  - **Wan2.6 系列**（最新版）
    - `wan2.6-t2i` - 同步接口，1280x1280
    - `wan2.6-image` - 支持图像编辑和图文混排
  - **Z-Image 系列**
    - `z-image-turbo` - 极速生成

**缺失的核心功能：**
1. 同步接口支持（当前只有异步）
2. 图像编辑能力（多图融合、风格迁移）
3. 图文混排生成（流式输出）
4. 图像翻译功能
5. 多种分辨率支持（当前固定1024*1024）

---

#### 2️⃣ **豆包 (火山引擎)** - 使用过时接口

**文档显示的最新能力：**
- ✅ 已实现：基础文生图（但使用旧版CV接口）
- ❌ **缺失**：
  - **Seedream 4.5** - 最新旗舰模型
    - 多图融合（最多14张参考图）
    - 文生组图（漫画分镜、套图）
    - 流式输出支持
  - **Seedream 4.0** - 平衡版
  - **Seedream 3.0** - 高性价比快速版
  - **SeedEdit 3.0** - 图像编辑模型

**当前问题：**
1. 使用旧版 `CVProcess` 接口，应升级到 `/api/v3/images/generations`
2. 不支持多图生图
3. 不支持组图生成
4. 不支持图像编辑
5. 缺少流式输出

---

#### 3️⃣ **腾讯混元** - 仅实现基础功能

**文档显示的完整能力：**
- ✅ 已实现：异步文生图（3.0版本）
- ❌ **缺失**：
  - **混元极速版** (`TextToImageLite`) - 同步接口
  - 多种分辨率支持（当前固定1024:1024）
  - 自定义水印功能
  - 智能改写开关控制

**改进点：**
1. 添加极速版同步接口
2. 支持更多分辨率比例
3. 暴露更多参数给用户

---

#### 4️⃣ **智谱AI (CogView)** - 缺少最新模型

**文档显示的模型：**
- ✅ 已实现：基础 CogView
- ❌ **缺失**：
  - **cogview-4-250304** - 最新旗舰，支持HD质量
  - **cogview-3-flash** - 极速版
  - `quality` 参数（hd/standard）
  - 水印控制参数

**改进点：**
1. 升级到最新模型
2. 支持HD质量选项
3. 添加水印控制

---

#### 5️⃣ **硅基流动** - 模型单一

**文档显示的丰富模型库：**
- ✅ 已实现：FLUX.1-schnell
- ❌ **缺失**：
  - **FLUX.1-dev** - 质量更高
  - **FLUX.1-pro** - 专业版
  - **Kolors** - 中文理解优秀
  - **Stable Diffusion 3** 系列
  - **SDXL** 系列
  - **Qwen-Image**

**改进点：**
1. 添加模型选择器
2. 支持更多FLUX系列
3. 集成中文优化模型

---

## 🎯 二、升级计划

### 阶段一：模型扩充（优先级：⭐⭐⭐⭐⭐）

#### 1. 阿里通义万相升级

**新增模型：**
```typescript
// 同步接口模型
- qwen-image-max (推荐，最高画质)
- qwen-image-plus (性价比)
- wan2.6-t2i (最新版同步)
- z-image-turbo (极速)

// 图像编辑模型
- qwen-image-edit-plus (多图融合)
- wan2.6-image (编辑+图文混排)

// 特殊功能
- qwen-mt-image (图像翻译)
```

**实现要点：**
- 创建新的handler支持同步接口
- 添加图像编辑功能（支持多图输入）
- 实现流式输出（图文混排）
- 添加图像翻译独立接口

#### 2. 豆包接口现代化

**升级方案：**
```typescript
// 迁移到新API
BASE_URL: "https://ark.cn-beijing.volces.com/api/v3"
ENDPOINT: "/images/generations"

// 新增模型
- doubao-seedream-4-5-251128 (旗舰)
- doubao-seedream-4-0-250828 (平衡)
- doubao-seedream-3-0-t2i-250415 (快速)
- doubao-seededit-3-0-i2i-250628 (编辑)
```

**新功能：**
- 多图融合（最多14张）
- 组图生成（漫画分镜）
- 流式输出
- 图像编辑

#### 3. 混元添加极速版

**新增接口：**
```typescript
- TextToImageLite (同步，秒级返回)
```

**参数扩展：**
- 支持更多分辨率比例
- 自定义水印
- 智能改写控制

#### 4. 智谱升级到最新

**模型更新：**
```typescript
- cogview-4-250304 (最新，支持HD)
- cogview-3-flash (极速)
```

**新参数：**
- quality: "hd" | "standard"
- watermark_enabled: boolean

#### 5. 硅基流动模型库扩充

**新增模型：**
```typescript
// FLUX系列
- black-forest-labs/FLUX.1-dev
- black-forest-labs/FLUX.1-pro

// 中文优化
- Kwai-Kolors/Kolors

// SD系列
- stabilityai/stable-diffusion-3-medium
- stabilityai/stable-diffusion-xl-base-1.0
```

---

### 阶段二：功能增强（优先级：⭐⭐⭐⭐）

#### 1. 图像编辑能力

**新增功能模块：**
- 多图融合（风格迁移、换装）
- 局部重绘（指定区域修改）
- 背景替换
- 主体一致性生成

**涉及平台：**
- 阿里：qwen-image-edit-plus, wan2.6-image
- 豆包：SeedEdit 3.0

#### 2. 组图生成

**应用场景：**
- 漫画分镜
- 教程步骤图
- 连续故事板

**实现平台：**
- 豆包 Seedream 4.5/4.0
- 阿里 wan2.6-image（图文混排）

#### 3. 流式输出支持

**适用场景：**
- 图文混排生成
- 组图逐张返回
- 实时进度反馈

**技术要点：**
- SSE (Server-Sent Events)
- 流式Markdown渲染

#### 4. 图像翻译功能

**独立插件：**
- 创建 `tongyi-translate-image` 插件
- 支持多语言互译
- 保持原始排版

---

### 阶段三：用户体验优化（优先级：⭐⭐⭐）

#### 1. 统一参数接口

**标准化参数：**
```typescript
interface UnifiedImageParams {
  // 基础参数
  prompt: string;
  negative_prompt?: string;
  model: string;
  
  // 尺寸参数
  size?: string; // "1024x1024" 或 "1024*1024"
  width?: number;
  height?: number;
  
  // 控制参数
  seed?: number;
  steps?: number;
  guidance_scale?: number;
  
  // 高级功能
  images?: string[]; // 多图输入
  quality?: "hd" | "standard";
  watermark?: boolean;
  
  // 组图参数
  sequential?: boolean;
  max_images?: number;
}
```

#### 2. 模型选择器

**前端UI改进：**
- 每个平台显示可用模型列表
- 模型特性说明（速度、质量、价格）
- 推荐模型标记

#### 3. 参数预设

**快捷配置：**
```typescript
presets = {
  "高质量": { steps: 50, guidance_scale: 7.5 },
  "快速生成": { steps: 20, guidance_scale: 5.0 },
  "极致细节": { quality: "hd", steps: 80 }
}
```

#### 4. 错误处理增强

**改进点：**
- 内容审核失败的友好提示
- 限流时的重试机制
- 余额不足的明确提醒

---

### 阶段四：架构优化（优先级：⭐⭐）

#### 1. 插件能力分层

**能力标签系统：**
```typescript
interface PluginCapabilities {
  text2image: boolean;
  image2image: boolean;
  multiImageFusion: boolean;
  sequentialGeneration: boolean;
  streaming: boolean;
  imageTranslation: boolean;
}
```

#### 2. 统一响应格式

**标准化输出：**
```typescript
interface UnifiedResponse {
  images: string[];
  metadata: {
    prompt: string;
    revisedPrompt?: string;
    model: string;
    parameters: Record<string, any>;
  };
  capabilities: string[]; // 使用的能力
  markdownResponse: string;
}
```

#### 3. 中间件系统

**功能模块：**
- 参数验证中间件
- 内容安全检查
- 速率限制
- 日志记录

---

## 📋 三、实施优先级矩阵

| 任务 | 影响力 | 实现难度 | 优先级 | 预计工时 |
|------|--------|---------|--------|---------|
| 阿里添加同步模型 | ⭐⭐⭐⭐⭐ | 🔧🔧 | P0 | 4h |
| 豆包API现代化 | ⭐⭐⭐⭐⭐ | 🔧🔧🔧 | P0 | 6h |
| 硅基流动模型扩充 | ⭐⭐⭐⭐ | 🔧 | P0 | 2h |
| 智谱升级最新模型 | ⭐⭐⭐⭐ | 🔧 | P1 | 2h |
| 混元添加极速版 | ⭐⭐⭐ | 🔧🔧 | P1 | 3h |
| 图像编辑功能 | ⭐⭐⭐⭐⭐ | 🔧🔧🔧🔧 | P1 | 8h |
| 组图生成 | ⭐⭐⭐⭐ | 🔧🔧🔧 | P2 | 6h |
| 流式输出 | ⭐⭐⭐ | 🔧🔧🔧🔧 | P2 | 8h |
| 图像翻译插件 | ⭐⭐⭐ | 🔧🔧 | P2 | 4h |
| 统一参数接口 | ⭐⭐⭐⭐ | 🔧🔧🔧 | P3 | 6h |
| 模型选择器UI | ⭐⭐⭐ | 🔧🔧 | P3 | 4h |

**总预计工时：53小时**

---

## 🎬 四、快速启动建议

### 第一周：核心模型扩充
1. **Day 1-2**: 阿里同步模型（qwen-image-max, wan2.6-t2i）
2. **Day 3-4**: 豆包API迁移到v3
3. **Day 5**: 硅基流动添加FLUX.1-dev和Kolors

### 第二周：高级功能
1. **Day 1-3**: 图像编辑功能（阿里+豆包）
2. **Day 4-5**: 组图生成（豆包）

### 第三周：体验优化
1. **Day 1-2**: 统一参数接口
2. **Day 3-4**: 错误处理和重试机制
3. **Day 5**: 文档更新和测试

---

## 📝 五、具体实现示例

### 示例1：阿里同步模型实现

```typescript
// src/plugins/tongyi/handlers/qwen-image-max.ts
export const qwenImageMaxHandler: PluginHandler = {
  id: "tongyi-qwen-image-max",
  name: "通义千问-图像生成Max",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const apiKey = settings.ALIBABA_API_KEY;
    
    const response = await fetch(
      `${BASE_URL}/services/aigc/multimodal-generation/generation`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-image-max",
          input: {
            messages: [{
              role: "user",
              content: [{ text: body.prompt }]
            }]
          },
          parameters: {
            size: body.size || "1328*1328",
            n: 1,
            prompt_extend: body.prompt_extend ?? true,
            seed: body.seed,
            negative_prompt: body.negative_prompt
          }
        })
      }
    );
    
    const data = await response.json();
    const imageUrl = data.output.choices[0].message.content[0].image;
    
    // 持久化存储
    const permanentUrl = await saveImageToStorage(imageUrl, "url", "tongyi-qwen-max");
    
    return NextResponse.json({
      markdownResponse: formatImageMarkdown([permanentUrl], {
        prompt: body.prompt,
        model: "qwen-image-max",
        extraInfo: {
          "分辨率": body.size || "1328*1328",
          "智能改写": body.prompt_extend ? "开启" : "关闭"
        }
      }),
      images: [permanentUrl]
    });
  }
};
```

### 示例2：豆包新API实现

```typescript
// src/plugins/doubao/handlers/seedream-4-5.ts
export const seedream45Handler: PluginHandler = {
  id: "doubao-seedream-4-5",
  name: "豆包Seedream 4.5",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    
    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.ARK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-seedream-4-5-251128",
          prompt: body.prompt,
          size: body.size || "2K",
          image: body.images, // 支持多图输入
          sequential_image_generation: body.sequential || "disabled",
          sequential_image_generation_options: {
            max_images: body.max_images || 4
          }
        })
      }
    );
    
    const data = await response.json();
    const imageUrls = await Promise.all(
      data.data.map(img => saveImageToStorage(img.url, "url", "doubao-4-5"))
    );
    
    return NextResponse.json({
      markdownResponse: formatImageMarkdown(imageUrls, {
        prompt: body.prompt,
        model: "Seedream 4.5",
        extraInfo: {
          "生成数量": imageUrls.length,
          "分辨率": body.size || "2K"
        }
      }),
      images: imageUrls
    });
  }
};
```

---

## ✅ 六、验收标准

### 功能完整性
- [ ] 所有文档中提到的模型均已实现
- [ ] 图像编辑功能可用
- [ ] 组图生成功能可用
- [ ] 流式输出功能可用

### 代码质量
- [ ] 所有handler遵循统一接口
- [ ] 错误处理完善
- [ ] 类型定义完整
- [ ] 单元测试覆盖率>80%

### 用户体验
- [ ] 响应时间<5秒（同步接口）
- [ ] 错误提示友好
- [ ] 文档完整清晰
- [ ] 示例代码可运行

---

## 📚 七、参考资源

- [阿里云百炼API文档](文档/Ali.md)
- [豆包生图API文档](文档/doubao.md)
- [腾讯混元API文档](文档/hunyuan.md)
- [硅基流动API文档](文档/SiliconFlow.md)
- [智谱AI API文档](文档/zhipu.md)

---

**制定人**: AI Assistant  
**审核状态**: 待审核  
**最后更新**: 2026-01-02
