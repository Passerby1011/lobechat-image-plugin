import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, processManifest } from '@/shared/manifest-helper';

/**
 * 动态生成主 Hub manifest
 * 访问: https://your-domain.com/api/manifest
 */
export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl(req);
    const manifest = processManifest('manifest.json', baseUrl);

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error('[Manifest API] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}

/**
 * 支持 HEAD 请求（用于健康检查）
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}