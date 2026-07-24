// ============================================================
//  OmniRoom — 变量管理器
//  管理探索状态的快照、差异计算、变更应用与撤销/重做
// ============================================================

import type {
  ExplorationState,
  RuleDef,
  InventoryItem,
  NotebookEntry,
  CharacterProfile,
} from '../data/level-schema';
import { createDefaultExplorationState } from '../data/level-schema';

// ────────────────────────────────────────
//  变更类型（StateChange discriminated union）
// ────────────────────────────────────────

/** 层级切换变更 */
export interface LevelChange {
  type: 'level';
  action: 'switch';
  fromLevelId: string;
  toLevelId: string;
  /** 是否为首次访问 */
  isFirstVisit: boolean;
}

/** 规则发现/移除变更 */
export interface RuleChange {
  type: 'rule';
  action: 'add' | 'remove';
  rule: RuleDef;
}

/** 背包物品变更 */
export interface InventoryChange {
  type: 'inventory';
  action: 'add' | 'remove' | 'update';
  item: InventoryItem;
  /** update 时的旧值 */
  previousItem?: InventoryItem;
}

/** 笔记本条目变更 */
export interface NotebookChange {
  type: 'notebook';
  action: 'add' | 'remove';
  entry: NotebookEntry;
}

/** 情绪变更 */
export interface MoodChange {
  type: 'mood';
  from: string;
  to: string;
}

/** 存活时间变更 */
export interface SurvivalTimeChange {
  type: 'survivalTime';
  /** 增量（通常为 +1） */
  delta: number;
  from: number;
  to: number;
}

/** 探索进度变更（visitedLevels / deathCount / escapeAttempts） */
export interface ExplorationProgressChange {
  type: 'explorationProgress';
  field: 'visitedLevels' | 'deathCount' | 'escapeAttempts';
  /** 数组字段为新增的元素，数字字段为新值 */
  value: string | number;
  previousValue?: string[] | number;
}

/** 降临者档案变更 */
export interface CharacterProfileChange {
  type: 'characterProfile';
  action: 'set' | 'clear';
  profile: CharacterProfile | null;
  previousProfile: CharacterProfile | null;
}

/** 所有变更类型的联合 */
export type StateChange =
  | LevelChange
  | RuleChange
  | InventoryChange
  | NotebookChange
  | MoodChange
  | SurvivalTimeChange
  | ExplorationProgressChange
  | CharacterProfileChange;

// ────────────────────────────────────────
//  快照与差异
// ────────────────────────────────────────

/** 状态快照 — 完整的探索状态 + 元数据 */
export interface StateSnapshot {
  /** 快照唯一 ID */
  id: string;
  /** 创建时间戳 */
  timestamp: number;
  /** 快照时的轮次 */
  round: number;
  /** 快照时的层级 ID */
  currentLevelId: string;
  /** 完整探索状态副本 */
  state: ExplorationState;
}

/** 两个状态之间的差异 */
export interface StateDiff {
  /** 变更列表（按发生顺序） */
  changes: StateChange[];
  /** 变更总数 */
  count: number;
  /** 涉及的变更类型 */
  affectedTypes: StateChange['type'][];
}

// ────────────────────────────────────────
//  VariableManager 类
// ────────────────────────────────────────

/**
 * 探索状态变量管理器
 *
 * 职责：
 * - 状态快照的创建与管理
 * - 两个状态之间的差异计算
 * - 变更的验证、应用与合并
 * - 撤销/重做历史栈
 */
export class VariableManager {
  /** 当前状态 */
  private state: ExplorationState;

  /** 撤销栈（最多 MAX_HISTORY 层） */
  private undoStack: StateSnapshot[] = [];

  /** 重做栈 */
  private redoStack: StateSnapshot[] = [];

  /** 历史栈容量上限 */
  private static readonly MAX_HISTORY = 50;

  constructor(initial?: ExplorationState) {
    this.state = initial
      ? structuredClone(initial)
      : createDefaultExplorationState();
  }

