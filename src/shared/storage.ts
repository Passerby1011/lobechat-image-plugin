import { put } from "@vercel/blob";
import { v4 as uuidv4 } from 'uuid';

/**
 * 将图像持久化存储到 Vercel Blob
 * @param source 图像来源 (URL 或 Base64 字符串)
 * @param format 来源格式 'url' | 'b64_json'
 * @param pluginId 插件标识，用于存储目录
 * @returns 永久可访问的 URL
 */
export async function saveImageToStorage(
  source: string,
  format: 'url' | 'b64_json',
  pluginId: string
): Promise<string> {
  // 检查环境变量是否存在
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(`[Storage] BLOB_READ_WRITE_TOKEN not found. Skipping persistence for ${pluginId}.`);
    return format === 'url' ? source : '';
  }

  const uniqueFilename = `${Date.now()}-${uuidv4().substring(0, 8)}`;
  let contentType = 'image/jpeg';
  let imageBuffer: Buffer;

  try {
    if (format === 'b64_json') {
      let base64Data = source;
      if (!base64Data.includes(';base64,')) {
        base64Data = `data:image/jpeg;base64,${base64Data}`;
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 data");
      }

      contentType = matches[1];
      const actualData = matches[2];
      imageBuffer = Buffer.from(actualData, 'base64');
    } else {
      // 处理 URL 格式 - 先下载
      const response = await fetch(source, {
        signal: AbortSignal.timeout(30000)
      });
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const fileExt = contentType.split('/').pop() || 'jpg';
    const blob = await put(`${pluginId}/${uniqueFilename}.${fileExt}`, imageBuffer, {
      access: "public",
      contentType: contentType,
      addRandomSuffix: false,
    });

    return blob.url;
  } catch (error) {
    console.error(`[Storage] Failed to persist image for ${pluginId}:`, error);
    // 如果存储失败，降级返回原始 source (如果是 URL 的话)
    if (format === 'url') return source;
    throw error;
  }
}
