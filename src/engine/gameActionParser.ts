// ============================================================
//  游戏动作解析器
//  从 AI 回复中检测 [LEVEL_CHANGE] [ITEM_FOUND] 
//  [RULE_DISCOVERED] [PLAYER_DEATH] 等标记
//  并自动触发对应的游戏状态变更
// ============================================================

import { useGameStore } from '../stores/gameStore';
import { getLevelById } from '../data/levels';
import type { RuleDef, InventoryItem, NotebookEntry } from '../data/level-schema';
import { createDefaultExplorationState } from '../data/level-schema';

// ─── 标记格式 ─────────────────────────────

/**
 * 支持的标记：
 * [LEVEL_CHANGE:level-id]
 * [ITEM_FOUND:名称|描述|数量]
 * [RULE_DISCOVERED:内容|来源|可信度]
 * [PLAYER_DEATH]
 * [MOOD_CHANGE:新情绪]
 * [NOTEBOOK_ENTRY:内容|分类|重要性]
 */

export interface ParsedAction {
  type: 'level_change' | 'item_found' | 'rule_discovered' | 'player_death' | 'mood_change' | 'notebook_entry';
  /** 原始标记文本 */
  raw: string;
  /** 标记在原文中的起始位置 */
  startIndex: number;
  /** 标记在原文中的结束位置 */
  endIndex: number;
  /** 动作参数 */
  params: Record<string, string>;
}

export interface ParseResult {
  /** 清理后的文本（移除了所有标记） */
  cleanText: string;
  /** 解析出的动作列表 */
  actions: ParsedAction[];
}

// ─── 正则模式 ─────────────────────────────

const PATTERNS = {
  level_change: /\[LEVEL_CHANGE:\s*([^\]]+?)\s*\]/g,
  item_found: /\[ITEM_FOUND:\s*([^|]+?)\s*\|\s*([^|]*?)\s*(?:\|\s*(\d+)\s*)?\]/g,
  rule_discovered: /\[RULE_DISCOVERED:\s*([^|]+?)\s*(?:\|\s*([^\]]*?)\s*)?\]/g,
  player_death: /\[PLAYER_DEATH\]/g,
  mood_change: /\[MOOD_CHANGE:\s*([^\]]+?)\s*\]/g,
  notebook_entry: /\[NOTEBOOK_ENTRY:\s*([^|]+?)\s*\|\s*([^|]*?)\s*(?:\|\s*([^\]]*?)\s*)?\]/g,
};

/** 所有标记的通用正则（用于一次性提取 + 清理） */
const ALL_MARKERS = /\[(LEVEL_CHANGE|ITEM_FOUND|RULE_DISCOVERED|PLAYER_DEATH|MOOD_CHANGE|NOTEBOOK_ENTRY):?[^\]]*?\]/g;

// ─── 解析 ─────────────────────────────────

/** 解析 AI 回复文本，提取游戏动作 */
export function parseGameActions(text: string): ParseResult {
  const actions: ParsedAction[] = [];
  let match: RegExpExecArray | null;

  // 提取层级切换
  const lcRe = new RegExp(PATTERNS.level_change.source, 'g');
  while ((match = lcRe.exec(text)) !== null) {
    actions.push({
      type: 'level_change',
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      params: { targetLevelId: match[1].trim() },
    });
  }

  // 提取物品发现
  const ifRe = new RegExp(PATTERNS.item_found.source, 'g');
  while ((match = ifRe.exec(text)) !== null) {
    actions.push({
      type: 'item_found',
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      params: {
        name: match[1].trim(),
        description: (match[2] || '').trim(),
        quantity: match[3] || '1',
      },
    });
  }

  // 提取规则发现
  const rdRe = new RegExp(PATTERNS.rule_discovered.source, 'g');
  while ((match = rdRe.exec(text)) !== null) {
    actions.push({
      type: 'rule_discovered',
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      params: {
        content: match[1].trim(),
        source: (match[2] || 'observed').trim(),
        confidence: (match[3] || 'suspected').trim(),
      },
    });
  }

  // 提取玩家死亡
  const pdRe = new RegExp(PATTERNS.player_death.source, 'g');
  while ((match = pdRe.exec(text)) !== null) {
    actions.push({
      type: 'player_death',
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      params: {},
    });
  }

  // 提取情绪变化
  const mcRe = new RegExp(PATTERNS.mood_change.source, 'g');
  while ((match = mcRe.exec(text)) !== null) {
    actions.push({
      type: 'mood_change',
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      params: { mood: match[1].trim() },
    });
  }

  // 提取笔记本条目
  const neRe = new RegExp(PATTERNS.notebook_entry.source, 'g');
  while ((match = neRe.exec(text)) !== null) {
    actions.push({
      type: 'notebook_entry',
      raw: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      params: {
        content: match[1].trim(),
        category: (match[2] || 'observation').trim(),
        importance: (match[3] || 'medium').trim(),
      },
    });
  }

  // 按出现顺序排序
  actions.sort((a, b) => a.startIndex - b.startIndex);

  // 清理标记
  const cleanText = text.replace(ALL_MARKERS, '').replace(/\n{3,}/g, '\n\n').trim();

  return { cleanText, actions };
}

