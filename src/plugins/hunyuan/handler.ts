import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import * as CryptoJS from "crypto-js";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const AIART_HOST = "aiart.tencentcloudapi.com";
const HUNYUAN_HOST = "hunyuan.tencentcloudapi.com";
const AIART_VERSION = "2022-12-29";
const HUNYUAN_VERSION = "2023-09-01";

// 签名逻辑封装
function sign(secretKey: string, date: string, service: string, str: string): string {
  const hmacDate = CryptoJS.HmacSHA256(date, "TC3" + secretKey);
  const hmacService = CryptoJS.HmacSHA256(service, hmacDate);
  const hmacSigning = CryptoJS.HmacSHA256("tc3_request", hmacService);
  return CryptoJS.HmacSHA256(str, hmacSigning).toString(CryptoJS.enc.Hex);
}

function generateTencentCloudHeaders(
  secretId: string, 
  secretKey: string, 
  action: string, 
  payload: string, 
  host: string, 
  version: string,
  service: string = "aiart"
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateObj = new Date(timestamp * 1000);
  const dateStr = dateObj.toISOString().split('T')[0];
  const hashedRequestPayload = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
  const canonicalRequest = [
    "POST", "/", "", "content-type:application/json; charset=utf-8", "host:" + host, "", "content-type;host", hashedRequestPayload
  ].join("\n");
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = dateStr + "/" + service + "/" + "tc3_request";
  const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);
  const stringToSign = [algorithm, timestamp, credentialScope, hashedCanonicalRequest].join("\n");
  const signature = sign(secretKey, dateStr, service, stringToSign);
  const authorization = algorithm + " Credential=" + secretId + "/" + credentialScope + ", SignedHeaders=content-type;host, Signature=" + signature;
  return {
    Authorization: authorization,
    "Content-Type": "application/json; charset=utf-8",
    Host: host,
    "X-TC-Action": action,
    "X-TC-Timestamp": timestamp.toString(),
    "X-TC-Version": version,
    "X-TC-Region": "ap-guangzhou"
  };
}

