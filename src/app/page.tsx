import React from 'react';

export default function Home() {
  const plugins = [
    { name: "SiliconFlow 图像生成", id: "siliconflow-image", icon: "🎨", desc: "基于 FLUX 系列模型的高质量生成" },
    { name: "xAI (Grok) 图像生成", id: "xai-image", icon: "𝕏", desc: "使用 xAI 的 Grok 模型生成图片" },
    { name: "通义万相", id: "tongyi-image", icon: "🎉", desc: "阿里大模型图像生成服务" },
    { name: "腾讯混元", id: "tencent-hunyuan-image", icon: "🌈", desc: "腾讯云强力驱动的图像生成" },
    { name: "智谱 AI (CogView)", id: "zhipuai-image", icon: "🧠", desc: "国产大模型先锋智谱生成服务" },
  ];

  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.5',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: '#333'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎨 LobeChat 插件枢纽</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>高性能、多厂商集成的 AI 图像生成插件集</p>
      </header>

      <section>
        <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>🚀 已集成插件</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {plugins.map(plugin => (
            <div key={plugin.id} style={{
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '20px',
              transition: 'transform 0.2s',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{plugin.icon}</div>
              <h3 style={{ margin: '0 0 10px 0' }}>{plugin.name}</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>{plugin.desc}</p>
              <a 
                href={`/${plugin.id}/manifest.json`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.85rem'
                }}
              >
                复制 Manifest 链接
              </a>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '60px', backgroundColor: '#f9f9f9', padding: '30px', borderRadius: '16px' }}>
        <h2 style={{ margin: '0 0 15px 0' }}>💡 使用指南</h2>
        <ol style={{ paddingLeft: '20px' }}>
          <li>复制上方任意插件的 <strong>Manifest 链接</strong>。</li>
          <li>打开您的 <strong>LobeChat</strong> 实例。</li>
          <li>进入 <strong>插件中心</strong> &rarr; <strong>自定义插件</strong>。</li>
          <li>点击“添加”并粘贴链接即可开始使用。</li>
        </ol>
        <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '20px' }}>
          提示：请确保后端已配置 <code>BLOB_READ_WRITE_TOKEN</code> 以获得最佳体验。
        </p>
      </section>

      <footer style={{ textAlign: 'center', marginTop: '60px', color: '#999', fontSize: '0.9rem' }}>
        © 2026 LobeChat Plugin Hub · Powered by Next.js
      </footer>
    </div>
  );
}
