import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl, processManifest, MANIFEST_MAP } from '@/shared/manifest-helper';

/**
 * 动态生成单个插件的 manifest
 * 访问: https://your-domain.com/api/tongyi-image/manifest
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { pluginId: string } }
) {
  try {
    const { pluginId } = params;
    const manifestPath = MANIFEST_MAP[pluginId];

    if (!manifestPath) {
      return NextResponse.json(
        { error: `Plugin '${pluginId}' not found` },
        { status: 404 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const manifest = processManifest(manifestPath, baseUrl);

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: any) {
    console.error(`[Manifest API] Error for ${params.pluginId}:`, error.message);
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