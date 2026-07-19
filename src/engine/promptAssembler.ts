// ============================================================
//  Prompt 组装器 — 预设系统 + 世界书 + 层级上下文
// ============================================================
import type { LevelDef, ExplorationState } from '../data/level-schema';
import type { PresetPack, PresetPromptEntry } from '../data/builtinPresets';
import { getEnabledPrompts } from '../data/builtinPresets';
import { getBackroomsPreset } from '../data/backroomsPreset';
import {
  createWorldBookManager,
  type WorldBookManager,
  type WorldBookEntry,
} from '../worldbook';
import {
  createLevelWorldBookManager,
  type LevelWorldBookManager,
} from '../worldbook/levelWorldBook';

// ─── 全局世界书管理器 ───

let levelBookManager: LevelWorldBookManager | null = null;

/** 初始化世界书管理器 */
export function initPromptAssembler(): void {
  levelBookManager = createLevelWorldBookManager();
}

/** 切换当前 Level 的世界书 */
export function switchLevelWorldBook(levelId: string): void {
  if (!levelBookManager) initPromptAssembler();
  levelBookManager!.switchToLevel(levelId);
}

/** 获取当前世界书管理器 */
export function getLevelBookManager(): LevelWorldBookManager | null {
  return levelBookManager;
}

// ─── 预设管理 ───

/**
 * 获取当前激活的预设
 */
export function getActivePreset(): PresetPack {
  return getBackroomsPreset();
}

// ─── 组装完整 system prompt ───

/**
 * 组装完整 system prompt
 * 1. 预设的 prompts[]（按 order 排序）
 * 2. 世界书扫描结果（酒馆式关键词触发 + 常驻注入）
 * 3. 动态上下文（背包、状态等）
 */
export function assembleSystemPrompt(
  level: LevelDef | null,
  exploration: ExplorationState,
  preset?: PresetPack,
  chatHistory?: Array<{ role?: string; content?: string }>,
  userText?: string,
): string {
  const activePreset = preset || getActivePreset();
  const parts: string[] = [];

  // ─── 1. 预设 prompts ───
  const enabledPrompts = getEnabledPrompts(activePreset);
  for (const entry of enabledPrompts) {
    parts.push(entry.content);
  }

  // ─── 2. 世界书扫描注入 ───
  if (levelBookManager && level) {
    // 确保当前 Level 的世界书已加载
    if (levelBookManager.currentLevelId !== level.id) {
      levelBookManager.switchToLevel(level.id);
    }

    const entries = levelBookManager.getEntries();
    if (entries.length > 0) {
      // 创建临时世界书管理器进行扫描
      const wbManager = createWorldBookManager(entries);

      // 使用酒馆式扫描引擎
      const history = chatHistory || [];
      const input = userText || '';
      const injection = wbManager.scanAndBuildInjection(history, input);

      // 注入 before_char 区块
      if (injection.beforeChar) {
        parts.push(injection.beforeChar);
      }

      // 注入 after_char 区块
      if (injection.afterChar) {
        parts.push(injection.afterChar);
      }

      // 注入 atDepth 条目（如果有）
      for (const atDepth of injection.atDepthEntries) {
        parts.push(atDepth.content);
      }
    }
  }

  // ─── 3. 动态上下文 ───
  const contextParts: string[] = [];

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

  // 状态（模糊化，无数值）
  const statusParts: string[] = [];
  if (exploration.survivalTime > 10) {
    statusParts.push('你已经在这里待了很久了，疲惫感正在侵蚀你');
  } else if (exploration.survivalTime > 5) {
    statusParts.push('你开始感到有些疲惫');
  }
  if (exploration.currentMood !== '困惑') {
    statusParts.push(`你现在的情绪：${exploration.currentMood}`);
  }
  if (statusParts.length > 0) {
    contextParts.push(`## 当前状态\n${statusParts.join('\n')}`);
  }

  if (contextParts.length > 0) {
    parts.push(contextParts.join('\n\n'));
  }

  return parts.join('\n\n');
}
