'use client';

import { useWatchPluginMessage } from '@lobehub/chat-plugin-sdk/client';

interface ImageData {
  images?: string[];
  metadata?: {
    prompt?: string;
    model?: string;
    revisedPrompt?: string;
    extraInfo?: Record<string, any>;
  };
}

export default function ImageUI() {
  const { data, loading } = useWatchPluginMessage<ImageData>();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  if (!data || !data.images || data.images.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#999'
      }}>
        暂无图片数据
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#fafafa',
      minHeight: '100%'
    }}>
      {/* 图片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: data.images.length === 1 
          ? '1fr' 
          : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {data.images.map((url: string, idx: number) => (
          <div key={idx} style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <img
              src={url}
              alt={`生成图片-${idx + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
        ))}
      </div>

      {/* 元数据信息 */}
      {data.metadata && (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#333',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {data.metadata.prompt && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#000' }}>提示词:</strong>
              <span style={{ marginLeft: '8px', color: '#666' }}>
                {data.metadata.prompt}
              </span>
            </div>
          )}

          {data.metadata.revisedPrompt && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#000' }}>优化后提示词:</strong>
              <span style={{ marginLeft: '8px', color: '#666' }}>
                {data.metadata.revisedPrompt}
              </span>
            </div>
          )}

          {data.metadata.model && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#000' }}>模型:</strong>
              <span style={{ marginLeft: '8px', color: '#666' }}>
                {data.metadata.model}
              </span>
            </div>
          )}

          {data.metadata.extraInfo && Object.entries(data.metadata.extraInfo).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '4px' }}>
              <strong style={{ color: '#000' }}>{key}:</strong>
              <span style={{ marginLeft: '8px', color: '#666' }}>
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
