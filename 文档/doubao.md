[HEADER]豆包生图 API 文档[/HEADER]

[TOC]

[/TOC]

# 豆包生图 API 文档

本文档基于火山引擎官方资料整理，旨在提供全面、详尽的豆包系列生图模型（Seedream 4.5/4.0/3.0 及 SeedEdit 3.0）的 API 调用指南。

---

## 1. 产品简介

豆包生图系列模型提供了强大的图像生成与编辑能力，涵盖文生图、图生图、智能扩图、组图生成及图像编辑等功能。主要模型包括：

*   **Seedream 4.5 / 4.0**: 最新一代生图模型，支持文生图、多图融合（多图生图）、组图生成（如漫画分镜、套图），具备更强的主体一致性和美学表现。
*   **Seedream 3.0**: 高性价比文生图模型，响应速度快，指令遵循能力强。
*   **SeedEdit 3.0**: 图像编辑模型，支持通过自然语言指令对原图进行修改（如改变背景、材质、表情等）。

---

## 2. 接入指南

### 2.1 基础配置
*   **API Base URL**: `https://ark.cn-beijing.volces.com/api/v3`
*   **接口路径**: `/images/generations`
*   **请求方法**: `POST`
*   **内容类型**: `application/json`

### 2.2 鉴权方式
API 使用 Bearer Token 进行鉴权。请在 HTTP Header 中添加：
```http
Authorization: Bearer <YOUR_API_KEY>
```
> **提示**: 请前往 [火山引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) 获取您的 API Key。

---

## 3. 模型列表与能力对照

| 模型系列 | 推荐版本 ID (Model ID) | 核心能力 | 限流 (IPM) | 适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **Seedream 4.5** | `doubao-seedream-4-5-251128` | 文生图、单图/多图生图、文生组图、多图生组图 | 500 | 专业创作、多图融合、一致性组图 |
| **Seedream 4.0** | `doubao-seedream-4-0-250828` | 文生图、单图/多图生图、文生组图 | 500 | 平衡质量与成本的通用场景 |
| **Seedream 3.0** | `doubao-seedream-3-0-t2i-250415`| 文生图 | 500 | 快速生成、中英双语优化 |
| **SeedEdit 3.0** | `doubao-seededit-3-0-i2i-250628`| 图片编辑 (图生图) | 500 | 改图、换背景、风格迁移 |

---

## 4. API 接口详情

### 4.1 请求参数 (Request Body)

| 参数名 | 类型 | 必填 | 默认值 | 说明 | 适用模型 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **model** | `string` | **是** | - | 模型 ID 或推理接入点 ID (Endpoint ID)。 | 所有模型 |
| **prompt** | `string` | **是** | - | 提示词，支持中英文。建议不超过300汉字或600英文单词。 | 所有模型 |
| **image** | `string` / `array` | 否 | - | 参考图/原图。支持 URL 或 Base64。<br>- **SeedEdit**: 仅支持单图（URL）。<br>- **Seedream 4.5/4.0**: 支持单图或多图（URL数组），最多 14 张。 | Seedream 4.5/4.0<br>SeedEdit 3.0 |
| **size** | `string` | 否 | 见说明 | 指定生成图像尺寸。支持两种格式：<br>1. **分辨率描述**: `1K`, `2K`, `4K` (仅 Seedream 4.5/4.0)。<br>2. **像素值**: 如 `1024x1024`。<br>3. **自适应**: `adaptive` (仅 SeedEdit 3.0)。 | 所有模型 |
| **seed** | `integer` | 否 | -1 | 随机种子，范围 `[-1, 2147483647]`。<br>固定种子可用于复现结果（Seedream 4.5/4.0 不支持此参数）。 | Seedream 3.0<br>SeedEdit 3.0 |
| **guidance_scale** | `float` | 否 | 见说明 | 文本引导权重（提示词相关性）。<br>范围 `[1, 10]`。<br>Seedream 3.0 默认 2.5；SeedEdit 3.0 默认 5.5。 | Seedream 3.0<br>SeedEdit 3.0 |
| **stream** | `boolean` | 否 | false | 是否开启流式输出。 | Seedream 4.5/4.0 |
| **sequential_image_generation** | `string` | 否 | `disabled` | 组图生成控制。<br>- `auto`: 自动判断生成组图。<br>- `disabled`: 仅生成单图。 | Seedream 4.5/4.0 |
| **sequential_image_generation_options** | `object` | 否 | - | 组图配置项，仅当 `sequential_image_generation` 为 `auto` 时生效。<br>- `max_images`: 最大生成数量 (1-15)。 | Seedream 4.5/4.0 |
| **response_format** | `string` | 否 | `url` | 返回格式。<br>- `url`: 返回图片下载链接（24小时有效）。<br>- `b64_json`: 返回 Base64 编码数据。 | 所有模型 |
| **watermark** | `boolean` | 否 | true | 是否添加“AI生成”水印。 | 所有模型 |

