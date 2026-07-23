// ============================================================
//  OmniRoom — 层级数据模型
//  后室世界的核心数据结构
// ============================================================

/** 实体定义 */
export interface EntityDef {
  id: string;
  name: string;
  description: string;
  behavior: string;
  danger: 'none' | 'low' | 'medium' | 'high' | 'lethal';
  encounters: string;
}

/** 规则定义 */
export interface RuleDef {
  id: string;
  content: string;
  source: 'observed' | 'told' | 'discovered' | 'survived';
  confidence: 'confirmed' | 'suspected' | 'rumor';
  discoveredAt?: number;
}

/** 出口/切出条件 */
export interface ExitDef {
  id: string;
  targetLevelId: string;
  condition: string;
  method: 'random' | 'triggered' | 'conditional';
  reliability: 'always' | 'sometimes' | 'rare';
}

/** 层级定义 */
export interface LevelDef {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  atmosphere: string;
  entities: EntityDef[];
  rules: RuleDef[];
  exits: ExitDef[];
  tags: string[];
  survivalDifficulty: string;
}

/** 笔记本条目 */
export interface NotebookEntry {
  id: string;
  content: string;
  category: 'rule' | 'observation' | 'entity' | 'location' | 'survival';
  levelId: string;
  timestamp: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

/** 背包物品 */
export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  usable: boolean;
  foundAt: string;
}

/** 降临者档案 */
export interface CharacterProfile {
  name: string;
  gender: string;
  background: string;
  appearance: string;
  items: string;
  personality: string;
}

/** 探索状态 */
export interface ExplorationState {
  currentLevelId: string;
  visitedLevels: string[];
  notebook: NotebookEntry[];
  discoveredRules: RuleDef[];
  inventory: InventoryItem[];
  survivalTime: number;
  deathCount: number;
  escapeAttempts: number;
  currentMood: string;
  characterProfile: CharacterProfile | null;
}

/** 创建默认探索状态 */
export function createDefaultExplorationState(startLevelId: string = 'level-0'): ExplorationState {
  return {
    currentLevelId: startLevelId,
    visitedLevels: [startLevelId],
    notebook: [],
    discoveredRules: [],
    inventory: [],
    survivalTime: 0,
    deathCount: 0,
    escapeAttempts: 0,
    currentMood: '困惑',
    characterProfile: null,
  };
}
