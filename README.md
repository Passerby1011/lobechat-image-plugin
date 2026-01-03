# 🎨 LobeChat Image Plugins Hub

这是一个高度集成的 LobeChat 图像生成插件中心，基于 **Next.js 14** 构建。它将多个主流 AI 图像生成服务整合在一个域名下，并提供统一的持久化存储能力。

**🚀 2026.01.02 重大升级：全平台模型扩充与功能增强已完成！**

## 🌟 特性亮点

- **🚀 统一分发**：一个域名支持无限个插件，通过路径动态路由。
- **💾 永久存储**：集成 **Vercel Blob**，自动将所有生成的临时链接转存为永久 URL，解决图片失效问题。
- **🎭 多模态能力**：除了文生图，还支持**图像编辑、多图融合、风格迁移及高保真图像翻译**。
- **⚡ 极速体验**：全面接入各平台同步极速版接口（如 Qwen-Image-Max, Hunyuan-Lite），秒级出图。
- **🏗️ 架构现代化**：全平台升级至最新协议（如火山引擎 Ark V3），性能更稳。

## 🛠️ 已集成插件

您可以直接将以下链接添加到 LobeChat 的自定义插件中。建议添加前先阅读相应的 **Manifest** 获取最新参数。

| 插件名称 | 标识符 | 核心能力 (2026 升级版) |
| :--- | :--- | :--- |
| **通义万相 & Qwen 全能影像** | `tongyi-image` | 文生图(Max/Plus)、图像编辑、风格融合、图像翻译 |
| **豆包 (火山引擎) 旗舰版** | `doubao-image` | Seedream 4.5、SeedEdit 3.0、多图融合、组图连贯生成 |
| **SiliconFlow 顶级模型库** | `siliconflow-image` | FLUX (Pro/Dev)、可图 (Kolors) 中文强化、SD3、SDXL |
| **智谱 AI (CogView-4)** | `zhipuai-image` | CogView-4 旗舰、汉字精准生成、HD 高清模式 |
| **腾讯混元 (Hunyuan)** | `tencent-hunyuan-image` | 同步极速版 (Lite)、3.0 专业版异步任务 |
| **xAI (Grok) 图像生成** | `xai-image` | 基于 Grok-2 的顶级视觉生成能力 |

## 🚀 部署指南

### 1. 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 2. 配置环境变量

在 Vercel 控制台中配置以下关键变量：

| 变量名 | 必填 | 描述 |
| :--- | :--- | :--- |
| `BLOB_READ_WRITE_TOKEN` | **是** | Vercel Blob 的访问令牌，用于图片持久化存储。 |

*注：各 AI 服务的 API Key 由用户在 LobeChat 插件设置中输入，后端无需配置。*

## 🧑‍💻 开发者指南

### 添加新插件

1. 在 `src/plugins` 下创建一个新文件夹。
2. 实现 `handler.ts`，导出符合 `PluginHandler` 接口的对象。
3. 在 `src/plugins/index.ts` 中注册。
4. 在 `public/` 下添加 `manifest.json`。

## 📜 详细升级记录

详情请查阅：
- [升级计划分析 (UPGRADE_PLAN.md)](UPGRADE_PLAN.md)
- [升级完成报告 (UPGRADE_REPORT.md)](UPGRADE_REPORT.md)

## 📜 开源协议

MIT
