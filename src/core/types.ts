import { NextResponse } from 'next/server';

/**
 * 插件基础设置接口
 */
export interface BaseSettings {
  [key: string]: any;
}

/**
 * 插件处理器的输入上下文
 */
export interface PluginContext<S = BaseSettings> {
  body: any;
  settings: S;
}

/**
 * 插件处理器接口定义
 */
export interface PluginHandler {
  id: string;
  name: string;
  /**
   * 获取插件的基础清单配置 (不含动态 URL)
   */
  getManifest: () => any;
  /**
   * 处理生成请求的主函数
   */
  handle: (context: PluginContext) => Promise<Response>;
}

/**
 * 插件注册表接口
 */
export interface PluginRegistry {
  [id: string]: PluginHandler;
}
