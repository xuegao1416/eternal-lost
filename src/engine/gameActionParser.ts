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

// ─── 调试模式 ─────────────────────────────
// 设置为 true 可开启详细日志输出
let _debugEnabled = false;

/** 开启/关闭调试模式 */
export function setParserDebug(enabled: boolean): void {
  _debugEnabled = enabled;
}

/** 调试日志输出 */
function debugLog(...args: unknown[]): void {
  if (_debugEnabled) {
    console.log('[GameAction]', ...args);
  }
}

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
  if (!text) {
    debugLog('空文本，跳过解析');
    return { cleanText: '', actions: [] };
  }

  const actions: ParsedAction[] = [];
  let match: RegExpExecArray | null;

  // 提取层级切换
  try {
    const lcRe = new RegExp(PATTERNS.level_change.source, 'g');
    while ((match = lcRe.exec(text)) !== null) {
      const targetId = match[1].trim();
      if (!targetId) {
        debugLog('LEVEL_CHANGE 标记缺少目标层级 ID:', match[0]);
        continue;
      }
      actions.push({
        type: 'level_change',
        raw: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        params: { targetLevelId: targetId },
      });
    }
  } catch (err) {
    console.warn('[GameAction] 解析 LEVEL_CHANGE 标记失败:', (err as Error).message);
  }

  // 提取物品发现
  try {
    const ifRe = new RegExp(PATTERNS.item_found.source, 'g');
    while ((match = ifRe.exec(text)) !== null) {
      const name = match[1].trim();
      if (!name) {
        debugLog('ITEM_FOUND 标记缺少物品名称:', match[0]);
        continue;
      }
      const qty = parseInt(match[3] || '1', 10);
      actions.push({
        type: 'item_found',
        raw: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        params: {
          name,
          description: (match[2] || '').trim(),
          quantity: String(Number.isFinite(qty) && qty > 0 ? qty : 1),
        },
      });
    }
  } catch (err) {
    console.warn('[GameAction] 解析 ITEM_FOUND 标记失败:', (err as Error).message);
  }

  // 提取规则发现
  try {
    const rdRe = new RegExp(PATTERNS.rule_discovered.source, 'g');
    while ((match = rdRe.exec(text)) !== null) {
      const content = match[1].trim();
      if (!content) {
        debugLog('RULE_DISCOVERED 标记缺少内容:', match[0]);
        continue;
      }
      const source = (match[2] || 'observed').trim();
      const confidence = (match[3] || 'suspected').trim();
      actions.push({
        type: 'rule_discovered',
        raw: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        params: { content, source, confidence },
      });
    }
  } catch (err) {
    console.warn('[GameAction] 解析 RULE_DISCOVERED 标记失败:', (err as Error).message);
  }

  // 提取玩家死亡
  try {
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
  } catch (err) {
    console.warn('[GameAction] 解析 PLAYER_DEATH 标记失败:', (err as Error).message);
  }

  // 提取情绪变化
  try {
    const mcRe = new RegExp(PATTERNS.mood_change.source, 'g');
    while ((match = mcRe.exec(text)) !== null) {
      const mood = match[1].trim();
      if (!mood) {
        debugLog('MOOD_CHANGE 标记缺少情绪值:', match[0]);
        continue;
      }
      actions.push({
        type: 'mood_change',
        raw: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        params: { mood },
      });
    }
  } catch (err) {
    console.warn('[GameAction] 解析 MOOD_CHANGE 标记失败:', (err as Error).message);
  }

  // 提取笔记本条目
  try {
    const neRe = new RegExp(PATTERNS.notebook_entry.source, 'g');
    while ((match = neRe.exec(text)) !== null) {
      const entryContent = match[1].trim();
      if (!entryContent) {
        debugLog('NOTEBOOK_ENTRY 标记缺少内容:', match[0]);
        continue;
      }
      actions.push({
        type: 'notebook_entry',
        raw: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        params: {
          content: entryContent,
          category: (match[2] || 'observation').trim(),
          importance: (match[3] || 'medium').trim(),
        },
      });
    }
  } catch (err) {
    console.warn('[GameAction] 解析 NOTEBOOK_ENTRY 标记失败:', (err as Error).message);
  }

  // 按出现顺序排序
  actions.sort((a, b) => a.startIndex - b.startIndex);

  debugLog(`解析完成: ${actions.length} 个动作`, actions.map(a => a.type));

  // 清理标记，改善空白处理
  const cleanText = cleanMarkersFromText(text);

  return { cleanText, actions };
}

