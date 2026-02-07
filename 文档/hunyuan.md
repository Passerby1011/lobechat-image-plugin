这里为您整理的一份详尽完善的**腾讯混元生图 API 技术文档**。该文档基于腾讯云官方最新资料（混元极速版、混元 3.0、API 3.0 标准）汇总整理，涵盖了从接入准备、鉴权机制到核心接口详解及错误码的全链路内容。

---

# 腾讯混元生图 API 开发文档

**更新时间**：2026-01-02
**API 版本**：2022-12-29
**通信协议**：HTTPS / POST

## 1. 产品简介
腾讯混元生图（Hunyuan Image Generation）是腾讯自主研发的 AI 图像生成服务，基于强大的混元大模型，支持通过文本描述智能生成高质量图像。

本服务提供多种版本的接口以满足不同场景需求：
*   **混元生图（极速版）**：同步接口，生成速度快，适合实时性要求高的互动场景（如C端用户生成）。
*   **混元生图（3.0 版）**：异步接口，画质更精细，语义理解更强，适合专业内容创作、广告素材生成等高质量场景。

---

## 2. 接入准备

### 2.1 服务地址 (Endpoint)
*   **接入域名**：`aiart.tencentcloudapi.com`
*   **建议**：推荐使用就近地域接入域名（如 `aiart.ap-guangzhou.tencentcloudapi.com`）以降低延迟。

### 2.2 通信协议
*   所有接口均通过 **HTTPS** 进行通信。
*   请求方法推荐使用 **POST**。
*   请求头 Content-Type：`application/json`