  // ─── 快照 ───────────────────────────

  /**
   * 为当前状态创建快照
   * 使用 structuredClone 进行深拷贝，安全高效
   */
  takeSnapshot(state: ExplorationState, round: number = 0): StateSnapshot {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      round,
      currentLevelId: state.currentLevelId,
      state: structuredClone(state),
    };
  }

  // ─── 差异计算 ───────────────────────

  /**
   * 计算两个状态之间的差异
   * 逐字段对比，生成类型化的变更列表
   */
  diffStates(before: ExplorationState, after: ExplorationState): StateDiff {
    const changes: StateChange[] = [];

    // 1. 层级切换
    if (before.currentLevelId !== after.currentLevelId) {
      changes.push({
        type: 'level',
        action: 'switch',
        fromLevelId: before.currentLevelId,
        toLevelId: after.currentLevelId,
        isFirstVisit: !before.visitedLevels.includes(after.currentLevelId),
      });
    }

    // 2. 新发现的规则
    for (const rule of after.discoveredRules) {
      if (!before.discoveredRules.some(r => r.id === rule.id)) {
        changes.push({ type: 'rule', action: 'add', rule });
      }
    }
    // 被移除的规则
    for (const rule of before.discoveredRules) {
      if (!after.discoveredRules.some(r => r.id === rule.id)) {
        changes.push({ type: 'rule', action: 'remove', rule });
      }
    }

    // 3. 背包物品变更
    for (const item of after.inventory) {
      const beforeItem = before.inventory.find(i => i.id === item.id);
      if (!beforeItem) {
        changes.push({ type: 'inventory', action: 'add', item });
      } else if (JSON.stringify(beforeItem) !== JSON.stringify(item)) {
        changes.push({ type: 'inventory', action: 'update', item, previousItem: beforeItem });
      }
    }
    for (const item of before.inventory) {
      if (!after.inventory.some(i => i.id === item.id)) {
        changes.push({ type: 'inventory', action: 'remove', item });
      }
    }

    // 4. 笔记本变更
    for (const entry of after.notebook) {
      if (!before.notebook.some(e => e.id === entry.id)) {
        changes.push({ type: 'notebook', action: 'add', entry });
      }
    }
    for (const entry of before.notebook) {
      if (!after.notebook.some(e => e.id === entry.id)) {
        changes.push({ type: 'notebook', action: 'remove', entry });
      }
    }

    // 5. 情绪变更
    if (before.currentMood !== after.currentMood) {
      changes.push({ type: 'mood', from: before.currentMood, to: after.currentMood });
    }

    // 6. 存活时间变更
    if (before.survivalTime !== after.survivalTime) {
      changes.push({
        type: 'survivalTime',
        delta: after.survivalTime - before.survivalTime,
        from: before.survivalTime,
        to: after.survivalTime,
      });
    }

    // 7. 探索进度变更
    if (before.deathCount !== after.deathCount) {
      changes.push({
        type: 'explorationProgress',
        field: 'deathCount',
        value: after.deathCount,
        previousValue: before.deathCount,
      });
    }
    if (before.escapeAttempts !== after.escapeAttempts) {
      changes.push({
        type: 'explorationProgress',
        field: 'escapeAttempts',
        value: after.escapeAttempts,
        previousValue: before.escapeAttempts,
      });
    }
    // visitedLevels: 检查新增
    for (const levelId of after.visitedLevels) {
      if (!before.visitedLevels.includes(levelId)) {
        changes.push({
          type: 'explorationProgress',
          field: 'visitedLevels',
          value: levelId,
          previousValue: [...before.visitedLevels],
        });
      }
    }

    // 8. 降临者档案变更
    const bpBefore = before.characterProfile;
    const bpAfter = after.characterProfile;
    if (JSON.stringify(bpBefore) !== JSON.stringify(bpAfter)) {
      changes.push({
        type: 'characterProfile',
        action: bpAfter ? 'set' : 'clear',
        profile: bpAfter,
        previousProfile: bpBefore,
      });
    }

    const affectedTypes = [...new Set(changes.map(c => c.type))] as StateChange['type'][];

    return { changes, count: changes.length, affectedTypes };
  }

  // ─── 变更应用 ───────────────────────

  /**
   * 将一组变更应用到状态上，返回新状态（不修改原状态）
   */
  applyChanges(state: ExplorationState, changes: StateChange[]): ExplorationState {
    let result = structuredClone(state);

    for (const change of changes) {
      if (!this.validateChange(change)) {
        console.warn(`[VariableManager] 跳过非法变更:`, change);
        continue;
      }
      result = this.applySingleChange(result, change);
    }

    return result;
  }

  /**
   * 合并两层状态：base 为基础，overlay 的变更叠加在 base 之上
   * 先算出 overlay 相对于默认状态的差异，再应用到 base
   */
  mergeChanges(base: ExplorationState, overlay: ExplorationState): ExplorationState {
    // 快速路径：overlay 的每个字段直接覆盖 base
    // 对于数组和对象，overlay 优先
    const result = structuredClone(base);

    // 标量/数组字段直接覆盖
    if (overlay.currentLevelId !== base.currentLevelId) {
      result.currentLevelId = overlay.currentLevelId;
    }
    if (overlay.currentMood !== base.currentMood) {
      result.currentMood = overlay.currentMood;
    }
    if (overlay.survivalTime !== base.survivalTime) {
      result.survivalTime = overlay.survivalTime;
    }
    if (overlay.deathCount !== base.deathCount) {
      result.deathCount = overlay.deathCount;
    }
    if (overlay.escapeAttempts !== base.escapeAttempts) {
      result.escapeAttempts = overlay.escapeAttempts;
    }

    // visitedLevels: 合并（去重）
    const mergedVisited = new Set([...result.visitedLevels, ...overlay.visitedLevels]);
    result.visitedLevels = [...mergedVisited];

    // 数组字段：overlay 的条目覆盖 base 中同 ID 的条目，新条目追加
    result.discoveredRules = this.mergeArrayById(result.discoveredRules, overlay.discoveredRules);
    result.inventory = this.mergeArrayById(result.inventory, overlay.inventory);
    result.notebook = this.mergeArrayById(result.notebook, overlay.notebook);

    // characterProfile: overlay 非空则覆盖
    if (overlay.characterProfile) {
      result.characterProfile = structuredClone(overlay.characterProfile);
    }

    return result;
  }

  /** 按 ID 合并两个数组，overlay 中同 ID 的条目覆盖 base，新条目追加 */
  private mergeArrayById<T extends { id: string }>(base: T[], overlay: T[]): T[] {
    const map = new Map<string, T>();
    for (const item of base) {
      map.set(item.id, structuredClone(item));
    }
    for (const item of overlay) {
      map.set(item.id, structuredClone(item));
    }
    return [...map.values()];
  }

  /**
   * 应用单个变更到状态（返回新状态）
   */
  private applySingleChange(state: ExplorationState, change: StateChange): ExplorationState {
    switch (change.type) {
      case 'level': {
        state.currentLevelId = change.toLevelId;
        if (change.isFirstVisit && !state.visitedLevels.includes(change.toLevelId)) {
          state.visitedLevels = [...state.visitedLevels, change.toLevelId];
        }
        break;
      }

      case 'rule': {
        if (change.action === 'add') {
          // 去重：不重复添加同 ID 规则
          if (!state.discoveredRules.some(r => r.id === change.rule.id)) {
            state.discoveredRules = [...state.discoveredRules, change.rule];
          }
        } else {
          state.discoveredRules = state.discoveredRules.filter(r => r.id !== change.rule.id);
        }
        break;
      }

      case 'inventory': {
        if (change.action === 'add') {
          if (!state.inventory.some(i => i.id === change.item.id)) {
            state.inventory = [...state.inventory, change.item];
          }
        } else if (change.action === 'remove') {
          state.inventory = state.inventory.filter(i => i.id !== change.item.id);
        } else {
          // update
          state.inventory = state.inventory.map(i =>
            i.id === change.item.id ? change.item : i,
          );
        }
        break;
      }

      case 'notebook': {
        if (change.action === 'add') {
          if (!state.notebook.some(e => e.id === change.entry.id)) {
            state.notebook = [...state.notebook, change.entry];
          }
        } else {
          state.notebook = state.notebook.filter(e => e.id !== change.entry.id);
        }
        break;
      }

      case 'mood': {
        state.currentMood = change.to;
        break;
      }

      case 'survivalTime': {
        state.survivalTime = change.to;
        break;
      }

      case 'explorationProgress': {
        if (change.field === 'deathCount') {
          state.deathCount = change.value as number;
        } else if (change.field === 'escapeAttempts') {
          state.escapeAttempts = change.value as number;
        } else if (change.field === 'visitedLevels') {
          const levelId = change.value as string;
          if (!state.visitedLevels.includes(levelId)) {
            state.visitedLevels = [...state.visitedLevels, levelId];
          }
        }
        break;
      }

      case 'characterProfile': {
        if (change.action === 'set') {
          state.characterProfile = change.profile ? structuredClone(change.profile) : null;
        } else {
          state.characterProfile = null;
        }
        break;
      }
    }

    return state;
  }

  // ─── 验证 ───────────────────────────

  /**
   * 校验单个变更是否合法
   * - 层级 ID 非空
   * - 物品/规则/笔记 ID 非空
   * - 数值在合理范围内
   * - 情绪非空
   */
  validateChange(change: StateChange): boolean {
    switch (change.type) {
      case 'level': {
        if (!change.toLevelId || typeof change.toLevelId !== 'string') {
          console.warn('[VariableManager] 非法层级 ID:', change.toLevelId);
          return false;
        }
        if (change.fromLevelId === change.toLevelId) {
          return false; // 无变化，跳过
        }
        return true;
      }

      case 'rule': {
        if (!change.rule?.id || !change.rule?.content) {
          console.warn('[VariableManager] 规则缺少 id 或 content');
          return false;
        }
        if (!['observed', 'told', 'discovered', 'survived'].includes(change.rule.source)) {
          console.warn('[VariableManager] 非法规则来源:', change.rule.source);
          return false;
        }
        if (!['confirmed', 'suspected', 'rumor'].includes(change.rule.confidence)) {
          console.warn('[VariableManager] 非法规则可信度:', change.rule.confidence);
          return false;
        }
        return true;
      }

      case 'inventory': {
        if (!change.item?.id || !change.item?.name) {
          console.warn('[VariableManager] 物品缺少 id 或 name');
          return false;
        }
        if (typeof change.item.quantity !== 'number' || change.item.quantity < 0) {
          console.warn('[VariableManager] 非法物品数量:', change.item.quantity);
          return false;
        }
        return true;
      }

      case 'notebook': {
        if (!change.entry?.id || !change.entry?.content) {
          console.warn('[VariableManager] 笔记缺少 id 或 content');
          return false;
        }
        if (!['rule', 'observation', 'entity', 'location', 'survival'].includes(change.entry.category)) {
          console.warn('[VariableManager] 非法笔记分类:', change.entry.category);
          return false;
        }
        if (!['low', 'medium', 'high', 'critical'].includes(change.entry.importance)) {
          console.warn('[VariableManager] 非法笔记重要性:', change.entry.importance);
          return false;
        }
        return true;
      }

      case 'mood': {
        if (!change.to || typeof change.to !== 'string') {
          console.warn('[VariableManager] 非法情绪值:', change.to);
          return false;
        }
        if (change.from === change.to) {
          return false; // 无变化
        }
        return true;
      }

      case 'survivalTime': {
        if (!Number.isFinite(change.to) || change.to < 0) {
          console.warn('[VariableManager] 非法存活时间:', change.to);
          return false;
        }
        return true;
      }

      case 'explorationProgress': {
        if (change.field === 'deathCount' || change.field === 'escapeAttempts') {
          if (typeof change.value !== 'number' || !Number.isFinite(change.value) || change.value < 0) {
            console.warn(`[VariableManager] 非法 ${change.field} 值:`, change.value);
            return false;
          }
        }
        if (change.field === 'visitedLevels') {
          if (!change.value || typeof change.value !== 'string') {
            console.warn('[VariableManager] 非法 visitedLevels 值:', change.value);
            return false;
          }
        }
        return true;
      }

      case 'characterProfile': {
        if (change.action === 'set' && change.profile) {
          if (!change.profile.name || typeof change.profile.name !== 'string') {
            console.warn('[VariableManager] 降临者档案缺少 name');
            return false;
          }
        }
        return true;
      }

      default:
        return false;
    }
  }

  // ─── 撤销/重做 ──────────────────────

  /**
   * 将当前状态压入撤销栈，清空重做栈
   * 超出 MAX_HISTORY 时丢弃最旧的快照
   */
  pushHistory(state: ExplorationState): void {
    const snapshot = this.takeSnapshot(state);
    this.undoStack.push(snapshot);

    // 超出上限时丢弃最旧的
    if (this.undoStack.length > VariableManager.MAX_HISTORY) {
      this.undoStack.shift();
    }

    // 新操作清空重做栈
    this.redoStack = [];
  }

  /**
   * 撤销：从撤销栈弹出上一个状态，当前状态压入重做栈
   */
  undo(): ExplorationState | null {
    if (this.undoStack.length === 0) return null;

    // 当前状态压入重做栈
    this.redoStack.push(this.takeSnapshot(this.state));

    // 弹出撤销栈顶
    const snapshot = this.undoStack.pop()!;
    this.state = structuredClone(snapshot.state);

    return structuredClone(this.state);
  }

  /**
   * 重做：从重做栈弹出下一个状态，当前状态压入撤销栈
   */
  redo(): ExplorationState | null {
    if (this.redoStack.length === 0) return null;

    // 当前状态压入撤销栈
    this.undoStack.push(this.takeSnapshot(this.state));

    // 弹出重做栈顶
    const snapshot = this.redoStack.pop()!;
    this.state = structuredClone(snapshot.state);

    return structuredClone(this.state);
  }

  // ─── 工具方法 ───────────────────────

  /**
   * 获取当前状态的只读副本
   */
  getState(): ExplorationState {
    return structuredClone(this.state);
  }

  /**
   * 用外部状态替换当前状态（用于存档恢复）
   */
  setState(state: ExplorationState): void {
    this.state = structuredClone(state);
  }

  /**
   * 获取撤销栈深度（调试用）
   */
  get undoDepth(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈深度（调试用）
   */
  get redoDepth(): number {
    return this.redoStack.length;
  }

  /**
   * 清空所有历史（用于新游戏开始时）
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * 获取撤销/重做描述列表（调试用）
   */
  getHistorySummary(): { undoCount: number; redoCount: number; undoIds: string[]; redoIds: string[] } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      undoIds: this.undoStack.map(s => s.id),
      redoIds: this.redoStack.map(s => s.id),
    };
  }

  // ─── 序列化 ───────────────────────────

  /** 序列化为 JSON（用于存档） */
  toJSON(): { state: ExplorationState } {
    return { state: this.state };
  }

  /** 从 JSON 恢复 */
  static fromJSON(data: { state: ExplorationState }): VariableManager {
    return new VariableManager(data.state);
  }
}

// ────────────────────────────────────────
//  单例导出
// ────────────────────────────────────────

/** 全局唯一的 VariableManager 实例 */
export const variableManager = new VariableManager();
