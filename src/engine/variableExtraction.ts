// ============================================================
//  后室 — 变量提取
//  从 AI 回复中提取 ExplorationState 变更
// ============================================================

import type { VariableManager } from './variableManager';
import type { ExplorationState } from '../data/level-schema';
import type { ParsedResponse } from './responseExtractor';
import type { ApiConfig } from '../api/types';
import { requestCompletion } from '../api/client';
import { loadPresets } from '../components/settings/apiPresetUtils';
import { STORAGE_KEYS } from '../config/storageKeys';

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── 变量提取 Prompt ───

/**
 * 构建后室变量提取的 System Prompt
 * 针对 ExplorationState 的字段进行提取
 */
function buildVariableExtractionPrompt(): string {
  return `你是一个后台变量裁定系统，负责分析玩家消息和AI回复，提取需要更新的探索状态变量。
你的任务是识别剧情中的关键变化，更新游戏状态，但不续写剧情。

═══════════════════════════════════════
【核心原则】
1. 只做变量更新，不续写剧情，不做价值评判
2. 仅依据已发生事实更新，禁止凭空脑补关键结果
3. 保持变量的逻辑性和合理性
4. 没发生的事不更新：正文里没有发生影响某变量的事件，该变量就保持原样

【输出格式】
用 <UpdateVariable></UpdateVariable> 标签包裹JSON输出。
只写需要更新的字段，未变化的字段不要输出。

【可更新的变量】
{
  "currentLevelId": "层级ID（如 level-0, level-1）",
  "discoveredRules": [
    {
      "id": "规则唯一ID（格式: rule-时间戳）",
      "content": "规则内容描述",
      "source": "observed/told/discovered/survived",
      "confidence": "confirmed/suspected/rumor"
    }
  ],
  "inventory": [
    {
      "id": "物品唯一ID（格式: item-时间戳）",
      "name": "物品名称",
      "description": "物品描述",
      "quantity": 1,
      "usable": true,
      "foundAt": "发现地点层级ID"
    }
  ],
  "notebook": [
    {
      "id": "笔记唯一ID（格式: note-时间戳）",
      "content": "笔记内容",
      "category": "rule/observation/entity/location/survival",
      "levelId": "所属层级ID",
      "importance": "low/medium/high/critical"
    }
  ],
  "survivalTime": 0,
  "deathCount": 0,
  "escapeAttempts": 0,
  "currentMood": "情绪描述（如：恐惧、困惑、绝望、冷静、紧张）",
  "characterProfile": {
    "name": "降临者姓名",
    "gender": "性别",
    "background": "背景",
    "appearance": "外貌",
    "items": "随身物品",
    "personality": "性格"
  }
}

═══════════════════════════════════════
【层级切换规则】
- 当叙事中玩家通过切出（noclip）、发现通道、跌落等方式进入新层级时，更新 currentLevelId
- 层级ID必须是已定义的层级（如 level-0, level-1, level-2 等）
- 不确定时不要更新

【规则发现规则】
- 当玩家观察到、被告知、或亲身验证了后室的某种规律时，添加规则
- source: observed=亲眼观察, told=他人告知, discovered=主动发现, survived=用命换来的教训
- confidence: confirmed=多次验证, suspected=初步推断, rumor=道听途说
- 去重：不要添加与已有规则内容重复的新规则

【物品发现规则】
- 当玩家捡到、获得物品时添加到 inventory
- quantity 默认为 1，如果文中明确提到数量则使用该数量
- foundAt 使用当前层级ID

【笔记本规则】
- 当叙事中有值得记录的信息时添加笔记本条目
- category: rule=规则, observation=观察, entity=实体, location=地点, survival=生存技巧
- importance 根据信息对生存的重要性判断

【情绪变化规则】
- 当玩家情绪发生明显变化时更新 currentMood
- 使用简洁的中文情绪词：恐惧、困惑、绝望、冷静、紧张、焦虑、平静、狂喜等

【死亡计数规则】
- 当玩家在叙事中死亡时，deathCount +1
- 后室中死亡后通常会在 Level 0 重生

【逃脱尝试规则】
- 当玩家尝试逃离后室（通过切出、寻找出口等）时，escapeAttempts +1

【存活时间规则】
- 每轮对话 survivalTime +1（代表时间推移）
- 但如果变量快照中已经+过了，就不要重复+1

═══════════════════════════════════════
【禁止事项】
1. 禁止输出剧情续写或价值评判
2. 不要输出与变量更新无关的内容
3. 不确定的变更不要输出，宁可少更新也不要误更新
4. survivalTime 只在未被主流程更新时才输出

【示例输出】
<UpdateVariable>{"currentMood":"恐惧","notebook":[{"id":"note-1721836800","content":"荧光灯闪烁时不要移动，它们似乎对运动敏感","category":"rule","levelId":"level-0","importance":"high"}]}</UpdateVariable>`;
}

