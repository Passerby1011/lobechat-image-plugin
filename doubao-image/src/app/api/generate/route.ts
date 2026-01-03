import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  getPluginSettingsFromRequest,
  PluginErrorType,
} from "@lobehub/chat-plugin-sdk";
import axios, { AxiosError } from "axios";
import { put } from "@vercel/blob"; // 用于存储 base64 图片
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto'; // 用于生成火山引擎 API 签名
import {
  DoubaoImageSettings,
  IDoubaoImageGenerationRequest,
  IDoubaoImageGenerationResponse,
  IDoubaoImageGenerationDataItem
} from "@/type"; // 确保你的类型定义文件路径正确

// --- 火山引擎 API 配置 ---
const VOLC_API_HOST = "visual.volcengineapi.com";
const VOLC_API_PATH = "/"; // 基础路径
const VOLC_API_ACTION = "CVProcess";
const VOLC_API_VERSION = "2022-08-31";
const VOLC_SERVICE_NAME = "cv"; // 根据 manifest.json 的修改，这里硬编码
const VOLC_REGION = "cn-north-1"; // 根据 manifest.json 的修改，这里硬编码

// 帮助函数：生成火山引擎 API 签名
// ... (签名函数 getVolcengineSignature 和 getSigningKey 保持不变)
function getVolcengineSignature(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string,
  method: string,
  path: string,
  queryParams: Record<string, string | number | boolean>,
  body: string, // JSON stringified body
  headers: Record<string, string>
): Record<string, string> {
  const algorithm = "HMAC-SHA256";
  const isoDate = new Date().toISOString().replace(/-|:|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const shortDate = isoDate.substring(0, 8); // YYYYMMDD

  // 1. 创建规范请求 (Canonical Request)
  const httpRequestMethod = method.toUpperCase();
  const canonicalURI = path;

  // Canonical Query String
  const sortedQueryKeys = Object.keys(queryParams).sort();
  const canonicalQueryString = sortedQueryKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(queryParams[key]))}`)
    .join('&');

  // Canonical Headers
  const signedHeaders: string[] = [];
  let canonicalHeaders = "";
  const headersToSign: Record<string, string> = {
    'host': VOLC_API_HOST,
    'x-date': isoDate,
    ...Object.keys(headers)
      .filter(key => key.toLowerCase().startsWith('x-') || ['host', 'content-type'].includes(key.toLowerCase()))
      .reduce((obj, key) => {
        obj[key.toLowerCase()] = String(headers[key]).trim();
        return obj;
      }, {} as Record<string, string>)
  };

  Object.keys(headersToSign).sort().forEach(key => {
    canonicalHeaders += `${key}:${headersToSign[key]}\n`;
    signedHeaders.push(key);
  });
  const signedHeadersString = signedHeaders.join(';');
  const hashedPayload = crypto.createHash('sha256').update(body).digest('hex');
  const canonicalRequest = [
    httpRequestMethod,
    canonicalURI,
    canonicalQueryString,
    canonicalHeaders,
    signedHeadersString,
    hashedPayload
  ].join('\n');

  // 2. 创建待签名的字符串 (String to Sign)
  const credentialScope = `${shortDate}/${region}/${service}/request`;
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = [
    algorithm,
    isoDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');

  // 3. 计算签名 (Signature)
  const signingKey = getSigningKey(secretAccessKey, shortDate, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  // 4. 构建 Authorization Header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersString}, Signature=${signature}`;

  return {
    'Authorization': authorizationHeader,
    'X-Date': isoDate,
    'Content-Type': 'application/json',
  };
}

function getSigningKey(secretKey: string, dateStamp: string, regionName: string, serviceName: string) {
  const kDate = crypto.createHmac('sha256', secretKey).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
  return crypto.createHmac('sha256', kService).update('request').digest();
}

