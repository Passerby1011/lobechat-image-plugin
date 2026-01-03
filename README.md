# 🎨 LobeChat Image Plugins Hub

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14">
  <img src="https://img.shields.io/badge/Tailwind-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/LobeChat-Plugins-00d1b2?style=for-the-badge" alt="LobeChat Plugins">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

> **2026 旗舰版重大升级**：全平台模型扩充、多模态功能增强、UI 重构及参数鲁棒性优化已全面完成。

LobeChat Image Plugins Hub 是一个高度集成的图像生成插件中心，致力于为 LobeChat 用户提供一站式的多平台 AI 绘画能力。通过统一的架构设计，我们将全球领先的 AI 图像生成服务整合在一起，并解决了图片失效、参数复杂等痛点。

---

## ✨ 核心特性

- 🌈 **多平台大合集**：一键接入通义万相、腾讯混元、智谱 AI、硅基流动 (Flux/SD)、字节跳动豆包 (Seedream)、xAI (Grok) 等主流模型。
- 🖼️ **图片持久化**：内置 Vercel Blob 存储支持，自动将生成的临时链接转为永久地址，确保创作永不丢失。
- ⚡ **极速响应**：全面接入各平台同步极速版接口，秒级出图，无需漫长等待。
- 🛠️ **全功能覆盖**：支持文生图、图生图、图像编辑、风格迁移、高保真图像翻译等多模态任务。
- 🎨 **现代 UI 界面**：基于 Tailwind CSS v4 构建的全新插件详情页，提供极致的视觉体验与交互。

---

## 🚀 快速开始

### 1. 一键部署

最快的使用方式是部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 2. 环境配置

在部署环境中配置以下变量以启用图片持久化：

| 变量名 | 是否必填 | 说明 |
| :--- | :--- | :--- |
| `BLOB_READ_WRITE_TOKEN` | **是** | 用于 Vercel Blob 存储，防止生成的图片链接失效。 |

*注：各 AI 服务的 API Key 由用户在 LobeChat 插件设置中按需输入。*

---

## 📦 支持的模型插件矩阵

您可以将以下链接直接添加到 LobeChat 的自定义插件列表中。

| 插件名称 | 标识符 | 核心模型 / 特色能力 |
| :--- | :--- | :--- |
| **通义万相 (AliCloud)** | `tongyi-image` | Qwen-Image-Max, 图像编辑, 风格融合 |
| **豆包 (火山引擎)** | `doubao-image` | Seedream 4.5, SeedEdit 3.0, 组图连贯生成 |
| **硅基流动 (SiliconFlow)** | `siliconflow-image` | FLUX (Pro/Dev), 可图 (Kolors), SDXL |
| **智谱 AI (CogView)** | `zhipuai-image` | CogView-4 旗舰, 汉字精准生成 |
| **腾讯混元 (Hunyuan)** | `tencent-hunyuan-image` | Hunyuan-Lite (极速同步), 3.0 专业版 |
| **xAI (Grok)** | `xai-image` | Grok-2 视觉生成能力 |

---

## 🛠️ 开发者指南

如果您想为本项目添加新的插件支持：

1. **核心逻辑**：在 `src/plugins` 下创建新目录，并实现 `handler.ts`。
2. **路由注册**：在 `src/plugins/index.ts` 中完成插件定义注册。
3. **配置定义**：在 `public/` 下创建对应的 `manifest.json`。

---

## 📖 详细文档

- [2026 升级计划分析 (UPGRADE_PLAN.md)](UPGRADE_PLAN.md)
- [升级完成报告 (UPGRADE_REPORT.md)](UPGRADE_REPORT.md)
- [各平台配置指南 (文档目录)](文档/)

---

## 📄 开源协议

基于 **MIT** 协议开源。

---

<p align="center">
  由 <b>Passerby1011</b> 与社区共同维护
</p>
