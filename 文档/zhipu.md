这是一份基于智谱AI开放平台（BigModel）官方文档整理的**CogView 图像生成 API 详尽文档**。本文档整合了模型介绍、调用方式、参数详解、鉴权机制及错误处理等核心内容。

---

# [HEADER]智谱AI - 图像生成 API 文档 (CogView)[/HEADER]

## 1. 产品概述

**CogView** 是智谱AI推出的高性能图像生成模型系列。其中 **CogView-4** 是首个支持生成汉字的开源文生图模型，具备强大的语义理解能力和中英文字生成能力。

### 核心能力
*   **多语言支持**：支持中英双语提示词（Prompt），尤其优化了中文理解。
*   **文字生成**：能够在画面中准确生成指定的汉字和英文字符（SOTA级别）。
*   **灵活分辨率**：支持任意比例分辨率（推荐使用预设比例以获得最佳效果）。
*   **高美学质量**：在色彩、光影、构图等方面表现出色，适配商业、艺术等多种场景。

### 可用模型列表

| 模型编码 (`model`) | 描述 | 计费标准 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **cogview-4-250304** | 最新旗舰模型，支持更高质量（HD）及文字生成 | 0.06 元 / 次 | 广告、海报、复杂文字渲染 |
| **cogview-4** | 通用版本，平衡性能与速度 | 0.06 元 / 次 | 通用文生图 |
| **cogview-3-flash** | 极速版，生成速度快，成本低 | (请参考平台报价) | 实时交互、批量生成 |

---

## 2. 鉴权与接入

### 2.1 API Endpoint (端点)
所有请求均发送至智谱AI PaaS v4 接口：
`https://open.bigmodel.cn/api/paas/v4/images/generations`

