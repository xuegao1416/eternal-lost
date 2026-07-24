// ============================================================
//  OmniRoom — 管线类型定义
//  后室探索的 DAG 执行管线
//  执行顺序：叙事生成 → 层级切换 / 实体遭遇 / 规则检验(并行) → 笔记更新 → 状态提取
// ============================================================

import { STORAGE_KEYS } from '../config/storageKeys';

/** 管线节点 ID（后室主题） */
export type PipelineNodeId =
  | 'narrative'          // 叙事生成（主任务）
  | 'level_switch'      // 层级切换处理
  | 'entity_encounter'  // 实体遭遇处理
  | 'rule_check'        // 规则检验
  | 'notebook_update'   // 笔记本更新
  | 'state_extract';    // 探索状态提取（最后执行）

/** 管线阶段状态 */
export type PipelineStageStatus = 'pending' | 'running' | 'success' | 'warning' | 'error' | 'skipped';

/** 管线阶段结果 */
export interface PipelineStageResult {
  status: PipelineStageStatus;
  label: string;
  attempts?: number;
  maxAttempts?: number;
  dataLength?: number;
  error?: string;
  skipped?: boolean;
  startTime?: number;
  endTime?: number;
  /** 附加数据（如切换的层级 ID、遭遇的实体名等） */
  extra?: Record<string, unknown>;
}

/** 管线状态（快照，用于 UI 渲染） */
export interface PipelineStatus {
  round: number;
  stages: Record<PipelineNodeId, PipelineStageResult>;
  startTime: number;
  endTime?: number;
}

/** 管线执行配置 */
export interface PipelineConfig {
  /** 执行顺序：二维数组，同层并行，层间串行 */
  executionOrder: PipelineNodeId[][];
  /** 状态提取是否启用 */
  stateExtractEnabled: boolean;
  /** 状态提取延迟（毫秒） */
  stateExtractDelayMs: number;
  /** 状态提取最大重试次数 */
  stateExtractMaxRetries: number;
  /** 后室系统任务是否启用（层级切换/实体遭遇/规则检验/笔记更新） */
  backroomsEnabled: boolean;
}

/**
 * 默认执行顺序（DAG 结构）
 * 1. narrative — 叙事生成（主任务，依赖 AI 调用）
 * 2. level_switch + entity_encounter + rule_check — 后室任务（并行，都只依赖叙事结果）
 * 3. notebook_update — 笔记更新（依赖规则检验结果）
 * 4. state_extract — 探索状态提取（最后执行，汇总所有变更）
 */
export const DEFAULT_EXECUTION_ORDER: PipelineNodeId[][] = [
  ['narrative'],
  ['level_switch', 'entity_encounter', 'rule_check'],  // 并行执行
  ['notebook_update'],
  ['state_extract'],
];

/** 阶段标签（中文） */
export const STAGE_LABELS: Record<PipelineNodeId, string> = {
  narrative: '叙事生成',
  level_switch: '层级切换',
  entity_encounter: '实体遭遇',
  rule_check: '规则检验',
  notebook_update: '笔记更新',
  state_extract: '状态提取',
};

/** 创建默认管线状态 */
export function createPipelineStatus(round: number): PipelineStatus {
  return {
    round,
    stages: {
      narrative: { status: 'pending', label: STAGE_LABELS.narrative },
      level_switch: { status: 'pending', label: STAGE_LABELS.level_switch },
      entity_encounter: { status: 'pending', label: STAGE_LABELS.entity_encounter },
      rule_check: { status: 'pending', label: STAGE_LABELS.rule_check },
      notebook_update: { status: 'pending', label: STAGE_LABELS.notebook_update },
      state_extract: { status: 'pending', label: STAGE_LABELS.state_extract },
    },
    startTime: Date.now(),
  };
}

/** 从 localStorage 读取管线配置 */
export function loadPipelineConfig(): PipelineConfig {
  let stateExtractEnabled = true;
  let stateExtractDelayMs = 1000;
  let stateExtractMaxRetries = 3;
  let backroomsEnabled = true;

  try {
    stateExtractEnabled = localStorage.getItem(STORAGE_KEYS.VARIABLE_ENABLED) !== 'false';
  } catch {
    console.warn('[PipelineConfig] 读取 state_extract_enabled 失败');
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIPELINE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.stateExtractDelayMs === 'number') {
        stateExtractDelayMs = Math.max(0, Math.min(10000, parsed.stateExtractDelayMs));
      }
      if (typeof parsed.stateExtractMaxRetries === 'number') {
        stateExtractMaxRetries = Math.max(0, Math.min(5, parsed.stateExtractMaxRetries));
      }
      if (typeof parsed.backroomsEnabled === 'boolean') {
        backroomsEnabled = parsed.backroomsEnabled;
      }
    }
  } catch {
    console.warn('[PipelineConfig] 读取 pipeline_config 失败');
  }

  return {
    executionOrder: DEFAULT_EXECUTION_ORDER,
    stateExtractEnabled,
    stateExtractDelayMs,
    stateExtractMaxRetries,
    backroomsEnabled,
  };
}
