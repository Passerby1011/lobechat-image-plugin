import { NextResponse } from "next/server";
import { createErrorResponse, PluginErrorType } from "@lobehub/chat-plugin-sdk";
import axios from "axios";
import * as CryptoJS from "crypto-js";
import { PluginHandler, PluginContext } from "@/core/types";
import { saveImageToStorage } from "@/shared/storage";
import { formatImageMarkdown } from "@/shared/markdown";

const HOST = "hunyuan.tencentcloudapi.com";
const SERVICE = "hunyuan";
const REGION = "ap-guangzhou";
const VERSION = "2023-09-01";

// 签名逻辑封装
function sign(secretKey: string, date: string, service: string, str: string): string {
  const hmacDate = CryptoJS.HmacSHA256(date, "TC3" + secretKey);
  const hmacService = CryptoJS.HmacSHA256(service, hmacDate);
  const hmacSigning = CryptoJS.HmacSHA256("tc3_request", hmacService);
  return CryptoJS.HmacSHA256(str, hmacSigning).toString(CryptoJS.enc.Hex);
}

function generateTencentCloudHeaders(secretId: string, secretKey: string, action: string, payload: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dateObj = new Date(timestamp * 1000);
  const dateStr = dateObj.toISOString().split('T')[0];
  const hashedRequestPayload = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex);
  const canonicalRequest = [
    "POST", "/", "", "content-type:application/json; charset=utf-8", "host:" + HOST, "", "content-type;host", hashedRequestPayload
  ].join("\n");
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = dateStr + "/" + SERVICE + "/" + "tc3_request";
  const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);
  const stringToSign = [algorithm, timestamp, credentialScope, hashedCanonicalRequest].join("\n");
  const signature = sign(secretKey, dateStr, SERVICE, stringToSign);
  const authorization = algorithm + " Credential=" + secretId + "/" + credentialScope + ", SignedHeaders=content-type;host, Signature=" + signature;
  return {
    Authorization: authorization,
    "Content-Type": "application/json; charset=utf-8",
    Host: HOST,
    "X-TC-Action": action,
    "X-TC-Timestamp": timestamp.toString(),
    "X-TC-Version": VERSION,
    "X-TC-Region": REGION
  };
}

export const hunyuanHandler: PluginHandler = {
  id: "tencent-hunyuan-image",
  name: "腾讯混元大模型图片生成器",
  getManifest: () => ({
    "identifier": "tencent-hunyuan-image",
    "api": [
      {
        "url": "/api/generate",
        "name": "generateImage",
        "description": "使用腾讯混元大模型，根据文本提示生成图片",
        "parameters": {
          "type": "object",
          "properties": {
            "Prompt": {
              "type": "string",
              "description": "文本描述，推荐使用中文",
              "minLength": 1
            },
            "NegativePrompt": {
              "type": "string",
              "description": "反向提示词"
            },
            "Style": {
              "type": "string",
              "description": "绘画风格",
              "enum": ["riman", "shuimo", "monai", "bianping", "xiangsu", "ertonghuiben", "3dxuanran", "manhua", "heibaimanhua", "xieshi", "dongman", "bijiasuo", "saibopengke", "youhua", "masaike", "qinghuaci", "xinnianjianzhi", "xinnianhuayi"]
            },
            "Resolution": {
              "type": "string",
              "description": "生成图分辨率",
              "enum": ["768:768", "768:1024", "1024:768", "1024:1024", "720:1280", "1280:720", "768:1280", "1280:768"],
              "default": "1024:1024"
            }
          },
          "required": ["Prompt"]
        }
      }
    ],
    "meta": {
      "avatar": "🎨",
      "description": "腾讯混元大模型图片生成器",
      "tags": ["图片", "生成", "混元", "腾讯"],
      "title": "腾讯混元大模型图片生成器"
    },
    "settings": {
      "type": "object",
      "required": ["TENCENT_SECRET_ID", "TENCENT_SECRET_KEY"],
      "properties": {
        "TENCENT_SECRET_ID": { "type": "string", "title": "Secret ID" },
        "TENCENT_SECRET_KEY": { "type": "string", "title": "Secret Key" }
      }
    },
    "version": "1"
  }),
  handle: async (ctx: PluginContext) => {
    const { body, settings } = ctx;
    const { TENCENT_SECRET_ID, TENCENT_SECRET_KEY } = settings;

    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
      return createErrorResponse(PluginErrorType.PluginSettingsInvalid, { message: 'Credentials required.' });
    }

    const { Prompt, NegativePrompt, Style, Resolution = "1024:1024", Num = 1, Clarity, ContentImage, Revise = 1, Seed } = body;

    try {
      const payload = JSON.stringify({ Prompt, NegativePrompt, Style, Resolution, Num, Clarity, ContentImage, Revise, Seed });
      const headers = generateTencentCloudHeaders(TENCENT_SECRET_ID, TENCENT_SECRET_KEY, "SubmitHunyuanImageJob", payload);
      
      const submitResponse = await axios.post(`https://${HOST}`, payload, { headers });
      const jobId = submitResponse.data.Response?.JobId;
      if (!jobId) throw new Error(submitResponse.data.Response?.Error?.Message || "Failed to submit job");

      let queryData: any;
      do {
        const queryPayload = JSON.stringify({ JobId: jobId });
        const queryHeaders = generateTencentCloudHeaders(TENCENT_SECRET_ID, TENCENT_SECRET_KEY, "QueryHunyuanImageJob", queryPayload);
        const queryResponse = await axios.post(`https://${HOST}`, queryPayload, { headers: queryHeaders });
        queryData = queryResponse.data.Response;
        if (queryData.JobStatusCode === '3') break; // FAILED
        if (queryData.JobStatusCode !== '2') { // 2 = SUCCEEDED
          await new Promise(r => setTimeout(r, 1000));
        }
      } while (queryData.JobStatusCode === '0' || queryData.JobStatusCode === '1');

      if (queryData.JobStatusCode !== '2') throw new Error(queryData.JobErrorMsg || "Job failed");

      const results = queryData.ResultImage || [];
      const imageUrls: string[] = [];
      for (const url of results) {
        const pUrl = await saveImageToStorage(url, "url", "hunyuan-image");
        imageUrls.push(pUrl);
      }

      return NextResponse.json({
        markdownResponse: formatImageMarkdown(imageUrls, {
          prompt: Prompt,
          revisedPrompt: queryData.RevisedPrompt?.[0],
          extraInfo: { "风格": Style || "默认", "分辨率": Resolution }
        })
      });
    } catch (error: any) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
  }
};
