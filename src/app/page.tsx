'use client';

import React, { useState } from 'react';
import { Check, Copy, Sparkles, Zap, Image as ImageIcon, Wand2, Languages, Layers } from 'lucide-react';

export default function Home() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const plugins = [
    { 
      name: "全能图像生成枢纽 (整合版)", 
      id: "manifest.json", 
      icon: "🛸", 
      desc: "一站式集成阿里、字节、腾讯、智谱、SiliconFlow、xAI 所有生图能力，支持智能模型路由。",
      gradient: "from-blue-600 via-purple-600 to-pink-600",
      features: ["多引擎整合", "智能路由"]
    },
    { 
      name: "通义万相 & Qwen 全能影像", 
      id: "tongyi-image/manifest.json", 
      icon: "🎨", 
      desc: "支持 Qwen-Image-Max 高质量出图、风格迁移编辑及高保真图像翻译。阿里顶级影像能力集成。",
      gradient: "from-orange-500 to-red-500",
      features: ["图像编辑", "图像翻译"]
    },
    { 
      name: "豆包 (火山引擎) 旗舰版", 
      id: "doubao-image/manifest.json", 
      icon: "🌋", 
      desc: "基于 Seedream 4.5 系列模型。支持多图融合、连贯组图生成（漫画分镜）及 SeedEdit 智能编辑。",
      gradient: "from-green-500 to-teal-500",
      features: ["组图生成", "多图融合"]
    },
    { 
      name: "SiliconFlow 顶级模型库", 
      id: "siliconflow-image/manifest.json", 
      icon: "🚀", 
      desc: "集成 FLUX 全系列 (Pro/Dev/Schnell) 及可图 (Kolors) 中文强化模型。极速生成，极致画质。",
      gradient: "from-purple-500 to-pink-500",
      features: ["FLUX 全系列", "中文优化"]
    },
    { 
      name: "智谱 AI (CogView-4) 旗舰", 
      id: "zhipuai-image/manifest.json", 
      icon: "🧠", 
      desc: "支持最新的 CogView-4 旗舰模型。具备卓越的汉字生成准确度和 HD 高清渲染模式。",
      gradient: "from-indigo-500 to-purple-500",
      features: ["精准汉字", "HD 高清"]
    },
    { 
      name: "腾讯混元 (Hunyuan) 极速版", 
      id: "tencent-hunyuan-image/manifest.json", 
      icon: "🐧", 
      desc: "新增 TextToImageLite 秒级同步出图。支持智能提示词改写与 3.0 专业版深度生成。",
      gradient: "from-blue-400 to-cyan-500",
      features: ["秒级同步", "智能改写"]
    },
    { 
      name: "xAI (Grok-2) 影像生成", 
      id: "xai-image/manifest.json", 
      icon: "𝕏", 
      desc: "基于 Grok-2 的顶级视觉生成能力，具备极强的指令遵循度和独特的视觉表现力。",
      gradient: "from-gray-700 to-gray-900",
      features: ["顶级视觉", "强指令遵循"]
    },
  ];

  // 复制链接到剪贴板
  const copyToClipboard = async (path: string, pluginId: string) => {
    const manifestUrl = `${window.location.origin}/${path}`;
    try {
      await navigator.clipboard.writeText(manifestUrl);
      setCopiedId(pluginId);
      setShowToast(true);
      
      // 3秒后重置状态
      setTimeout(() => {
        setCopiedId(null);
        setShowToast(false);
      }, 3000);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制链接');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 z-50">
          <div className="bg-green-500 rounded-full p-1">
            <Check size={16} />
          </div>
          <span className="font-semibold">Manifest 链接已成功复制！</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* 头部区域 */}
        <header className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <ImageIcon size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-6">
            LobeChat <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">影像插件 hub</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            2026 旗舰版升级：集成了全球领先的 AI 影像引擎，支持文生图、图像编辑、多图融合及高保真图像翻译。
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium flex items-center gap-2">
              <Wand2 size={18} className="text-purple-500" />
              支持图像编辑
            </div>
            <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium flex items-center gap-2">
              <Languages size={18} className="text-blue-500" />
              支持高保真翻译
            </div>
            <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium flex items-center gap-2">
              <Layers size={18} className="text-orange-500" />
              多图特征融合
            </div>
          </div>
        </header>

        {/* 插件卡片网格 */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              影像引擎集合
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Stable
              </span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plugins.map((plugin, index) => (
              <div
                key={plugin.id}
                className="group bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-500 flex flex-col relative overflow-hidden"
              >
                {/* 装饰渐变 */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plugin.gradient} opacity-0 group-hover:opacity-5 transition-opacity blur-3xl`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-5xl drop-shadow-sm group-hover:scale-110 transition-transform duration-500">
                      {plugin.icon}
                    </div>
                    <div className="flex gap-1">
                      {plugin.features.map(f => (
                        <span key={f} className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {plugin.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                    {plugin.desc}
                  </p>
                  
                  <button
                    onClick={() => copyToClipboard(plugin.id, plugin.name)}
                    className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                      copiedId === plugin.id
                        ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                        : `bg-slate-900 text-white hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1`
                    }`}
                  >
                    {copiedId === plugin.id ? (
                      <>
                        <Check size={20} strokeWidth={3} />
                        <span>已复制链接</span>
                      </>
                    ) : (
                      <>
                        <Copy size={20} />
                        <span>复制 Manifest 链接</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 快速指南 */}
        <section className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-10">
            <Sparkles size={120} className="text-blue-600" />
          </div>
          
          <div className="max-w-3xl relative z-10">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-8">
              如何快速部署？
            </h2>
            
            <div className="grid gap-10">
              {[
                { step: 1, title: '复制链接', text: '从上方选择您需要的影像引擎，点击复制 Manifest 地址。' },
                { step: 2, title: '配置插件', text: '在 LobeChat 设置中选择"自定义插件"，添加刚才复制的链接。' },
                { step: 3, title: '填写秘钥', text: '在插件设置中填入对应厂商的 API Key。' },
                { step: 4, title: '开启创作', text: '现在您可以像使用原生插件一样进行 AI 绘图、编辑与翻译了。' }
              ].map(({ step, title, text }) => (
                <div key={step} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-blue-600 transition-colors shadow-lg">
                    {step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">{title}</h4>
                    <p className="text-slate-500 leading-relaxed">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Zap size={20} className="text-white" />
              </div>
              <p className="text-blue-900 font-semibold text-sm">
                提示：推荐使用"整合版"以获得最无缝的多引擎创作体验。
              </p>
            </div>
          </div>
        </section>

        {/* 页脚 */}
        <footer className="mt-32 pt-12 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ImageIcon size={20} />
              LobeChat Image Plugin Hub
            </div>
            <p className="text-slate-400 text-sm">
              © 2026 Passerby1011 · Powered by Next.js & Vercel
            </p>
            <div className="flex gap-6">
              <a href="https://github.com/Passerby1011/lobechat-image-plugin" className="text-slate-400 hover:text-slate-900 transition-colors font-medium">GitHub</a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors font-medium">Documentation</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