// ─── 文本清理 ─────────────────────────────

/** 移除所有标记并规范化空白 */
function cleanMarkersFromText(text: string): string {
  return text
    .replace(ALL_MARKERS, '')
    // 移除标记移除后留下的行首/行尾纯空白行
    .replace(/^[ \t]+$/gm, '')
    // 连续 3 个以上换行合并为 2 个
    .replace(/\n{3,}/g, '\n\n')
    // 移除行间多余空格（标记两侧被空格包围时留下的）
    .replace(/ {2,}/g, ' ')
    .trim();
}

// ─── 验证 ─────────────────────────────────

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

/** 合法的规则来源 */
const VALID_RULE_SOURCES = new Set(['observed', 'told', 'discovered', 'survived']);
/** 合法的规则可信度 */
const VALID_CONFIDENCE_LEVELS = new Set(['confirmed', 'suspected', 'rumor']);
/** 合法的笔记本分类 */
const VALID_NOTEBOOK_CATEGORIES = new Set(['observation', 'lore', 'survival', 'entity', 'location', 'item']);
/** 合法的笔记本重要性 */
const VALID_IMPORTANCE_LEVELS = new Set(['low', 'medium', 'high', 'critical']);

/** 验证动作参数，返回问题列表（空数组 = 合法） */
function validateAction(action: ParsedAction): string[] {
  const issues: string[] = [];

  switch (action.type) {
    case 'level_change': {
      const { targetLevelId } = action.params;
      if (!targetLevelId) issues.push('缺少目标层级 ID');
      else if (!isValidLevelChange(targetLevelId)) issues.push(`目标层级 "${targetLevelId}" 不存在且不在当前出口列表中`);
      break;
    }
    case 'item_found': {
      const { name, quantity } = action.params;
      if (!name) issues.push('缺少物品名称');
      const qty = parseInt(quantity, 10);
      if (!Number.isFinite(qty) || qty <= 0) issues.push(`物品数量无效: "${quantity}"`);
      break;
    }
    case 'rule_discovered': {
      const { content, source, confidence } = action.params;
      if (!content) issues.push('缺少规则内容');
      if (source && !VALID_RULE_SOURCES.has(source)) issues.push(`规则来源 "${source}" 不合法，合法值: ${[...VALID_RULE_SOURCES].join('/')}`);
      if (confidence && !VALID_CONFIDENCE_LEVELS.has(confidence)) issues.push(`规则可信度 "${confidence}" 不合法，合法值: ${[...VALID_CONFIDENCE_LEVELS].join('/')}`);
      break;
    }
    case 'player_death':
      // 无参数需要验证
      break;
    case 'mood_change': {
      if (!action.params.mood) issues.push('缺少情绪值');
      break;
    }
    case 'notebook_entry': {
      const { content, category, importance } = action.params;
      if (!content) issues.push('缺少笔记本内容');
      if (category && !VALID_NOTEBOOK_CATEGORIES.has(category)) issues.push(`笔记本分类 "${category}" 不合法，合法值: ${[...VALID_NOTEBOOK_CATEGORIES].join('/')}`);
      if (importance && !VALID_IMPORTANCE_LEVELS.has(importance)) issues.push(`笔记本重要性 "${importance}" 不合法，合法值: ${[...VALID_IMPORTANCE_LEVELS].join('/')}`);
      break;
    }
  }

  return issues;
}

// ─── 执行 ─────────────────────────────────