### 2.3 账号与密钥
调用 API 前，请前往 [腾讯云访问管理](https://console.cloud.tencent.com/cam/capi) 获取密钥对：
*   **SecretId**：用于标识 API 调用者身份。
*   **SecretKey**：用于加密签名字符串和服务器端验证签名字符串的密钥。

---

## 3. 调用方式与公共参数

每次请求均需携带公共参数，用于标识用户身份和接口信息。推荐使用 **签名方法 v3 (TC3-HMAC-SHA256)**。

### 3.1 HTTP 请求头 (Header) 公共参数

| 参数名称 | 必选 | 类型 | 描述 |
| :--- | :--- | :--- | :--- |
| **X-TC-Action** | 是 | String | 操作的接口名称（如 `TextToImageLite` 或 `SubmitTextToImageJob`）。 |
| **X-TC-Version** | 是 | String | API 版本号，本产品固定为 `2022-12-29`。 |
| **X-TC-Region** | 否 | String | 地域参数（如 `ap-guangzhou`, `ap-shanghai`）。 |
| **X-TC-Timestamp** | 是 | Integer | 当前 UNIX 时间戳（秒），例如 `1529223702`。有效期通常为5分钟。 |
| **Authorization** | 是 | String | 签名认证信息，格式详见下方签名算法。 |
| **Content-Type** | 是 | String | 固定为 `application/json`。 |

### 3.2 签名算法 v3 (Authorization 生成)
Authorization 字符串格式如下：
`TC3-HMAC-SHA256 Credential={SecretId}/{Date}/{Service}/tc3_request, SignedHeaders={SignedHeaders}, Signature={Signature}`

**生成步骤简述**：
1.  **拼接规范请求串**：`HTTPRequestMethod + \n + CanonicalURI + ...`
2.  **拼接待签名字符串**：`TC3-HMAC-SHA256 + \n + Timestamp + ...`
3.  **计算签名**：使用 SecretKey 推导出的 SigningKey 对待签名字符串进行 HMAC-SHA256 加密。
4.  **拼接 Header**：将计算出的 Signature 拼接到 Authorization 头部。

> **💡 提示**：强烈建议直接使用腾讯云官方 SDK（Python/Java/Go/Node.js 等），SDK 已内置复杂的签名计算逻辑，无需手动实现。

---

## 4. 核心接口详解

### 4.1 混元生图（极速版）
**接口名称**：TextToImageLite
**功能**：同步接口，输入文本描述，快速返回生成图片的 Base64 或 URL。

| 特性 | 说明 |
| :--- | :--- |
| **耗时** | 较快（秒级返回） |
| **场景** | 头像生成、即时配图、C端娱乐 |
| **并发** | 默认 1 并发（需顺序处理） |

#### 请求参数 (Body)
| 参数名 | 必选 | 类型 | 描述 | 示例值 |
| :--- | :--- | :--- | :--- | :--- |
| Prompt | 是 | String | 正向提示词，推荐使用中文。最多 1024 字符。 | "一只在雨中漫步的小猫，水彩风格" |
| NegativePrompt | 否 | String | 反向提示词，减少生成结果中出现的内容。 | "模糊，低质量" |
| Resolution | 否 | String | 分辨率，支持 1:1, 3:4, 16:9 等多种比例。默认 `1024:1024`。 | "768:1024" |
| Seed | 否 | Integer | 随机种子。不传或传0表示随机，传入正数可固定画面结构。 | 123456 |
| RspImgType | 否 | String | 返回图像格式。可选 `base64` (默认) 或 `url` (1小时有效)。 | "url" |
| LogoAdd | 否 | Integer | 是否添加水印标识。1:添加(默认)，0:不添加。 | 0 |

#### 返回参数
| 参数名 | 类型 | 描述 |
| :--- | :--- | :--- |
| ResultImage | String | 生成的图片数据（Base64 字符串或 URL）。 |
| Seed | Integer | 实际使用的随机种子。 |
| RequestId | String | 唯一请求 ID。 |

#### 请求示例 (JSON)
```json
{
  "Prompt": "赛博朋克风格的未来城市街道，霓虹灯",
  "RspImgType": "url",
  "Resolution": "1024:768"
}
```

---

### 4.2 混元生图 3.0 (异步任务)
混元 3.0 模型效果更佳，但生成耗时较长，因此采用 **"提交任务 -> 查询结果"** 的异步模式。

#### 第一步：提交任务 (SubmitTextToImageJob)
**功能**：提交一个生图任务，获取任务 ID (JobId)。

| 参数名 | 必选 | 类型 | 描述 |
| :--- | :--- | :--- | :--- |
| Prompt | 是 | String | 文本描述。最多 1024 字符。 |
| Resolution | 否 | String | 分辨率。默认 `1024:1024`，最高支持 2048x2048 (需乘积<=1024*1024)。 |
| Revise | 否 | Integer | 是否开启 Prompt 智能改写（推荐开启）。1:开启(默认)，0:关闭。 |
| LogoAdd | 否 | Integer | 是否添加水印。1:添加(默认)，0:不添加。 |

**返回示例**：
```json
{
    "Response": {
        "JobId": "1344213737283272704",
        "RequestId": "af61e1d4-0931..."
    }
}
```

#### 第二步：查询结果 (QueryTextToImageJob)
**功能**：根据 JobId 查询任务状态和生成结果。

| 参数名 | 必选 | 类型 | 描述 |
| :--- | :--- | :--- | :--- |
| JobId | 是 | String | 提交接口返回的任务 ID。 |

**返回参数**：
| 参数名 | 类型 | 描述 |
| :--- | :--- | :--- |
| JobStatusCode | String | 任务状态码：**1**:等待中, **2**:运行中, **4**:失败, **5**:完成。 |
| JobStatusMsg | String | 状态描述（如“处理完成”）。 |
| ResultImage | Array | 生成结果 URL 列表（String数组）。有效期1小时。 |
| RevisedPrompt | Array | 智能改写后的实际提示词（仅在开启改写时返回）。 |
| JobErrorMsg | String | 如果失败，此处显示错误原因。 |

---

## 5. 关键数据结构

### LogoParam (自定义水印)
用于自定义生成图右下角的标识（需部分接口支持 `LogoParam` 参数）。

| 字段名 | 类型 | 描述 |
| :--- | :--- | :--- |
| LogoUrl | String | 水印图片的 URL 地址。 |
| LogoRect | Object | 水印位置和大小 (X, Y, Width, Height)。 |

---

## 6. 错误码与排查

当 API 调用失败时，Response 中会包含 `Error` 对象。

### 6.1 常见公共错误码
*   **AuthFailure.SignatureFailure**: 签名验证失败。请检查 SecretKey、时间戳及 Header 中的字段拼写。
*   **RequestLimitExceeded**: 请求频率超限。默认 QPS 限制约为 20/秒（具体视账户等级而定）。
*   **ResourceUnavailable.LowBalance**: 账户余额不足。
*   **InvalidParameterValue**: 参数值非法（如分辨率不支持、Prompt过长）。

### 6.2 业务相关错误码
| 错误码 | 含义 | 建议 |
| :--- | :--- | :--- |
| **OperationDenied.ImageIllegalDetected** | 生成图片包含违规信息 | 尝试修改 Prompt，避免敏感词汇。 |
| **OperationDenied.TextIllegalDetected** | 输入文本包含违规信息 | 检查输入文本，去除敏感词。 |
| **FailedOperation.JobNotExist** | 任务不存在 | 检查 JobId 是否正确，或任务是否已过期（太久前的任务可能无法查询）。 |
| **RequestLimitExceeded.JobNumExceed** | 同时处理任务过多 | 稍后重试，建议实现指数退避重试机制。 |

---

## 7. 最佳实践建议

1.  **异步轮询策略**：
    对于 3.0 接口，建议每隔 **1-2秒** 轮询一次 Query 接口，直到 `JobStatusCode` 变为 `5` (成功) 或 `4` (失败)。避免高频轮询触发限流。
2.  **结果保存**：
    接口返回的图片 URL 通常有 **1小时有效期**。请务必在获取结果后，将其转存到您自己的对象存储（COS）或服务器中，不要直接依赖临时 URL。
3.  **Prompt 优化**：
    *   虽然支持中文，但生图模型对具体的描述词（如：风格、光照、视角）更敏感。
    *   建议开启 `Revise` 参数，让大模型自动优化您的提示词以获得更好效果。
4.  **异常处理**：
    务必处理敏感词审核失败的情况（`OperationDenied`），在 UI 上给予用户友好的提示。