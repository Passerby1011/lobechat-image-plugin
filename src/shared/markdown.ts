/**
 * 格式化图像生成结果为 Markdown
 */
export interface MarkdownOptions {
  prompt: string;
  revisedPrompt?: string;
  model?: string;
  extraInfo?: Record<string, any>;
}

export function formatImageMarkdown(urls: string[], options: MarkdownOptions): string {
  let markdown = urls.map((url, index) => {
    return `![Generated Image ${urls.length > 1 ? index + 1 : ''}](${url})`;
  }).join('\n\n');

  markdown += `\n\n---`;
  markdown += `\n\n**提示词**: ${options.prompt}`;
  
  if (options.revisedPrompt) {
    markdown += `\n\n**优化后提示词**: ${options.revisedPrompt}`;
  }

  if (options.model) {
    markdown += `\n\n**模型**: \`${options.model}\``;
  }

  if (options.extraInfo) {
    Object.entries(options.extraInfo).forEach(([key, value]) => {
      markdown += `\n*${key}: ${value}*`;
    });
  }

  return markdown.trim();
}
