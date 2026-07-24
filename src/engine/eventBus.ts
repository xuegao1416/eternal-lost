// ============================================================
//  事件总线 — 后室世界专用
//  替代 SillyTavern tavern_events，提供 pub/sub 模式
// ============================================================

import type { LevelDef, RuleDef, InventoryItem, NotebookEntry } from '../data/level-schema';
import type { ChatMessage } from '../stores/gameStore';

type EventHandler = (...args: any[]) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]) {
    this.handlers.get(event)?.forEach(fn => {
      try { fn(...args); } catch (e) { console.error(`[EventBus] ${event} handler error:`, e); }
    });
  }

  once(event: string, handler: EventHandler) {
    const wrapped = (...args: any[]) => {
      this.off(event, wrapped);
      handler(...args);
    };
    this.on(event, wrapped);
  }
}

export const eventBus = new EventBus();

// 事件常量 — 后室世界专用
export const EVENTS = {
  // 层级切换
  LEVEL_CHANGE: 'level_change',
  // 实体遭遇
  ENTITY_ENCOUNTER: 'entity_encounter',
  // 规则发现
  RULE_DISCOVERED: 'rule_discovered',
  // 物品发现
  ITEM_FOUND: 'item_found',
  // 玩家死亡
  PLAYER_DEATH: 'player_death',
  // 情绪变化
  MOOD_CHANGE: 'mood_change',
  // 笔记本条目
  NOTEBOOK_ENTRY: 'notebook_entry',
  // 消息收发
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  // 生成状态
  GENERATION_STARTED: 'generation_started',
  GENERATION_ENDED: 'generation_ended',
  GENERATION_STOPPED: 'generation_stopped',
  // 自动存档
  AUTO_SAVE: 'auto_save',
} as const;

// 事件载荷类型（供 TypeScript 使用）
export interface EventPayloads {
  [EVENTS.LEVEL_CHANGE]: { from: LevelDef | null; to: LevelDef };
  [EVENTS.ENTITY_ENCOUNTER]: { entity: string; levelId: string; danger: string };
  [EVENTS.RULE_DISCOVERED]: { rule: RuleDef };
  [EVENTS.ITEM_FOUND]: { item: InventoryItem };
  [EVENTS.PLAYER_DEATH]: { cause: string; levelId: string };
  [EVENTS.MOOD_CHANGE]: { from: string; to: string };
  [EVENTS.NOTEBOOK_ENTRY]: { entry: NotebookEntry };
  [EVENTS.MESSAGE_RECEIVED]: { message: ChatMessage };
  [EVENTS.MESSAGE_SENT]: { content: string };
  [EVENTS.GENERATION_STARTED]: {};
  [EVENTS.GENERATION_ENDED]: {};
  [EVENTS.GENERATION_STOPPED]: {};
  [EVENTS.AUTO_SAVE]: {};
}
