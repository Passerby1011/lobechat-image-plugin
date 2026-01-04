import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * 从请求中获取 base URL
 */
export function getBaseUrl(req: NextRequest): string {
  // 优先使用环境变量（用于自定义域名）
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // 从请求头中提取
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host');

  if (!host) {
    throw new Error('Unable to determine base URL');
  }

  return `${protocol}://${host}`;
}

/**
 * 读取并处理 manifest 文件
 * @param manifestPath - manifest.json 的相对路径（从 public/ 开始）
 * @param baseUrl - 当前的 base URL
 */
export function processManifest(manifestPath: string, baseUrl: string): any {
  const fullPath = path.join(process.cwd(), 'public', manifestPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const staticManifest = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  const manifest = JSON.parse(JSON.stringify(staticManifest));

  // 替换所有 API 的 URL
  if (manifest.api && Array.isArray(manifest.api)) {
    manifest.api = manifest.api.map((api: any) => {
      // 从原 URL 中提取路径部分
      // 例如: "https://xxx.vercel.app/api/tongyi-image/generate"
      //    -> "/api/tongyi-image/generate"
      const urlMatch = api.url.match(/\/api\/[^\/]+\/generate/);
      if (urlMatch) {
        api.url = `${baseUrl}${urlMatch[0]}`;
      }
      return api;
    });
  }

  return manifest;
}

/**
 * 所有 manifest 文件的映射
 */
export const MANIFEST_MAP: Record<string, string> = {
  // 主 Hub
  'hub': 'manifest.json',

  // 各个插件
  'tongyi-image': 'tongyi-image/manifest.json',
  'doubao-image': 'doubao-image/manifest.json',
  'siliconflow-image': 'siliconflow-image/manifest.json',
  'tencent-hunyuan-image': 'tencent-hunyuan-image/manifest.json',
  'zhipuai-image': 'zhipuai-image/manifest.json',
  'xai-image': 'xai-image/manifest.json',
};