export const hunyuanHandler: PluginHandler = {
  id: "tencent-hunyuan-image",
  name: "腾讯混元大模型图片生成器",
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const { TENCENT_SECRET_ID, TENCENT_SECRET_KEY } = settings;

    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, { message: '腾讯云 Secret ID 或 Secret Key 缺失。' });
    }

    // --- 参数预处理与模式选择 ---
    const { 
      Prompt, 
      NegativePrompt, 
      Style, 
      Resolution = "1024:1024", 
      Num = 1, 
      Revise = 1, 
      Seed,
      LogoAdd = 0,
      mode = "lite" 
    } = body;

    // 必填项校验
    if (!Prompt) {
      return NextResponse.json({ message: "参数 Prompt (提示词) 是必须的。" }, { status: 400 });
    }

    try {
      let imageUrls: string[] = [];
      let revisedPrompt = "";

      if (mode === "lite") {
        // --- 模式 1: 混元生图极速版 (同步) ---
        const payload = JSON.stringify({ 
          Prompt, 
          NegativePrompt, 
          Resolution, 
          Seed: Seed ? parseInt(String(Seed)) : 0, 
          RspImgType: "url", 
          LogoAdd: parseInt(String(LogoAdd)) === 0 ? 0 : 1
        });
        const headers: any = generateTencentCloudHeaders(
          TENCENT_SECRET_ID, 
          TENCENT_SECRET_KEY, 
          "TextToImageLite", 
          payload, 
          AIART_HOST, 
          AIART_VERSION,
          "aiart"
        );
        
        const response = await fetch(`https://${AIART_HOST}`, {
          method: 'POST',
          headers,
          body: payload
        });

        const result = await response.json();
        if (result.Response?.Error) {
          throw new Error(`腾讯云 API 错误: ${result.Response.Error.Message}`);
        }

        if (result.Response?.ResultImage) {
          const pUrl = await saveImageToStorage(result.Response.ResultImage, "url", "hunyuan-image");
          imageUrls.push(pUrl);
        }
      } else {
        // --- 模式 2: 混元生图 3.0 (异步任务) ---
        const payload = JSON.stringify({ 
          Prompt, 
          NegativePrompt, 
          Style, 
          Resolution,
          Num: parseInt(String(Num)) || 1, 
          Revise: parseInt(String(Revise)) === 0 ? 0 : 1, 
          Seed: Seed ? parseInt(String(Seed)) : 0,
          LogoAdd: parseInt(String(LogoAdd)) === 1 ? 1 : 0
        });
        const headers: any = generateTencentCloudHeaders(
          TENCENT_SECRET_ID, 
          TENCENT_SECRET_KEY, 
          "SubmitHunyuanImageJob", 
          payload, 
          HUNYUAN_HOST, 
          HUNYUAN_VERSION,
          "hunyuan"
        );
        
        const submitResponse = await fetch(`https://${HUNYUAN_HOST}`, {
          method: 'POST',
          headers,
          body: payload
        });

        const submitResult = await submitResponse.json();
        const jobId = submitResult.Response?.JobId;
        if (!jobId) throw new Error(`提交任务失败: ${submitResult.Response?.Error?.Message || "未知错误"}`);

        // 异步查询逻辑
        let queryData: any;
        let retryCount = 0;
        const maxRetries = 40; // 约 60 秒超时

        do {
          const queryPayload = JSON.stringify({ JobId: jobId });
          const queryHeaders: any = generateTencentCloudHeaders(
            TENCENT_SECRET_ID, 
            TENCENT_SECRET_KEY, 
            "QueryHunyuanImageJob", 
            queryPayload, 
            HUNYUAN_HOST, 
            HUNYUAN_VERSION,
            "hunyuan"
          );
          const queryResponse = await fetch(`https://${HUNYUAN_HOST}`, {
            method: 'POST',
            headers: queryHeaders,
            body: queryPayload
          });
          const queryResult = await queryResponse.json();
          queryData = queryResult.Response;

          if (queryData.Error) throw new Error(`查询任务错误: ${queryData.Error.Message}`);
          
          if (queryData.JobStatusCode === '4' || queryData.JobStatusCode === '5') break; // 4/5 均为完成(含部分失败)
          if (queryData.JobStatusCode === '3') throw new Error(queryData.JobErrorMsg || "任务处理失败");

          await new Promise(r => setTimeout(r, 1500));
          retryCount++;
        } while (retryCount < maxRetries && (queryData.JobStatusCode === '0' || queryData.JobStatusCode === '1' || queryData.JobStatusCode === '2'));

        if (queryData.JobStatusCode !== '4' && queryData.JobStatusCode !== '5') {
          throw new Error("任务查询超时或执行失败");
        }

        const results = queryData.ResultImage || [];
        for (const url of results) {
          const pUrl = await saveImageToStorage(url, "url", "hunyuan-image");
          imageUrls.push(pUrl);
        }
        revisedPrompt = queryData.RevisedPrompt?.[0] || "";
      }

      if (imageUrls.length === 0) throw new Error("未获取到图片生成结果");

      return NextResponse.json({
        markdownResponse: formatImageMarkdown(imageUrls, {
          prompt: Prompt,
          revisedPrompt: revisedPrompt,
          extraInfo: { 
            "模式": mode === "lite" ? "极速版 (同步)" : "3.0 专业版 (异步)",
            "分辨率": Resolution 
          }
        }),
        images: imageUrls,
        metadata: {
          prompt: Prompt,
          revisedPrompt: revisedPrompt,
          model: mode === "lite" ? "hunyuan-lite" : "hunyuan-3.0",
          extraInfo: { "模式": mode, "分辨率": Resolution }
        }
      });
    } catch (error: any) {
      console.error("[Hunyuan Plugin] Error:", error);
      return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
  }
};
