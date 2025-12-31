import { PluginRegistry } from '@/core/types';
import { xaiHandler } from './xai/handler';
import { siliconflowHandler } from './siliconflow/handler';
import { tongyiHandler } from './tongyi/handler';
import { hunyuanHandler } from './hunyuan/handler';
import { zhipuHandler } from './zhipu/handler';

/**
 * 插件注册中心
 * 所有的插件实例都需要在这里注册
 */
export const pluginRegistry: PluginRegistry = {
  'xai-image': xaiHandler,
  'siliconflow-image': siliconflowHandler,
  'tongyi-image': tongyiHandler,
  'tencent-hunyuan-image': hunyuanHandler,
  'zhipuai-image': zhipuHandler,
};