// ─── 精简 ExplorationState 用于变量提取 ───

function sanitizeForExtraction(state: ExplorationState): ExplorationState {
  // 笔记本只保留最近 20 条（减少序列化体积）
  const notebook = state.notebook.slice(-20);
  // 发现的规则只保留最近 20 条
  const discoveredRules = state.discoveredRules.slice(-20);
  return { ...state, notebook, discoveredRules };
}

// ─── API 调用 ───

async function callAuxiliaryApiForExtraction(
  config: ApiConfig,
  exploration: ExplorationState,
  userMessage: string,
  aiContentText: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const stateSnapshot = JSON.stringify(sanitizeForExtraction(exploration));

  const messages: { role: string; content: string }[] = [
    { role: 'user', content: `[当前探索状态快照]: ${stateSnapshot}` },
  ];

  if (userMessage) {
    messages.push({ role: 'user', content: `[玩家消息]: ${userMessage}` });
  }
  messages.push({ role: 'assistant', content: aiContentText });

  const variableUpdatePrompt = buildVariableExtractionPrompt();
  const fullMessages = [
    ...messages,
    { role: 'user', content: variableUpdatePrompt },
  ];

  try {
    const result = await requestCompletion(config, fullMessages, {
      temperature: 0.6,
      maxTokens: 2048,
      signal,
    });

    const content = result.text;
    if (!content) return null;

    // 从回复中提取 UpdateVariable 标签内的 JSON
    const tagMatch = content.match(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/i);
    if (tagMatch) {
      return tagMatch[1].trim();
    }

    // 兜底：尝试匹配 JSON 代码块
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // 兜底：匹配裸 JSON 对象
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = content.slice(firstBrace, lastBrace + 1).trim();
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // 不是合法 JSON
      }
    }

    console.warn('[变量提取] AI 回复中未找到有效的 UpdateVariable 内容，回复前200字:', content.slice(0, 200));
    return null;
  } catch (err) {
    console.warn('[变量提取] API 调用失败:', (err as Error).message || err);
    return null;
  }
}

// ─── 主入口 ───

/**
 * 从 AI 回复中提取变量更新并应用到 ExplorationState
 *
 * 流程：
 * 1. 将探索状态快照 + 用户消息 + AI 回复发给变量提取 API
 * 2. 解析返回的 JSON 更新
 * 3. 通过 VariableManager 应用变更
 */
export async function runVariableExtraction(params: {
  varMgr: VariableManager;
  parsed: ParsedResponse;
  round: number;
  userText: string;
  mainApiConfig: ApiConfig;
  exploration: ExplorationState;
  delayMs: number;
  maxRetries: number;
  onUpdate?: (newState: ExplorationState) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { varMgr, parsed, round, userText, mainApiConfig, exploration, delayMs, maxRetries, onUpdate, signal } = params;

  // 选择 API 配置：优先变量提取专用预设 > 主API
  let effectiveConfig: ApiConfig = mainApiConfig;
  try {
    const varPresetId = localStorage.getItem(STORAGE_KEYS.PIPELINE_CONFIG);
    if (varPresetId) {
      // 尝试从预设中查找变量提取专用配置
      const presets = loadPresets();
      const parsed = JSON.parse(varPresetId);
      if (parsed?.variablePresetId) {
        const preset = presets.find(p => p.id === parsed.variablePresetId);
        if (preset) {
          effectiveConfig = { ...preset.config };
        }
      }
    }
  } catch { /* localStorage 不可用时 fallback */ }

  // 等待可配置的延迟
  if (delayMs > 0) {
    await sleep(delayMs);
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (parsed.content) {
        const updateJson = await callAuxiliaryApiForExtraction(
          effectiveConfig,
          exploration,
          userText,
          parsed.content,
          signal,
        );

        if (updateJson) {
          // 尝试解析 JSON 更新并应用到状态
          try {
            const updates = JSON.parse(updateJson);
            applyUpdatesToState(varMgr, exploration, updates, round, onUpdate);
          } catch (parseErr) {
            console.warn('[变量提取] JSON 解析失败:', (parseErr as Error).message, '内容前200字:', updateJson.slice(0, 200));
          }
        } else {
          console.warn('[变量提取] 辅助 API 未返回有效的变量更新内容');
        }
      }

      return;
    } catch (err: unknown) {
      lastError = err;
      console.warn(`[变量提取] 第 ${attempt + 1}/${maxRetries + 1} 次失败:`, (err as Error).message || err);
      if (attempt < maxRetries) {
        await sleep(delayMs);
      }
    }
  }

  console.warn('[变量提取] 全部重试失败:', (lastError as Error)?.message || lastError);
}

