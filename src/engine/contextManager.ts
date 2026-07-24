// ============================================================
//  上下文管理器 — 后室世界专用
//  负责清理发送给 AI 的消息上下文
// ============================================================

import type { ChatMessage } from '../stores/gameStore';
import type { Message } from '../api/types';
import { processRegexScripts } from '../utils/regexScripts';
import { getBuiltinPromptScripts } from '../data/builtinPresets';
import { usePresetStore } from '../stores/presetStore';

/** 获取消息的原始文本 */
export function getMessageContent(msg: ChatMessage): string {
  return msg.content || '';
}

/** 核心函数：清理消息上下文用于发送给 AI */
export function sanitizeForContext(messages: ChatMessage[], currentRound: number): Message[] {
  const MAX_HISTORY = 20;
  const SUMMARY_DEPTH_THRESHOLD = 10;
  // 内置 API 正则始终执行 + 预设正则叠加
  const activePreset = usePresetStore.getState().getActivePreset();
  const presetPromptScripts = (activePreset?.regexScripts || []).filter(s => s.promptOnly && !s.disabled);
  const promptScripts = [...getBuiltinPromptScripts(), ...presetPromptScripts];

  // 取最近 N 条消息（排除 system 消息和未来轮次）
  const recentMessages = messages
    .filter(m => m.role !== 'system' && (m.round ?? 0) < currentRound)
    .slice(-MAX_HISTORY);

  return recentMessages.map(m => {
    let content = getMessageContent(m);

    // 用正则脚本清理所有元数据标签
    if (promptScripts.length > 0) {
      const depth = currentRound - (m.round ?? 0);
      content = processRegexScripts(content, promptScripts, 'Output', depth);

      // 深度 > 10：只保留 summary（如果有的话）
      if (depth > SUMMARY_DEPTH_THRESHOLD) {
        // 后室消息没有 summary 字段，保留原文
      }
    }

    // 清理多余空行
    content = content.replace(/\n{3,}/g, '\n\n').trim();

    return { role: m.role as 'user' | 'assistant', content };
  }).filter(m => m.content.length > 0);
}
