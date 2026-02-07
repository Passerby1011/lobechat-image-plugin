这是一份基于 SiliconFlow 官方文档整理的生图 API 详解。

# SiliconFlow 图像生成 API 文档

SiliconFlow 平台提供了高性能的图像生成 API，支持包括 FLUX.1、SDXL、Kolors（可图）以及 Qwen-Image 等在内的多种顶级模型。该 API 兼容 OpenAI 的图像生成接口格式，方便开发者快速接入。

---

## 1. 快速开始

### API 基础信息
- **Base URL**: `https://api.siliconflow.cn/v1`
- **Endpoint**: `/images/generations`
- **Method**: `POST`
- **认证方式**: Bearer Token (在 Header 中添加 `Authorization: Bearer <YOUR_API_KEY>`)

### 调用示例

#### Python (使用 OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    api_key="您的API_KEY", 
    base_url="https://api.siliconflow.cn/v1"
)

response = client.images.generate(
    model="black-forest-labs/FLUX.1-dev", # 或其他支持的模型
    prompt="A futuristic eco-friendly skyscraper in central Tokyo, vertical gardens, sustainable design, cinematic lighting",
    size="1024x1024",
    n=1,
    extra_body={
        "num_inference_steps": 20
        # "seed": 42
    }
)

print(response.data[0].url)
```

#### cURL

```bash
curl --request POST \
  --url https://api.siliconflow.cn/v1/images/generations \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "Kwai-Kolors/Kolors",
    "prompt": "An elegant snow leopard perched on a cliff, Himalayan mountains background, 4k, high quality",
    "image_size": "1024x1024",
    "batch_size": 1,
    "seed": 4999999999,
    "num_inference_steps": 20,
    "guidance_scale": 7.5
}'
```

---

## 2. 请求参数详解

以下是 Request Body 中支持的主要参数。请注意，部分参数仅对特定模型生效。

| 参数名 | 类型 | 必填 | 说明与限制 |
| :--- | :--- | :--- | :--- |
| **`model`** | string | 是 | 指定使用的模型名称（详见下文“支持模型列表”）。 |
| **`prompt`** | string | 是 | 图像生成的文本提示词。建议使用英文描述细节、光影和风格。 |
| **`negative_prompt`** | string | 否 | 负向提示词。描述**不**希望出现在图像中的元素（如 "blurry, low quality"）。<br>*(注：部分模型如 FLUX 对此参数依赖较低)* |
| **`image_size`** | string | 否 | 图像分辨率，格式为 `"宽x高"`（如 `"1024x1024"`）。<br>不同模型有特定的推荐分辨率，详见“分辨率推荐”章节。 |
| **`batch_size`** | integer | 否 | 单次生成的图片数量。默认为 1。<br>范围：`1 <= x <= 4`<br>*(注：文档标注主要适用于 Kolors，部分其他模型可能支持)* |
| **`seed`** | integer | 否 | 随机种子，用于重现结果。<br>范围：`0 <= x <= 9999999999` |
| **`num_inference_steps`** | integer | 否 | 推理步数，控制生成质量与速度。默认 20。<br>范围：`1 <= x <= 100` |
| **`guidance_scale`** | number | 否 | (CFG Scale) 提示词遵循度。值越高越严格遵循提示词，值越低创造性越强。<br>**默认**: 7.5<br>**范围**: `0 <= x <= 20`<br>*(主要适用于 Kolors 等模型)* |
| **`image`** | string | 否 | 用于**图生图**或**图像编辑**的参考原图。<br>支持 URL 链接或 Base64 字符串 (`data:image/png;base64, ...`)。 |

### 特定模型专用参数

*   **`cfg`**: 
    *   仅适用于 `Qwen/Qwen-Image` 系列。
    *   范围：`0.1 <= x <= 20`。
    *   官方建议：通常配合 50 步推理使用，推荐 CFG 为 4.0。

*   **`image2`, `image3`**:
    *   仅适用于 `Qwen/Qwen-Image-Edit-2509` 等多图编辑场景。

---

## 3. 支持模型列表

支持的模型可能会随时更新，请以[模型广场](https://cloud.siliconflow.cn/models)为准。以下为常见模型：

### Black Forest Labs (FLUX 系列)
当前最强的开源生图模型系列，以极其优秀的提示词遵循能力和画质著称。
*   `black-forest-labs/FLUX.1-dev` (推荐)
*   `black-forest-labs/FLUX.1-schnell` (极速版)
*   `black-forest-labs/FLUX.1-pro`
*   `black-forest-labs/FLUX-1.1-pro`

### Kwai (快手可图)
对中文提示词理解能力极佳，擅长中国文化风格。
*   `Kwai-Kolors/Kolors`

### Qwen (通义万相)
支持图生图和强大的图像编辑能力。
*   `Qwen/Qwen-Image`
*   `Qwen/Qwen-Image-Edit`

### Stability AI
*   `stabilityai/stable-diffusion-3-medium`
*   `stabilityai/stable-diffusion-xl-base-1.0`

---

## 4. 分辨率配置推荐

为了获得最佳生成效果，建议根据模型训练时的原声比例设置 `image_size`。

### 针对 Kwai-Kolors 模型
*   `1024x1024` (1:1) - *最推荐*
*   `960x1280` (3:4)
*   `768x1024` (3:4)
*   `720x1440` (1:2)
*   `720x1280` (9:16)

### 针对 Qwen-Image 模型
*   `1328x1328` (1:1)
*   `1664x928` (16:9)
*   `928x1664` (9:16)
*   `1472x1140` (4:3)
*   `1140x1472` (3:4)

*(注：对于 FLUX 系列，通常推荐 `1024x1024`, `1024x768`, `768x1024` 等常规分辨率)*

---

## 5. 响应结构 (Response)

API 返回标准的 JSON 格式响应：

```json
{
  "created": 1721234567,
  "data": [
    {
      "url": "https://sf-generated-image.s3.amazonaws.com/..."
    }
  ],
  "timings": {
    "inference": 0.85 // 推理耗时(秒)
  },
  "seed": 4999999999
}
```

*   **`data`**: 包含生成图片对象的数组。
    *   **`url`**: 图片的下载链接。**注意：链接有效期通常为 1 小时，请生成后立即下载保存。**
*   **`timings`**: 生成耗时统计。
*   **`seed`**: 实际使用的随机种子（如果请求中未指定，则为随机生成的值）。

---

## 6. 提示词 (Prompt) 技巧

为了获得更高质量的图片，建议遵循以下原则：

1.  **具体描述**: 不要只写 "sunset" (日落)，试着写 "a serene beach at sunset, orange sky, gentle waves, small boat in distance" (宁静的海滩日落，橙色天空，轻柔海浪，远处的轻舟)。
2.  **设定风格**: 明确画风，如 "cyberpunk" (赛博朋克), "impressionist oil painting" (印象派油画), "photorealistic" (照片级真实)。
3.  **修饰词**: 使用高质量修饰词，如 "4k", "highly detailed", "cinematic lighting", "masterpiece"。
4.  **负向提示 (Negative Prompt)**: 排除不需要的元素，如 "deformed", "ugly", "blur", "low quality"。

---

*以上文档整理自 SiliconFlow 官方公开文档，具体参数限制可能会随平台更新而调整。*