export async function POST(req: NextRequest) {
  try {
    // 1. 从请求中获取插件设置 (AK/SK)
    // ... (代码保持不变)
    const settings = getPluginSettingsFromRequest<DoubaoImageSettings>(req);
    if (!settings) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "插件设置未找到 (Plugin settings not found).",
      });
    }

    const { VOLC_ACCESS_KEY_ID, VOLC_SECRET_ACCESS_KEY } = settings;
    if (!VOLC_ACCESS_KEY_ID || !VOLC_SECRET_ACCESS_KEY) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
        message: "火山引擎 Access Key ID 或 Secret Access Key 未配置。",
      });
    }

    // 2. 解析请求参数 (来自 manifest.json 定义的 parameters)
    // ... (代码保持不变)
    const body = await req.json() as IDoubaoImageGenerationRequest;
    const {
      prompt,
      req_key = 'high_aes_general_v30l_zt2i', 
      response_format = 'url', 
      seed = -1,
      scale = 3.5,
      ddim_steps = 25,
      width = 512,
      height = 512,
      use_pre_llm = true,
      use_sr = true,
    } = body;

    if (!prompt) {
      // 对于非必须的prompt，如果LLM没有提供，这里不应该直接报错，
      // 而是应该由 manifest.json 的 required 字段和 LLM 的调用逻辑来保证
      // 但如果 prompt 在 manifest 中是 required，这里检查是合理的
      const missingPromptError: IDoubaoImageGenerationResponse = {
        created: Math.floor(Date.now() / 1000),
        data: [],
        error: {
          message: "参数 'prompt' 是必须的，但未提供。",
          code: "MissingRequiredParameter",
          type: "PluginInputError"
        }
      };
      return NextResponse.json(missingPromptError, { status: 400 });
    }

    // 3. 构建调用火山引擎 API 的请求体
    // ... (代码保持不变)
    const volcRequestBody: Record<string, any> = {
      req_key: req_key,
      prompt: prompt,
      seed: seed,
      scale: scale,
      ddim_steps: ddim_steps,
      width: width,
      height: height,
      use_pre_llm: use_pre_llm,
      use_sr: use_sr,
      return_url: response_format === 'url', 
    };
    const volcRequestBodyString = JSON.stringify(volcRequestBody);

    // 4. 准备 Query 参数和 Headers，并生成签名
    // ... (代码保持不变)
    const queryParams = {
      Action: VOLC_API_ACTION,
      Version: VOLC_API_VERSION,
    };
    const initialHeaders = {
      'Content-Type': 'application/json',
      'Host': VOLC_API_HOST, 
    };
    const signedHeaders = getVolcengineSignature(
      VOLC_ACCESS_KEY_ID,
      VOLC_SECRET_ACCESS_KEY,
      VOLC_REGION,
      VOLC_SERVICE_NAME,
      "POST",
      VOLC_API_PATH,
      queryParams,
      volcRequestBodyString,
      initialHeaders
    );

    // 5. 调用火山引擎 API
    // ... (代码保持不变)
    const volcApiUrl = `https://${VOLC_API_HOST}${VOLC_API_PATH}`;
    console.log("向火山引擎发送请求:", volcApiUrl, "Query:", queryParams, "Body:", volcRequestBody);
    console.log("签名后的 Headers:", signedHeaders);
    const volcResponse = await axios.post(volcApiUrl, volcRequestBodyString, {
      params: queryParams,
      headers: signedHeaders,
      timeout: 60000, 
    });

    // 6. 处理火山引擎 API 响应
    // ... (错误处理代码保持不变)
    if (volcResponse.data.ResponseMetadata?.Error || volcResponse.data.code !== 10000) {
      const errorData = volcResponse.data.ResponseMetadata?.Error || {
        CodeN: volcResponse.data.code,
        Message: volcResponse.data.message || "火山引擎 API 返回未知错误。"
      };
      console.error("火山引擎 API 错误:", errorData);
      if (errorData.CodeN === 50412 || (typeof errorData.Message === 'string' && errorData.Message.includes("Text Risk Not Pass"))) {
         const contentModerationErrorPayload: IDoubaoImageGenerationResponse = {
            created: Math.floor(Date.now() / 1000),
            data: [],
            error: {
              message: `### 图像生成失败\n\n**原因**: 您的提示词未能通过内容安全审核 (错误码: ${errorData.CodeN})。请修改后重试。`,
              code: errorData.CodeN,
              type: "VolcEngineContentModerationError"
            }
          };
         return NextResponse.json(contentModerationErrorPayload, { status: 400 });
      }
      const volcApiErrorPayload: IDoubaoImageGenerationResponse = { 
        created: Math.floor(Date.now() / 1000),
        data: [], 
        error: {
          message: `火山引擎 API 错误: ${errorData.Message} (Code: ${errorData.CodeN})`,
          code: errorData.CodeN,
          type: "VolcEngineAPIError"
        }
      }; 
      return NextResponse.json(
        volcApiErrorPayload,
        { status: volcResponse.status === 200 ? 500 : volcResponse.status },
      );
    }

    const volcResultData = volcResponse.data.data;
    if (!volcResultData) {
        console.error("火山引擎 API 响应中缺少 'data' 字段:", volcResponse.data);
        const missingDataErrorPayload: IDoubaoImageGenerationResponse = { 
            created: Math.floor(Date.now() / 1000),
            data: [], 
            error: {
                message: "火山引擎 API 响应格式不正确，缺少 'data' 字段。",
                type: "InvalidVolcResponse"
            }
        }; 
        return NextResponse.json(missingDataErrorPayload, { status: 500 });
    }

    // 7. 处理图片数据 (URL 或 Base64) 并上传到 Blob 存储 (如果需要)
    let markdownResponse = ""; // 用于 LobeChat SDK 的 markdown 响应 (如果SDK需要)
    const responseDataItems: IDoubaoImageGenerationDataItem[] = [];

    const imageUrls = volcResultData.image_urls || [];
    const base64Images = volcResultData.binary_data_base64 || [];
    const revisedPrompt = volcResultData.rephraser_result;

    if (response_format === 'url' && imageUrls.length > 0) {
      for (const originalUrl of imageUrls) { // Renamed 'url' to 'originalUrl' to avoid conflict
        try {
          console.log(`下载图片从 URL: ${originalUrl}`);
          const imageResponse = await axios.get(originalUrl, {
            responseType: "arraybuffer", // 获取二进制数据
            timeout: 30000 // 30秒下载超时
          });

          const imageBuffer = Buffer.from(imageResponse.data);
          // 从下载响应中获取 Content-Type，如果获取不到则默认 image/png
          const contentType = imageResponse.headers['content-type'] || 'image/png';
          const fileExt = contentType.split('/').pop() || 'png'; // 从 Content-Type 推断文件扩展名
          const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}.${fileExt}`;

          console.log(`上传图片到 Blob: ${uniqueFilename}, Content-Type: ${contentType}`);
          const blob = await put(`images/${uniqueFilename}`, imageBuffer, {
            access: 'public',
            contentType: contentType,
            addRandomSuffix: false, // 我们已经确保了文件名唯一
          });

          console.log(`图片上传成功，Blob URL: ${blob.url}`);
          markdownResponse += `![Generated Image](${blob.url})\n`;
          responseDataItems.push({ url: blob.url, revised_prompt: revisedPrompt });

        } catch (imgProcessingError) {
          console.error(`处理火山引擎返回的图片URL ${originalUrl} 失败:`, imgProcessingError);
          // 如果一张图片处理失败，可以选择记录错误并继续处理下一张，或者直接抛出错误
          // 这里我们选择记录并跳过这张图片
          markdownResponse += `![Error Processing Image from ${originalUrl}](URL_PROCESSING_ERROR)\n`; // Placeholder for error
          responseDataItems.push({ url: originalUrl, revised_prompt: revisedPrompt, error: `Failed to process image from URL: ${originalUrl}` });
        }
      }
    } else if (response_format === 'b64_json' && base64Images.length > 0) {
      for (const b64Data of base64Images) {
        try {
          const imageBuffer = Buffer.from(b64Data, 'base64');
          // 对于 base64，我们通常需要预设或尝试检测 Content-Type
          // 火山引擎API文档未指明 base64 图片类型，这里假设 png
          const contentType = 'image/png';
          const fileExt = 'png';
          const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}.${fileExt}`;

          console.log(`上传 Base64 图片到 Blob: ${uniqueFilename}`);
          const blob = await put(`doubao-images/${uniqueFilename}`, imageBuffer, {
            access: 'public',
            contentType: contentType,
            addRandomSuffix: false,
          });

          console.log(`Base64 图片上传成功，Blob URL: ${blob.url}`);
          markdownResponse += `![Generated Image](${blob.url})\n`;
          // 在 data item 中同时保留 b64_json (如果需要) 和上传后的 url
          responseDataItems.push({ b64_json: "REDACTED_FOR_ brevity", /* b64Data, */ url: blob.url, revised_prompt: revisedPrompt });
        } catch (imgProcessingError) {
          console.error("处理 base64 图片并上传失败:", imgProcessingError);
          markdownResponse += `![Error Processing Base64 Image](B64_PROCESSING_ERROR)\n`;
          responseDataItems.push({ b64_json: "ERROR", revised_prompt: revisedPrompt, error: "Failed to process base64 image" });
        }
      }
    } else if (imageUrls.length === 0 && base64Images.length === 0) {
       console.warn("火山引擎 API 未返回任何图片数据。Response:", volcResultData);
       // 即使没有图片，也可能需要返回修订后的 prompt (如果存在)
    }

    if (responseDataItems.length === 0 && !revisedPrompt) {
      const noImageErrorPayload: IDoubaoImageGenerationResponse = {
        created: Math.floor(Date.now() / 1000),
        data: [],
        error: {
          message: "未能生成任何图像或获取修订后的提示词。",
          type: "NoImageGenerated"
        }
      };
      return NextResponse.json(noImageErrorPayload, { status: 500 });
    }

    // 8. 构建最终响应
    // markdownResponse 字符串主要用于 LobeChat SDK 的直接 Markdown 显示
    // 如果 revisedPrompt 存在，并且有成功处理的图片，可以附加到 markdownResponse
    if (revisedPrompt && responseDataItems.some(item => !item.error && item.url)) {
      markdownResponse += `\n\n*原始提示词: ${prompt}*\n*火山引擎修订后提示词: ${revisedPrompt}*`;
    } else if (revisedPrompt && responseDataItems.length === 0) {
      // 如果只有修订后的 prompt，没有图片
      markdownResponse = `*原始提示词: ${prompt}*\n*火山引擎修订后提示词: ${revisedPrompt}*`;
    }

    const finalResponse: IDoubaoImageGenerationResponse = {
      created: Math.floor(Date.now() / 1000),
      data: responseDataItems,
      // LobeChat SDK 可能会使用 markdownResponse 字段来渲染，
      // 但我们的 IDoubaoImageGenerationResponse 接口没有这个字段。
      // 通常 SDK 会从 data 字段构建显示内容。
      // 如果需要显式传递 markdown, 需要修改接口或使用 SDK 的特定方式。
      // (LobeChat SDK 示例中，有时直接返回 { markdown: markdownResponse })
      // 这里我们坚持返回符合 IDoubaoImageGenerationResponse 的结构。
    };

    // LobeChat SDK 通常期望一个包含 markdown 字段的 JSON 对象，或者它会自己根据 data 生成
    // 为了兼容性，可以考虑返回一个包含 markdown 的对象，但这会偏离我们定义的 IDoubaoImageGenerationResponse
    // 查阅 LobeChat SDK 文档，确认其期望的响应格式。
    // 如果 SDK 能够处理 IDoubaoImageGenerationResponse 中的 data 字段来生成预览，则以下是正确的：
    return NextResponse.json(finalResponse);

    // 如果 LobeChat SDK 严格需要 { markdown: "..." } 结构，则需要调整：
    // return NextResponse.json({ markdown: markdownResponse });
    // 但这样会丢失结构化的 data 和 created 字段，除非 SDK 允许更复杂的结构。

  } catch (error) {
    console.error("插件内部错误:", error);
    let status = 500;
    let message = "插件内部发生未知错误。";
    let errorCode: string | number | undefined = undefined;
    let errorType: string | undefined = "PluginInternalError";

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      status = axiosError.response?.status || 500;
      message = axiosError.response?.data?.message || axiosError.message || "调用外部服务失败。";
      if (axiosError.response?.data?.code) errorCode = axiosError.response.data.code;
      if (axiosError.response?.data?.error?.type) errorType = axiosError.response.data.error.type;

      if (status === 401 || status === 403) {
        // 对于认证错误，使用 createErrorResponse 更符合 LobeChat SDK 规范
        return createErrorResponse(PluginErrorType.PluginSettingsInvalid, {
          message: "火山引擎认证失败，请检查 Access Key ID 和 Secret Access Key 是否正确且有效。",
          errorInfo: { messageFromUpstream: message, codeFromUpstream: status } // 传递上游错误信息
        });
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    const errorResponse: IDoubaoImageGenerationResponse = {
      created: Math.floor(Date.now() / 1000),
      data: [],
      error: {
        message: message,
        code: errorCode || status,
        type: errorType,
      }
    };
    return NextResponse.json(errorResponse, { status });
  }
}
