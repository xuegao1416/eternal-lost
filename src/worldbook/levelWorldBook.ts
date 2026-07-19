// ============================================================
//  Level 专属世界书系统
//  每个 Level 一套独立世界书，切入切出时切换
// ============================================================

import type { WorldBookEntry } from './index';

// ─── Level 世界书定义 ───

/** Level 世界书文件格式 */
export interface LevelWorldBook {
  /** Level ID（如 "level-0"） */
  levelId: string;
  /** Level 名称 */
  levelName: string;
  /** 世界书条目 */
  entries: WorldBookEntry[];
  /** 元数据 */
  meta?: {
    /** 生存难度 */
    survivalClass?: string;
    /** 氛围关键词 */
    atmosphere?: string[];
    /** 可能出现的实体 ID */
    entityIds?: string[];
    /** 可能出现的物品 ID */
    itemIds?: string[];
    /** 可切出到的 Level ID */
    exitTo?: string[];
  };
}

// ─── 世界书切换管理器 ───

export interface LevelWorldBookManager {
  /** 当前激活的 Level ID */
  currentLevelId: string | null;
  /** 当前激活的世界书条目 */
  currentEntries: WorldBookEntry[];
  /** 切换到新 Level */
  switchToLevel(levelId: string): void;
  /** 获取当前条目 */
  getEntries(): WorldBookEntry[];
  /** 添加条目（用于运行时动态添加） */
  addEntries(entries: WorldBookEntry[]): void;
  /** 清除当前条目 */
  clear(): void;
}

// ─── 世界书注册表 ───

/** 已注册的 Level 世界书 */
const registeredBooks = new Map<string, LevelWorldBook>();

/** 注册一个 Level 世界书 */
export function registerLevelBook(book: LevelWorldBook): void {
  registeredBooks.set(book.levelId, book);
}

/** 批量注册 */
export function registerLevelBooks(books: LevelWorldBook[]): void {
  for (const book of books) {
    registeredBooks.set(book.levelId, book);
  }
}

/** 获取已注册的 Level 世界书 */
export function getLevelBook(levelId: string): LevelWorldBook | undefined {
  return registeredBooks.get(levelId);
}

/** 获取所有已注册的 Level ID */
export function getRegisteredLevelIds(): string[] {
  return Array.from(registeredBooks.keys());
}

// ─── 创建管理器 ───

export function createLevelWorldBookManager(): LevelWorldBookManager {
  let currentLevelId: string | null = null;
  let currentEntries: WorldBookEntry[] = [];

  return {
    get currentLevelId() { return currentLevelId; },
    get currentEntries() { return currentEntries; },

    switchToLevel(levelId: string): void {
      const book = registeredBooks.get(levelId);
      if (!book) {
        console.warn(`[LevelWorldBook] 未找到 Level ${levelId} 的世界书`);
        currentLevelId = levelId;
        currentEntries = [];
        return;
      }

      console.log(`[LevelWorldBook] 切换: ${currentLevelId} → ${levelId} (${book.entries.length} 条目)`);
      currentLevelId = levelId;
      currentEntries = [...book.entries];
    },

    getEntries(): WorldBookEntry[] {
      return [...currentEntries];
    },

    addEntries(entries: WorldBookEntry[]): void {
      currentEntries = [...currentEntries, ...entries];
    },

    clear(): void {
      currentLevelId = null;
      currentEntries = [];
    },
  };
}

// ─── 从 JSON 加载世界书 ───

/**
 * 将 LevelWorldBook 转换为 WorldBookEntry[]
 * 直接使用已有的 WorldBookEntry 格式，无需转换
 */
export function levelBookToEntries(book: LevelWorldBook): WorldBookEntry[] {
  return book.entries.map((entry, idx) => ({
    ...entry,
    // 确保有 ID（如果没有则自动生成）
    id: entry.id ?? -(idx + 1),
    // 确保启用
    enabled: entry.enabled ?? true,
  }));
}

// ─── 预设世界书模板 ───

/** 创建 Level 氛围条目（常驻注入） */
export function createAtmosphereEntry(
  levelId: string,
  levelName: string,
  atmosphere: string,
): WorldBookEntry {
  return {
    id: -1,
    uid: `${levelId}-atmosphere`,
    comment: `[${levelId}] 氛围描写`,
    content: atmosphere,
    constant: true,
    enabled: true,
    selective: false,
    keys: [],
    secondaryKeys: [],
    position: 'before_char',
    insertionOrder: 10,
    order: 10,
  };
}

/** 创建 Level 规则条目（常驻注入） */
export function createRulesEntry(
  levelId: string,
  rules: string[],
): WorldBookEntry {
  return {
    id: -2,
    uid: `${levelId}-rules`,
    comment: `[${levelId}] 层级规则`,
    content: `## 该层级的已知规则\n${rules.map(r => `- ${r}`).join('\n')}`,
    constant: true,
    enabled: true,
    selective: false,
    keys: [],
    secondaryKeys: [],
    position: 'after_char',
    insertionOrder: 20,
    order: 20,
  };
}

/** 创建实体条目（关键词触发） */
export function createEntityEntry(
  levelId: string,
  entityId: string,
  entityName: string,
  description: string,
  keywords: string[],
): WorldBookEntry {
  return {
    id: -100,
    uid: `${levelId}-entity-${entityId}`,
    comment: `[${levelId}] 实体: ${entityName}`,
    content: description,
    constant: false,
    enabled: true,
    selective: true,
    keys: keywords,
    secondaryKeys: [],
    position: 'after_char',
    insertionOrder: 50,
    order: 50,
  };
}

/** 创建物品条目（关键词触发） */
export function createItemEntry(
  levelId: string,
  itemId: string,
  itemName: string,
  description: string,
  keywords: string[],
): WorldBookEntry {
  return {
    id: -200,
    uid: `${levelId}-item-${itemId}`,
    comment: `[${levelId}] 物品: ${itemName}`,
    content: description,
    constant: false,
    enabled: true,
    selective: true,
    keys: keywords,
    secondaryKeys: [],
    position: 'after_char',
    insertionOrder: 60,
    order: 60,
  };
}

/** 创建出口条目（常驻注入） */
export function createExitEntry(
  levelId: string,
  exits: Array<{ to: string; condition: string; method: string }>,
): WorldBookEntry {
  const exitText = exits.map(e =>
    `- → ${e.to}: ${e.condition}（方式: ${e.method}）`
  ).join('\n');

  return {
    id: -3,
    uid: `${levelId}-exits`,
    comment: `[${levelId}] 出口/切出条件`,
    content: `## 可能的出口\n${exitText}\n\n当玩家满足某个出口条件时，在回复的最后一段描写切出过程。`,
    constant: true,
    enabled: true,
    selective: false,
    keys: [],
    secondaryKeys: [],
    position: 'after_char',
    insertionOrder: 30,
    order: 30,
  };
}
