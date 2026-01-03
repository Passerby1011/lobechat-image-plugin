# 阿里云百炼 (Model Studio) 生图 API 综合参考文档

本文档基于阿里云百炼平台官方资料整理，涵盖了 **通义千问 (Qwen)**、**通义万相 (Wanx)** 以及 **Z-Image** 系列的所有主流生图与图像处理 API。文档从鉴权、通用调用方式到各模型的具体参数均有详尽说明。

---

## [TOC]

---

## 1. 鉴权与基础配置

### 1.1 获取 API Key
所有接口调用均需要使用阿里云百炼的 API Key。
- **获取方式**：登录 [阿里云百炼控制台](https://bailian.console.alibabacloud.com/) -> 点击右上角“API-KEY”获取。
- **配置方式**：
  - **Header**：`Authorization: Bearer <YOUR_API_KEY>`

### 1.2 服务地域 (Endpoint)
百炼 API 分为 **北京** 和 **新加坡** 两个主要地域，**API Key 与 Endpoint 必须匹配**，不可跨域使用。

| 地域 | 基础 Endpoint (Base URL) |
| :--- | :--- |
| **中国站 (北京)** | `https://dashscope.aliyuncs.com/api/v1` |
| **国际站 (新加坡)** | `https://dashscope-intl.aliyuncs.com/api/v1` |

### 1.3 任务模式
API 调用主要分为两种模式：
1.  **同步调用 (Sync)**：适用于生成速度较快的模型（如 Qwen-Image, Z-Image, Wan2.6），请求即返回结果。
2.  **异步调用 (Async)**：适用于耗时较长的模型（如 Qwen-MT, Wan2.5），需先提交任务获取 `task_id`，再轮询结果。

---

## 2. 通义千问系列 (Qwen)

### 2.1 文生图 (Text-to-Image)
支持多尺度、复杂文本渲染及艺术风格生成。

- **Endpoint**: `/services/aigc/multimodal-generation/generation` (POST)
- **推荐模型**:
  - `qwen-image-max` (推荐): 质量最高，真实感强，支持 1024-1664px 范围分辨率。
  - `qwen-image-plus`: 综合性能好，性价比高。
  - `qwen-image`: 基础模型。

#### 请求参数 (Body)
```json
{
  "model": "qwen-image-max",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [{ "text": "正向提示词，支持中英文，描述画面内容、风格、构图等" }]
      }
    ]
  },
  "parameters": {
    "size": "1328*1328",          // 分辨率，max默认1664*928，plus默认1024*1024
    "n": 1,                       // 固定为1
    "prompt_extend": true,        // 智能改写提示词 (默认true)
    "watermark": false,           // 是否添加水印
    "seed": 1234,                 // 随机种子 [0, 2147483647]
    "negative_prompt": "低质量..." // 反向提示词
  }
}
```

### 2.2 图像编辑 (Image Editing)
支持单图编辑（局部重绘、修改）和多图融合（风格迁移、主体保持）。

- **Endpoint**: `/services/aigc/multimodal-generation/generation` (POST)
- **推荐模型**: `qwen-image-edit-plus` (支持 output 1-6 张图，可指定 size)

#### 请求参数
**注意**：`content` 数组中可包含 1-3 张参考图及 1 个文本指令。

```json
{
  "model": "qwen-image-edit-plus",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "image": "https://example.com/input1.png" }, // 图1
          { "image": "data:image/png;base64,..." },       // 或 Base64
          { "text": "图1中的女生穿着图2中的裙子，背景换成森林" } // 编辑指令
        ]
      }
    ]
  },
  "parameters": {
    "n": 2,                       // 输出图片数量 (1-6)
    "size": "1024*1024",          // 仅当 n=1 时可指定分辨率
    "prompt_extend": true,
    "negative_prompt": "模糊，变形"
  }
}
```

### 2.3 图像翻译 (Image Translation)
精准翻译图片中的文字并保留原始排版（异步接口）。

- **创建任务**: `/services/aigc/image2image/image-synthesis` (POST)
- **查询任务**: `/tasks/{task_id}` (GET)
- **模型**: `qwen-mt-image`

#### 创建任务参数
**Header 必须包含**: `X-DashScope-Async: enable`

```json
{
  "model": "qwen-mt-image",
  "input": {
    "image_url": "https://example.com/menu.jpg", // 必填，仅支持URL
    "source_lang": "auto",                       // 源语言 (auto, zh, en, ja, ko...)
    "target_lang": "zh",                         // 目标语言
    "ext": {
        "domainHint": "food menu",               // 领域提示(英文)
        "sensitives": ["敏感词1"],                // 过滤敏感词
        "terminologies": [{"src":"Apple", "tgt":"苹果"}] // 术语干预
    }
  }
}
```

---

## 3. 通义万相系列 (Wanx)

### 3.1 文生图 V2 (Wan2.6 & Wan2.5)
包含最新版 Wan2.6（支持同步/异步）和 Wan2.5（仅异步）。

#### 3.1.1 Wan2.6-T2I (同步接口)
- **Endpoint**: `/services/aigc/multimodal-generation/generation` (POST)
- **模型**: `wan2.6-t2i`
- **特点**: 生成质量更高，支持 1280x1280 及多种比例。

```json
{
  "model": "wan2.6-t2i",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [{ "text": "一间有着精致窗户的花店" }]
      }
    ]
  },
  "parameters": {
    "size": "1280*1280",          // 默认 1280*1280, 范围 [1280*1280, 1440*1440]
    "n": 1,                       // 生成数量 (1-4)
    "prompt_extend": true,
    "watermark": false
  }
}
```

#### 3.1.2 Wan2.5-T2I (异步接口)
- **创建任务**: `/services/aigc/text2image/image-synthesis` (POST)
- **查询任务**: `/tasks/{task_id}` (GET)
- **模型**: `wan2.5-t2i-preview`, `wan2.2-t2i-flash`

```json
{
  "model": "wan2.5-t2i-preview",
  "input": {
    "prompt": "正向提示词"
  },
  "parameters": {
    "size": "1280*1280",
    "n": 1,
    "negative_prompt": "not good"
  }
}
```
*注意：Wan2.5 接口参数结构与 Qwen 系列略有不同（使用 `prompt` 字段而非 `messages`）。*

### 3.2 图像生成与编辑 2.6 (Wan2.6-Image)
支持 **图像编辑** 和 **图文混排 (Interleaved)** 两大模式。

- **Endpoint**: `/services/aigc/multimodal-generation/generation` (POST)
- **模型**: `wan2.6-image`

#### 模式 A: 图像编辑 (`enable_interleave: false`)
用于风格迁移、主体一致性生成。
```json
{
  "model": "wan2.6-image",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [
          { "text": "参考图1风格生成番茄炒蛋" },
          { "image": "https://example.com/style.png" }
        ]
      }
    ]
  },
  "parameters": {
    "enable_interleave": false, // 必须为 false
    "n": 1,                     // 输出数量 (1-4)
    "size": "1280*1280"
  }
}
```

#### 模式 B: 图文混排 (`enable_interleave: true`)
生成包含文本和图片的富媒体内容（如教程步骤）。**仅支持流式输出**。

**Header 必须包含**: `X-DashScope-Sse: enable`

```json
{
  "model": "wan2.6-image",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [{ "text": "制作辣椒炒肉的3个步骤图文教程" }]
      }
    ]
  },
  "parameters": {
    "enable_interleave": true,  // 必须为 true
    "stream": true,             // 必须为 true
    "max_images": 3,            // 最大图片数量
    "size": "1280*1280"
  }
}
```

---

## 4. Z-Image 系列

### 4.1 疾速文生图 (Z-Image-Turbo)
轻量级模型，生成速度极快，适合对时延敏感的场景。

- **Endpoint**: `/services/aigc/multimodal-generation/generation` (POST)
- **模型**: `z-image-turbo`

#### 请求参数
```json
{
  "model": "z-image-turbo",
  "input": {
    "messages": [
      {
        "role": "user",
        "content": [{ "text": "一只赛博朋克风格的猫" }]
      }
    ]
  },
  "parameters": {
    "size": "1024*1024",          // 支持 512*512 到 2048*2048 任意比例
    "prompt_extend": false,       // 智能改写 (开启会增加耗时与费用)
    "seed": 1234
  }
}
```

---

## 5. 公共参数与响应格式

### 5.1 响应格式 (同步接口)
适用于 Qwen-Image, Wan2.6, Z-Image。

**成功响应**:
```json
{
  "request_id": "xxxx-xxxx-xxxx",
  "output": {
    "choices": [
      {
        "finish_reason": "stop",
        "message": {
          "role": "assistant",
          "content": [
            {
              "image": "https://dashscope-result-....png?Expires=...", // 图片URL，24小时有效
              "type": "image"
            }
          ]
        }
      }
    ]
  },
  "usage": {
    "image_count": 1
  }
}
```

**失败响应**:
```json
{
  "code": "InvalidParameter",
  "message": "Error description...",
  "request_id": "xxxx"
}
```

### 5.2 错误处理
常见错误码：
| 错误码 | 说明 | 建议 |
| :--- | :--- | :--- |
| `InvalidApiKey` | API Key 无效或过期 | 检查 Key 是否正确，地域是否匹配 |
| `Throttling.RateQuota` | 触发限流 | 降低并发请求频率 |
| `Arrearage` | 账户欠费 | 请前往阿里云充值 |
| `InvalidParameter` |哪怕是细微的参数错误 | 检查 `input` 结构或 `parameters` 范围 |
| `DataInspectionFailed` | 内容安全拦截 | 检查输入提示词是否违规 |

---

## 6. 总结建议

| 场景需求 | 推荐模型 | 接口类型 | 优势 |
| :--- | :--- | :--- | :--- |
| **追求最高画质** | `qwen-image-max` | 同步 | 细节丰富，真实感强 |
| **需要修改/P图** | `qwen-image-edit-plus` | 同步 | 支持指令编辑、多图融合 |
| **追求极速出图** | `z-image-turbo` | 同步 | 响应极快，轻量级 |
| **最新全能(含编辑)** | `wan2.6-image` | 同步/流式 | 综合能力强，支持图文混排 |
| **图片翻译 (海报)** | `qwen-mt-image` | 异步 | 保持排版，文字还原度高 |

**注意**：所有生成的图片 URL 有效期均为 **24小时**，请务必在有效期内自行转存（如下载到本地或存入 OSS）。