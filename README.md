# 🎨 LobeChat Image Plugins Hub

这是一个高度集成的 LobeChat 图像生成插件中心，基于 **Next.js 14** 构建。它将多个主流 AI 图像生成服务整合在一个域名下，并提供了统一的持久化存储能力。

## 🌟 特性亮点

- **🚀 统一分发**：一个域名支持无限个插件，通过路径动态路由（如 `/api/siliconflow-image/generate`）。
- **💾 永久存储**：集成 **Vercel Blob**，自动将所有生成的临时链接转存为永久 URL，解决图片失效问题。
- **📊 响应规范**：所有插件均返回标准的 Markdown 格式，包含模型信息、优化后的提示词及参数展示。
- **🏗️ 易于扩展**：采用插件注册机制，新增一个插件仅需几行代码。

## 🛠️ 已集成插件

您可以直接将以下链接添加到 LobeChat 的自定义插件中：

| 插件名称 | 标识符 | Manifest 链接 (部署后) |
| :--- | :--- | :--- |
| **SiliconFlow 图像生成** | `siliconflow-image` | `https://your-domain.com/siliconflow-image/manifest.json` |
| **xAI (Grok) 图像生成** | `xai-image` | `https://your-domain.com/xai-image/manifest.json` |
| **通义万相 (阿里)** | `tongyi-image` | `https://your-domain.com/tongyi-image/manifest.json` |
| **腾讯混元生成** | `tencent-hunyuan-image` | `https://your-domain.com/tencent-hunyuan-image/manifest.json` |
| **智谱 AI (CogView)** | `zhipuai-image` | `https://your-domain.com/zhipuai-image/manifest.json` |

## 📸 效果展示 (示例)

> **Prompt**: 一只在赛博朋克城市屋顶上喝咖啡的机械猫

![Cyber Cat](https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1000)

---
**提示词**: *一只在赛博朋克城市屋顶上喝咖啡的机械猫*
**模型**: `black-forest-labs/FLUX.1-schnell`
**状态**: ✅ 已持久化存储至 Vercel Blob

## 🚀 部署指南

### 1. 一键部署到 Vercel

点击下方按钮或直接在 Vercel 导入此仓库：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 2. 配置环境变量

在 Vercel 控制台中配置以下环境变量：

| 变量名 | 必填 | 描述 |
| :--- | :--- | :--- |
| `BLOB_READ_WRITE_TOKEN` | **是** | Vercel Blob 的访问令牌，用于图片持久化存储。 |

*注：各 AI 服务的 API Key 由用户在 LobeChat 客户端设置中输入，后端无需配置。*

## 🧑‍💻 开发者指南

### 添加新插件

1. 在 `src/plugins` 下创建一个新文件夹（如 `my-new-ai`）。
2. 实现 `handler.ts`，导出符合 `PluginHandler` 接口的对象。
3. 在 `src/plugins/index.ts` 中注册新插件。
4. 在 `public/` 下添加 `manifest.json`。

## 📜 开源协议

MIT
