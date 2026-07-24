// 响应解析器 — 从原始 AI 响应中提取纯正文
// 设计原则：显示层全靠 gameActionParser 的正则脚本，这里只提供 API 上下文用的纯正文提取

/**
 * 从原始响应中提取纯正文（剥掉所有标记和标签）
 * 用途：发给 AI API、变量提取、记忆系统
 */
export function extractContentForPrompt(rawText: string): string {
  if (!rawText) return '';

  // 优先提取 <contenttext> 标签内的内容（兼容旧格式）
  const contentMatch = rawText.match(/<contenttext>([\s\S]*?)<\/contenttext>/i);
  if (contentMatch) {
    return stripInnerTags(contentMatch[1]).trim();
  }

  // 兜底：剥掉所有已知标签和标记，剩余当正文
  return stripAllTags(rawText).trim();
}

// ── 内部工具函数 ──

/** 剥掉 contenttext 内部的子标签 */
function stripInnerTags(text: string): string {
  return text
    .replace(/<details>[\s\S]*?<\/details>/gi, '')
    .replace(/<summary>[\s\S]*?<\/summary>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<analysis_block>[\s\S]*?<\/analysis_block>/gi, '')
    .replace(/<\/?(?:contenttext|details|summary|thinking|analysis_block|br|hr)[^>]*\/?>/gi, '')
    // 后室标记
    .replace(/\[(?:LEVEL_CHANGE|ITEM_FOUND|RULE_DISCOVERED|PLAYER_DEATH|MOOD_CHANGE|NOTEBOOK_ENTRY):?[^\]]*?\]/g, '');
}

/** 剥掉所有已知标签和后室标记（兜底用） */
function stripAllTags(text: string): string {
  return text
    .replace(/<contenttext>[\s\S]*?<\/contenttext>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<analysis_block>[\s\S]*?<\/analysis_block>/gi, '')
    .replace(/<details>[\s\S]*?<\/details>/gi, '')
    .replace(/<summary>[\s\S]*?<\/summary>/gi, '')
    .replace(/<\/?(?:contenttext|details|summary|thinking|analysis_block|br|hr)[^>]*\/?>/gi, '')
    // 后室标记：[LEVEL_CHANGE:id] [ITEM_FOUND:name|desc|qty] 等
    .replace(/\[(?:LEVEL_CHANGE|ITEM_FOUND|RULE_DISCOVERED|PLAYER_DEATH|MOOD_CHANGE|NOTEBOOK_ENTRY):?[^\]]*?\]/g, '');
}

// ── 类型定义（供 pipelineExecutor / variableExtraction 使用） ──

export interface ParsedResponse {
  content: string;
  thinking: string;
  summary?: string | null;
}