### 2.2 身份验证 (Authentication)
采用标准 **HTTP Bearer** 认证方式。
你需要前往 [API Keys 管理页面](https://bigmodel.cn/usercenter/proj-mgmt/apikeys) 获取 API Key。

**请求头格式**：
```http
Authorization: Bearer <YOUR_API_KEY>
Content-Type: application/json
```
*(注：建议将 API Key 存储在环境变量中，避免硬编码)*

---

## 3. API 接口详解

### 3.1 请求结构 (POST)

**URL**: `https://open.bigmodel.cn/api/paas/v4/images/generations`

#### [TABLE]请求参数说明[/TABLE]

| 参数名 | 类型 | 必填 | 默认值 | 说明与约束 |
| :--- | :--- | :--- | :--- | :--- |
| **model** | `string` | **是** | - | 模型编码，可选值：<br>`cogview-4-250304`<br>`cogview-4`<br>`cogview-3-flash` |
| **prompt** | `string` | **是** | - | 图像生成的文本描述（提示词）。<br>支持中英文，建议描述画面主体、风格、光影、细节等。 |
| **size** | `string` | 否 | `1024x1024` | 图像分辨率。<br>**推荐枚举值**：`1024x1024`, `768x1344`, `864x1152`, `1344x768`, `1152x864`, `1440x720`, `720x1440`<br>**自定义规则**：长宽均需在 `512px` - `2048px` 之间，且必须被 16 整除，总像素不超过 `2^21`。 |
| **quality** | `string` | 否 | `standard` | 图像质量（仅 `cogview-4-250304` 支持）。<br>`header`: **hd** (耗时约20秒，细节更丰富)<br>`standard`: **standard** (耗时约5-10秒，快速生成) |
| **user_id** | `string` | 否 | - | 终端用户的唯一标识 ID，用于安全审计和风控。<br>长度要求：6 - 128 字符。 |
| **watermark_enabled**| `boolean`| 否 | `true` | 是否启用图片水印。<br>`true`: 启用显式及隐式水印（默认，符合法规要求）。<br>`false`: 关闭水印（需在后台签署免责声明后方可使用）。 |

### 3.2 响应结构

接口返回标准的 JSON 对象。

#### [TABLE]响应字段说明[/TABLE]

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| **created** | `integer` | 请求创建的时间戳（秒级 Unix 时间戳）。 |
| **data** | `array` | 图片结果数组（目前通常只包含 1 张图片）。 |
| └ **url** | `string` | **图片下载链接**。链接有效期为 **30天**，请及时转存。 |
| **content_filter** | `array` | 内容安全过滤结果信息。 |
| └ **role** | `string` | 触发过滤的角色：`assistant` (生成内容), `user` (用户输入)。 |
| └ **level** | `integer` | 违规严重程度：`0`(严重) - `3`(轻微)。 |

---

## 4. 调用示例

### 4.1 cURL 命令行

```bash
curl --request POST \
  --url https://open.bigmodel.cn/api/paas/v4/images/generations \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "cogView-4-250304",
    "prompt": "一只未来的赛博朋克风格猫咪，霓虹灯背景，高细节，4k",
    "size": "1024x1024",
    "quality": "hd"
  }'
```

### 4.2 Python SDK (最新版 `zai-sdk`)

```python
# pip install zai-sdk
from zai import ZhipuAiClient

client = ZhipuAiClient(api_key="YOUR_API_KEY")

response = client.images.generations(
    model="cogView-4-250304",
    prompt="一幅中国山水画，水墨风格，高山流水，云雾缭绕",
    size="1024x1024"
)

# 打印图片链接
if response.data:
    print(response.data[0].url)
```

### 4.3 Python SDK (旧版 `zhipuai`)

```python
# pip install zhipuai
from zhipuai import ZhipuAI

client = ZhipuAI(api_key="YOUR_API_KEY")

response = client.images.generations(
    model="cogview-4",
    prompt="A cute robot playing chess in a park",
    size="1024x1024"
)

print(response.data[0].url)
```

---

## 5. 错误码与故障排查

当请求失败时，API 会返回 HTTP 状态码及 Response Body 中的业务错误码。

### 5.1 常用 HTTP 状态码

*   **200**: 成功。
*   **400**: 参数错误（如 prompt 为空，size 不符合规范）。
*   **401**: 鉴权失败（API Key 错误或过期）。
*   **429**: 触发限流（并发超额或余额不足）。
*   **500**: 服务器内部错误。

### 5.2 业务错误码 (JSON Body)

如果 HTTP 状态码不为 200，请解析 JSON 中的 `error` 字段。

| 错误码 | 错误信息示例 | 含义与处理 |
| :--- | :--- | :--- |
| **1001** | Header中未收到Authentication参数 | 请求头缺失 Authorization。 |
| **1002** | Authentication Token非法 | API Key 格式错误。 |
| **1113** | 您的账户已欠费 | 余额不足，请充值。 |
| **1210** | API调用参数有误 | 检查 prompt 长度或 size 规格。 |
| **1211** | 模型不存在 | 检查 `model` 字段拼写（如 cogview-4）。 |
| **1301** | 系统检测到输入... | **内容风控拦截**。Prompt 包含敏感词，请修改后重试。 |
| **1302** | 并发数过高 | 当前 API 调用并发超过了账户等级限制。 |
| **1305** | 已触发流量限制 | 账户当前的吞吐量达到上限。 |

---

## 6. [TOC]目录[/TOC]

*   1. 产品概述
*   2. 鉴权与接入
*   3. API 接口详解
    *   3.1 请求结构
    *   3.2 响应结构
*   4. 调用示例
*   5. 错误码与故障排查
*   6. 目录

---

### [HEADER]附录：并发限制[/HEADER]

不同等级用户的并发（同时进行的任务数）限制如下：

| 用户等级 | V0 (免费/实名) | V1 | V2 | V3 |
| :--- | :--- | :--- | :--- | :--- |
| **并发数** | 5 | 10 | 15 | 20 |

> **提示**：生成的图片 URL 有效期仅 30 天，建议在业务系统中将图片下载并持久化存储到自己的 OSS 服务器中。