// ─── 执行 ─────────────────────────────────

/** 验证层级切换是否有效 */
function isValidLevelChange(targetLevelId: string): boolean {
  const level = getLevelById(targetLevelId);
  if (level) return true;

  // 检查当前层级的出口中是否有这个目标
  const state = useGameStore.getState();
  const currentLevel = state.currentLevel;
  if (currentLevel) {
    return currentLevel.exits.some(e => e.targetLevelId === targetLevelId);
  }
  return false;
}

/** 执行解析出的游戏动作 */
export function executeGameActions(actions: ParsedAction[]): string[] {
  const feedback: string[] = [];
  const store = useGameStore.getState();

  for (const action of actions) {
    switch (action.type) {
      case 'level_change': {
        const targetId = action.params.targetLevelId;
        if (isValidLevelChange(targetId)) {
          store.setCurrentLevel(targetId);
          feedback.push(`[层级切换] 已切换到 ${targetId}`);

          // 添加系统消息提示层级切换
          const level = getLevelById(targetId);
          if (level) {
            store.addMessage({
              role: 'system',
              content: `你已进入一个新的区域：${level.name}。\n\n${level.description}`,
            });
          }
        } else {
          console.warn(`[GameAction] 无效的层级切换目标: ${targetId}`);
        }
        break;
      }

      case 'item_found': {
        const existingItems = store.exploration.inventory;
        const existingItem = existingItems.find(
          i => i.name === action.params.name,
        );

        if (existingItem) {
          // 已有同名物品，增加数量
          store.addInventoryItem({
            ...existingItem,
            id: crypto.randomUUID(),
            quantity: parseInt(action.params.quantity) || 1,
            foundAt: store.exploration.currentLevelId,
          });
          feedback.push(`[物品] ${action.params.name} ×${action.params.quantity}`);
        } else {
          store.addInventoryItem({
            id: crypto.randomUUID(),
            name: action.params.name,
            description: action.params.description || '',
            quantity: parseInt(action.params.quantity) || 1,
            usable: true,
            foundAt: store.exploration.currentLevelId,
          });
          feedback.push(`[物品] 获得 ${action.params.name}`);
        }
        break;
      }

      case 'rule_discovered': {
        const ruleContent = action.params.content;
        const exists = store.exploration.discoveredRules.some(
          r => r.content === ruleContent,
        );
        if (!exists) {
          store.addDiscoveredRule({
            id: `rule-auto-${Date.now()}`,
            content: ruleContent,
            source: (action.params.source as RuleDef['source']) || 'observed',
            confidence: (action.params.confidence as RuleDef['confidence']) || 'suspected',
          });
          feedback.push(`[规则] 发现: ${ruleContent}`);
        }
        break;
      }

      case 'player_death': {
        const state = useGameStore.getState();
        const deathCount = state.exploration.deathCount + 1;

        // 添加死亡系统消息
        store.addMessage({
          role: 'system',
          content: `你死了。\n\n这是你第 ${deathCount} 次死亡。`,
        });

        // 重置探索状态（保留角色档案、死亡计数），不触发 resetGame（会清空消息）
        const profile = state.exploration.characterProfile;
        const freshExploration = createDefaultExplorationState('level-0');
        freshExploration.deathCount = deathCount;
        freshExploration.characterProfile = profile;

        useGameStore.setState({
          exploration: freshExploration,
          currentLevel: getLevelById('level-0') || null,
        });

        // 添加重生引导消息
        store.addMessage({
          role: 'system',
          content: `你再次睁开眼睛，回到了 Level 0 的大厅。荧光灯发出熟悉的嗡嗡声，泛黄的墙纸和潮湿的地毯——一切都和之前一样。\n\n后室不愿意放你走。`,
        });

        feedback.push(`[死亡] 第 ${deathCount} 次死亡，已重置`);
        break;
      }

      case 'mood_change': {
        store.setMood(action.params.mood);
        feedback.push(`[情绪] ${action.params.mood}`);
        break;
      }

      case 'notebook_entry': {
        const category = (action.params.category || 'observation') as NotebookEntry['category'];
        const importance = (action.params.importance || 'medium') as NotebookEntry['importance'];
        store.addNotebookEntry({
          content: action.params.content,
          category,
          levelId: store.exploration.currentLevelId,
          importance,
        });
        feedback.push(`[笔记] ${action.params.content.slice(0, 30)}...`);
        break;
      }
    }
  }

  return feedback;
}