// ─── 变更应用 ───

/**
 * 将 AI 提取的 JSON 更新应用到 ExplorationState
 */
function applyUpdatesToState(
  varMgr: VariableManager,
  currentState: ExplorationState,
  updates: Record<string, unknown>,
  _round: number,
  onUpdate?: (newState: ExplorationState) => void,
): void {
  let newState = structuredClone(currentState);
  let hasChanges = false;

  // 层级切换
  if (typeof updates.currentLevelId === 'string' && updates.currentLevelId !== currentState.currentLevelId) {
    newState.currentLevelId = updates.currentLevelId;
    if (!newState.visitedLevels.includes(updates.currentLevelId)) {
      newState.visitedLevels = [...newState.visitedLevels, updates.currentLevelId];
    }
    hasChanges = true;
  }

  // 发现规则
  if (Array.isArray(updates.discoveredRules)) {
    for (const rule of updates.discoveredRules) {
      if (rule.id && rule.content && !newState.discoveredRules.some(r => r.id === rule.id || r.content === rule.content)) {
        newState.discoveredRules = [...newState.discoveredRules, {
          id: rule.id,
          content: rule.content,
          source: rule.source || 'observed',
          confidence: rule.confidence || 'suspected',
          discoveredAt: Date.now(),
        }];
        hasChanges = true;
      }
    }
  }

  // 背包物品
  if (Array.isArray(updates.inventory)) {
    for (const item of updates.inventory) {
      if (item.id && item.name) {
        const existing = newState.inventory.find(i => i.id === item.id || i.name === item.name);
        if (existing) {
          // 更新已有物品
          newState.inventory = newState.inventory.map(i =>
            i.id === existing.id ? { ...i, quantity: item.quantity ?? i.quantity } : i,
          );
        } else {
          newState.inventory = [...newState.inventory, {
            id: item.id,
            name: item.name,
            description: item.description || '',
            quantity: item.quantity || 1,
            usable: item.usable !== false,
            foundAt: item.foundAt || currentState.currentLevelId,
          }];
        }
        hasChanges = true;
      }
    }
  }

  // 笔记本条目
  if (Array.isArray(updates.notebook)) {
    for (const entry of updates.notebook) {
      if (entry.id && entry.content && !newState.notebook.some(e => e.id === entry.id)) {
        newState.notebook = [...newState.notebook, {
          id: entry.id,
          content: entry.content,
          category: entry.category || 'observation',
          levelId: entry.levelId || currentState.currentLevelId,
          importance: entry.importance || 'medium',
          timestamp: Date.now(),
        }];
        hasChanges = true;
      }
    }
  }

  // 存活时间
  if (typeof updates.survivalTime === 'number' && updates.survivalTime !== currentState.survivalTime) {
    newState.survivalTime = updates.survivalTime;
    hasChanges = true;
  }

  // 死亡计数
  if (typeof updates.deathCount === 'number' && updates.deathCount !== currentState.deathCount) {
    newState.deathCount = updates.deathCount;
    hasChanges = true;
  }

  // 逃脱尝试
  if (typeof updates.escapeAttempts === 'number' && updates.escapeAttempts !== currentState.escapeAttempts) {
    newState.escapeAttempts = updates.escapeAttempts;
    hasChanges = true;
  }

  // 情绪
  if (typeof updates.currentMood === 'string' && updates.currentMood !== currentState.currentMood) {
    newState.currentMood = updates.currentMood;
    hasChanges = true;
  }

  // 降临者档案
  if (updates.characterProfile && typeof updates.characterProfile === 'object') {
    const profile = updates.characterProfile as Record<string, unknown>;
    if (profile.name) {
      newState.characterProfile = {
        name: String(profile.name || ''),
        gender: String(profile.gender || ''),
        age: String(profile.age || ''),
        occupation: String(profile.occupation || ''),
        background: String(profile.background || ''),
        appearance: String(profile.appearance || ''),
        items: String(profile.items || ''),
        personality: String(profile.personality || ''),
        ...(profile.fileNumber ? { fileNumber: String(profile.fileNumber) } : {}),
      };
      hasChanges = true;
    }
  }

  if (hasChanges) {
    // 使用 VariableManager 的差异计算记录变更
    varMgr.diffStates(currentState, newState);
    onUpdate?.(newState);
  }
}