#### 参数详细说明：Image
*   **格式要求**: `jpeg`, `png` (4.5/4.0 新增支持 `webp`, `bmp`, `tiff`, `gif`)。
*   **大小限制**: 单图不超过 10MB，宽高像素 > 14px，总像素不超过 3600万(4.5/4.0) 或 6000x6000px。
*   **Base64 格式**: `data:image/<格式>;base64,<编码字符串>`。

### 4.2 响应参数 (Response)

响应结构符合 OpenAI 接口规范。

```json
{
  "created": 1721234567,
  "model": "doubao-seedream-4-5-251128",
  "data": [
    {
      "url": "https://...",      // 当 response_format=url 时返回
      "b64_json": "...",         // 当 response_format=b64_json 时返回
      "size": "3104x1312"        // 图片实际尺寸 (Seedream 4.5/4.0 返回)
    }
  ],
  "usage": {
    "generated_images": 1,       // 成功生成的数量
    "output_tokens": 1234,       // 消耗的计算单位
    "total_tokens": 1234
  }
}
```

---

## 5. 常用配置参考

### 5.1 推荐尺寸表 (Seedream 4.5/4.0)

| 宽高比 | 推荐像素值 (默认 2048x2048) |
| :--- | :--- |
| **1:1** | 2048x2048 |
| **4:3** | 2304x1728 |
| **3:4** | 1728x2304 |
| **16:9** | 2560x1440 |
| **9:16** | 1440x2560 |
| **3:2** | 2496x1664 |

> **注意**: 自定义像素值时，需满足总像素在 `[2560x1440, 4096x4096]` 之间，且宽高比在 `[1/16, 16]` 之间。

### 5.2 Adaptive 尺寸 (SeedEdit 3.0)
当 `size` 设置为 `adaptive` 时，模型会根据输入的原图尺寸，自动匹配最接近的预设输出尺寸，尽可能保持原图比例。

---

## 6. 代码示例

以下主要展示 CURL 和 Python (OpenAI SDK 兼容模式) 的调用方式。

### 6.1 文生图 (Seedream 4.5)
```bash
curl https://ark.cn-beijing.volces.com/api/v3/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARK_API_KEY" \
  -d '{
    "model": "doubao-seedream-4-5-251128",
    "prompt": "赛博朋克风格的雨夜街道，霓虹灯倒映在积水中，高对比度，电影质感。",
    "size": "2K",
    "watermark": false
}'
```

### 6.2 多图融合 (Seedream 4.5)
将多张参考图的特征融合生成新图（例如：换装、风格迁移）。

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://ark.cn-beijing.volces.com/api/v3",
    api_key=os.environ.get("ARK_API_KEY"),
)

response = client.images.generate(
    model="doubao-seedream-4-5-251128",
    prompt="将图1的服装换为图2的服装风格",
    size="2K",
    extra_body={
        # 传入两张参考图 URL
        "image": [
            "https://example.com/model_photo.png", 
            "https://example.com/clothes_photo.png"
        ],
        "sequential_image_generation": "disabled" # 显式禁用组图，确保单图输出
    }
)

print(response.data[0].url)
```

### 6.3 组图生成 (Seedream 4.5)
生成一组连贯的图片（如四格漫画）。

```python
response = client.images.generate(
    model="doubao-seedream-4-5-251128",
    prompt="生成一组4张连贯插画，描绘一颗种子从发芽到长成参天大树的四季变化。",
    size="2K",
    extra_body={
        "sequential_image_generation": "auto",
        "sequential_image_generation_options": {
            "max_images": 4
        }
    }
)
# data 数组中将包含多张图片链接
for img in response.data:
    print(img.url)
```

### 6.4 图像编辑 (SeedEdit 3.0)
使用文字指令修改图片内容。

```python
response = client.images.generate(
    model="doubao-seededit-3-0-i2i-250628",
    prompt="把背景修改为雪山，保持人物不变",
    extra_body={
        "image": "https://example.com/original_photo.jpg",
        "guidance_scale": 5.5,
        "seed": 123,
        "size": "adaptive", # 保持原图比例
        "watermark": True
    }
)
print(response.data[0].url)
```

---

## 7. 错误码说明 (Common Errors)

| 错误码 | 说明 | 处理建议 |
| :--- | :--- | :--- |
| **rate_limit_exceeded** | 请求速率超过限制 | 默认限制 500 IPM，请通过重试机制或联系商务提额。 |
| **invalid_request_error** | 参数格式错误 | 检查 `size` 格式、`image` URL 可达性、Prompt 长度等。 |
| **content_policy_violation** | 内容安全拦截 | 输入的提示词或参考图包含敏感内容，请修改后重试。 |
| **server_error** | 服务器内部错误 | 请稍后重试。 |