/** 执行解析出的游戏动作 */
export function executeGameActions(actions: ParsedAction[]): string[] {
  const feedback: string[] = [];
  const store = useGameStore.getState();

  for (const action of actions) {
    // 验证动作参数
    const issues = validateAction(action);
    if (issues.length > 0) {
      console.warn(`[GameAction] 跳过无效动作 ${action.type}:`, issues.join('; '), '| 原始标记:', action.raw);
      debugLog('验证失败详情:', { action: action.type, params: action.params, issues });
      continue;
    }

    try {
      switch (action.type) {
        case 'level_change': {
          const targetId = action.params.targetLevelId;
          store.setCurrentLevel(targetId);
          feedback.push(`[层级切换] 已切换到 ${targetId}`);
          debugLog('层级切换:', targetId);

          // 添加系统消息提示层级切换
          const level = getLevelById(targetId);
          if (level) {
            store.addMessage({
              role: 'system',
              content: `你已进入一个新的区域：${level.name}。\n\n${level.description}`,
            });
          }
          break;
        }

        case 'item_found': {
          const { name, description, quantity } = action.params;
          const qty = parseInt(quantity, 10) || 1;
          const existingItem = store.exploration.inventory.find(i => i.name === name);

          if (existingItem) {
            // 已有同名物品，增加数量
            store.addInventoryItem({
              ...existingItem,
              id: crypto.randomUUID(),
              quantity: qty,
              foundAt: store.exploration.currentLevelId,
            });
            feedback.push(`[物品] ${name} ×${qty}`);
          } else {
            store.addInventoryItem({
              id: crypto.randomUUID(),
              name,
              description: description || '',
              quantity: qty,
              usable: true,
              foundAt: store.exploration.currentLevelId,
            });
            feedback.push(`[物品] 获得 ${name}`);
          }
          debugLog('物品发现:', { name, qty, isNew: !existingItem });
          break;
        }

        case 'rule_discovered': {
          const { content, source, confidence } = action.params;
          const exists = store.exploration.discoveredRules.some(r => r.content === content);
          if (!exists) {
            store.addDiscoveredRule({
              id: `rule-auto-${Date.now()}`,
              content,
              source: (source as RuleDef['source']) || 'observed',
              confidence: (confidence as RuleDef['confidence']) || 'suspected',
            });
            feedback.push(`[规则] 发现: ${content}`);
            debugLog('新规则发现:', { content: content.slice(0, 50), source, confidence });
          } else {
            debugLog('规则已存在，跳过:', content.slice(0, 50));
          }
          break;
        }

        case 'player_death': {
          const state = useGameStore.getState();
          const deathCount = state.exploration.deathCount + 1;
          debugLog('玩家死亡，第', deathCount, '次');

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
          debugLog('情绪变化:', action.params.mood);
          break;
        }

        case 'notebook_entry': {
          const { content, category, importance } = action.params;
          store.addNotebookEntry({
            content,
            category: (category || 'observation') as NotebookEntry['category'],
            levelId: store.exploration.currentLevelId,
            importance: (importance || 'medium') as NotebookEntry['importance'],
          });
          feedback.push(`[笔记] ${content.slice(0, 30)}...`);
          debugLog('笔记本条目:', { content: content.slice(0, 50), category, importance });
          break;
        }
      }
    } catch (err) {
      console.warn(`[GameAction] 执行动作 ${action.type} 失败:`, (err as Error).message, '| 原始标记:', action.raw);
      debugLog('执行失败详情:', { action: action.type, params: action.params, error: err });
    }
  }

  debugLog(`执行完成: ${feedback.length}/${actions.length} 个动作成功`);
  return feedback;
}

// ─── 便捷函数 ─────────────────────────────

export interface ParseAndApplyResult {
  /** 清理后的文本 */
  cleanText: string;
  /** 成功执行的动作反馈 */
  feedback: string[];
  /** 解析出的全部动作（含未通过验证的） */
  allActions: ParsedAction[];
  /** 被跳过的动作数 */
  skippedCount: number;
}

/**
 * 解析 + 执行一步到位（主流程推荐用法）
 * 相当于 parseGameActions + executeGameActions 的组合，额外返回跳过计数。
 */
export function parseAndApply(text: string): ParseAndApplyResult {
  debugLog('--- parseAndApply 开始 ---');
  const { cleanText, actions } = parseGameActions(text);
  const feedback = executeGameActions(actions);
  const skippedCount = actions.length - feedback.length;
  debugLog('--- parseAndApply 结束 ---', { total: actions.length, applied: feedback.length, skipped: skippedCount });
  return { cleanText, feedback, allActions: actions, skippedCount };
}
