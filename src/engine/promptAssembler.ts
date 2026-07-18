// ============================================================
//  Prompt 组装器 — 预设系统 + 后室层级上下文
// ============================================================
import type { LevelDef, ExplorationState } from '../data/level-schema';
import type { PresetPack, PresetPromptEntry } from '../data/builtinPresets';
import { getEnabledPrompts } from '../data/builtinPresets';
import { getBackroomsPreset } from '../data/backroomsPreset';

/**
 * 获取当前激活的预设
 * 后续可以从 presetStore 读取用户自定义预设
 */
export function getActivePreset(): PresetPack {
  return getBackroomsPreset();
}

/**
 * 组装完整 system prompt
 * 1. 预设的 prompts[]（按 order 排序）
 * 2. 后室层级上下文（动态注入）
 */
export function assembleSystemPrompt(
  level: LevelDef | null,
  exploration: ExplorationState,
  preset?: PresetPack,
): string {
  const activePreset = preset || getActivePreset();
  const parts: string[] = [];

  // ─── 1. 预设 prompts ───
  const enabledPrompts = getEnabledPrompts(activePreset);
  for (const entry of enabledPrompts) {
    parts.push(entry.content);
  }

  // ─── 2. 后室层级上下文（动态） ───
  const contextParts: string[] = [];

  if (level) {
    contextParts.push(`## 当前层级
名称：${level.name}${level.subtitle ? `\n${level.subtitle}` : ''}
环境：${level.description}
氛围：${level.atmosphere}`);

    if (level.rules.length > 0) {
      contextParts.push(`## 该层级的规则\n${level.rules.map(r =>
        `- ${r.content}（${r.confidence === 'confirmed' ? '已确认' : r.confidence === 'suspected' ? '疑似' : '传闻'}）`
      ).join('\n')}`);
    }

    if (level.entities.length > 0) {
      contextParts.push(`## 该层级的实体\n${level.entities.map(e =>
        `- ${e.name}：${e.description}。${e.encounters}`
      ).join('\n')}`);
    }

    if (level.exits.length > 0) {
      contextParts.push(`## 可能的出口\n${level.exits.map(e =>
        `- ${e.condition}（${e.method === 'random' ? '随机' : e.method === 'triggered' ? '触发式' : '条件式'}，${e.reliability === 'always' ? '总是有效' : e.reliability === 'sometimes' ? '有时有效' : '罕见'}）`
      ).join('\n')}`);
    }
  }

  // 玩家已发现的规则
  if (exploration.discoveredRules.length > 0) {
    contextParts.push(`## 玩家已发现的规则\n${exploration.discoveredRules.map(r =>
      `- ${r.content}`
    ).join('\n')}`);
  }

  // 背包
  if (exploration.inventory.length > 0) {
    contextParts.push(`## 玩家背包\n${exploration.inventory.map(i =>
      `- ${i.name}×${i.quantity}：${i.description}`
    ).join('\n')}`);
  }

  // 状态
  contextParts.push(`## 当前状态
存活轮次：${exploration.survivalTime}
情绪：${exploration.currentMood}
已访问层级：${exploration.visitedLevels.length}个`);

  if (contextParts.length > 0) {
    parts.push(contextParts.join('\n\n'));
  }

  return parts.join('\n\n');
}
