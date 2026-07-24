// ============================================================
//  OmniRoom — 管线执行器
//  按 DAG executionOrder 顺序/并行执行各节点
//  适配后室项目：ExplorationState + VariableManager
// ============================================================

import type {
  PipelineConfig,
  PipelineNodeId,
  PipelineStageResult,
  PipelineStatus,
} from './pipelineTypes';
import { createPipelineStatus, STAGE_LABELS } from './pipelineTypes';
import type { VariableManager } from './variableManager';

// ────────────────────────────────────────
//  回调与结果类型
// ────────────────────────────────────────

/** 管线执行回调 */
export interface PipelineCallbacks {
  onUpdate: () => void;
}

/** 管线执行结果 */
export interface PipelineResult {
  /** 叙事生成结果 */
  narrativeResult: {
    text: string;
    cleanText: string;
  } | null;
  status: PipelineStatus;
}

// ────────────────────────────────────────
//  后室系统任务接口（由外部注入）
// ────────────────────────────────────────

/** 后室系统任务集合 */
export interface BackroomsTasks {
  /** 层级切换处理 */
  levelSwitch?: () => Promise<void>;
  /** 实体遭遇处理 */
  entityEncounter?: () => Promise<void>;
  /** 规则检验 */
  ruleCheck?: () => Promise<void>;
  /** 笔记本更新 */
  notebookUpdate?: () => Promise<void>;
  /** 调试日志记录器 */
  debugLogger?: (kind: string, message: string) => void;
}

/** 可重试的阶段（需要调用 API 的阶段） */
export const RETRYABLE_STAGES = new Set<PipelineNodeId>([
  'narrative', 'state_extract',
]);

// ────────────────────────────────────────
//  PipelineExecutor 类
// ────────────────────────────────────────

export class PipelineExecutor {
  private status: PipelineStatus;
  private onUpdate: () => void;

  constructor(round: number, callbacks: PipelineCallbacks) {
    this.status = createPipelineStatus(round);
    this.onUpdate = callbacks.onUpdate;
  }

  getStatus(): PipelineStatus {
    return this.status;
  }

  private updateStage(nodeId: PipelineNodeId, updates: Partial<PipelineStageResult>) {
    this.status.stages[nodeId] = { ...this.status.stages[nodeId], ...updates };
    this.onUpdate();
  }

  /**
   * 执行管线主流程
   * 遵循 executionOrder：同层并行，层间串行
   * 支持 AbortSignal 中断
   */
  async execute(params: {
    config: PipelineConfig;
    /** 叙事生成主任务（调用 AI） */
    narrativeTask: () => Promise<{ text: string; cleanText: string }>;
    /** 变量管理器（用于状态提取） */
    varMgr: VariableManager;
    /** 用户输入文本 */
    userText: string;
    /** AbortSignal 用于中断 */
    signal: AbortSignal;
    /** 后室系统任务集（可选，由外部注入） */
    backroomsTasks?: BackroomsTasks;
  }): Promise<PipelineResult> {
    const { config, narrativeTask, varMgr, userText, signal, backroomsTasks } = params;
    let narrativeResult: { text: string; cleanText: string } | null = null;

    for (const step of config.executionOrder) {
      if (signal.aborted) {
        this.skipRemaining();
        break;
      }

      const hasNarrative = step.includes('narrative');
      const otherNodes = step.filter(t => t !== 'narrative');

      if (hasNarrative) {
        // 执行叙事生成（主任务）
        narrativeResult = await this.executeNarrative(narrativeTask);

        // 如果同层还有其他节点，等待限流后并行执行
        if (otherNodes.length > 0 && !signal.aborted) {
          await this.delay(200); // 简短延迟，避免 API 过载
          await Promise.all(
            otherNodes.map(nodeId =>
              this.executeNode(nodeId, config, narrativeResult, varMgr, userText, signal, backroomsTasks),
            ),
          );
        }
      } else {
        // 整层并行执行
        await Promise.all(
          step.map(nodeId =>
            this.executeNode(nodeId, config, narrativeResult, varMgr, userText, signal, backroomsTasks),
          ),
        );
      }
    }

    this.status.endTime = Date.now();
    this.onUpdate();
    return { narrativeResult, status: this.status };
  }

  // ─── 叙事生成（主任务）──────────────────

  private async executeNarrative(
    narrativeTask: () => Promise<{ text: string; cleanText: string }>,
  ): Promise<{ text: string; cleanText: string }> {
    this.updateStage('narrative', { status: 'running', startTime: Date.now() });

    try {
      const result = await narrativeTask();
      this.updateStage('narrative', {
        status: 'success',
        endTime: Date.now(),
        dataLength: result.text.length,
        attempts: 1,
      });
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '叙事生成失败';
      this.updateStage('narrative', {
        status: 'error',
        endTime: Date.now(),
        error: errMsg,
      });
      throw err;
    }
  }

  // ─── 节点路由 ───────────────────────────

  private async executeNode(
    nodeId: PipelineNodeId,
    config: PipelineConfig,
    narrativeResult: { text: string; cleanText: string } | null,
    varMgr: VariableManager,
    userText: string,
    signal: AbortSignal,
    backroomsTasks?: BackroomsTasks,
  ): Promise<void> {
    switch (nodeId) {
      case 'level_switch':
        return this.executeBackroomsTask(
          'level_switch',
          config.backroomsEnabled,
          backroomsTasks?.levelSwitch,
          backroomsTasks?.debugLogger,
        );
      case 'entity_encounter':
        return this.executeBackroomsTask(
          'entity_encounter',
          config.backroomsEnabled,
          backroomsTasks?.entityEncounter,
          backroomsTasks?.debugLogger,
        );
      case 'rule_check':
        return this.executeBackroomsTask(
          'rule_check',
          config.backroomsEnabled,
          backroomsTasks?.ruleCheck,
          backroomsTasks?.debugLogger,
        );
      case 'notebook_update':
        return this.executeBackroomsTask(
          'notebook_update',
          config.backroomsEnabled,
          backroomsTasks?.notebookUpdate,
          backroomsTasks?.debugLogger,
        );
      case 'state_extract':
        return this.executeStateExtract(config, varMgr, narrativeResult, userText);
      default:
        this.updateStage(nodeId, { status: 'skipped', skipped: true });
    }
  }

  // ─── 后室系统子任务（通用）──────────────────

  private async executeBackroomsTask(
    nodeId: PipelineNodeId,
    enabled: boolean,
    task?: () => Promise<void>,
    debugLogger?: (kind: string, message: string) => void,
  ): Promise<void> {
    if (!enabled || !task) {
      this.updateStage(nodeId, { status: 'skipped', skipped: true });
      return;
    }

    this.updateStage(nodeId, { status: 'running', startTime: Date.now() });

    try {
      await task();
      this.updateStage(nodeId, {
        status: 'success',
        endTime: Date.now(),
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : `${STAGE_LABELS[nodeId]}失败`;
      const isDegraded = errMsg.startsWith('[降级]');
      this.updateStage(nodeId, {
        status: isDegraded ? 'warning' : 'error',
        endTime: Date.now(),
        error: errMsg,
      });
      // 写入调试日志（UI 可见）
      debugLogger?.(nodeId, errMsg);
      console.warn(`[管线] ${STAGE_LABELS[nodeId]}${isDegraded ? '降级' : '失败'}:`, errMsg);
    }
  }

  // ─── 状态提取 ───────────────────────────

  private async executeStateExtract(
    config: PipelineConfig,
    varMgr: VariableManager,
    narrativeResult: { text: string; cleanText: string } | null,
    userText: string,
  ): Promise<void> {
    if (!config.stateExtractEnabled || !narrativeResult) {
      this.updateStage('state_extract', { status: 'skipped', skipped: true });
      return;
    }

    const maxAttempts = config.stateExtractMaxRetries + 1;
    this.updateStage('state_extract', { status: 'running', startTime: Date.now(), maxAttempts });

    try {
      // 延迟执行，等待其他任务完成
      if (config.stateExtractDelayMs > 0) {
        await this.delay(config.stateExtractDelayMs);
      }

      // 状态提取逻辑：基于叙事结果中的动作标记更新 ExplorationState
      // 具体提取逻辑由 gameActionParser 处理，这里只负责调度
      // varMgr 用于快照和差异计算
      void varMgr; // 保留引用，实际提取在外部完成

      this.updateStage('state_extract', {
        status: 'success',
        endTime: Date.now(),
        attempts: 1,
        extra: {
          narrativeLength: narrativeResult.text.length,
          cleanLength: narrativeResult.cleanText.length,
        },
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '状态提取失败';
      this.updateStage('state_extract', {
        status: 'error',
        endTime: Date.now(),
        error: errMsg,
        attempts: maxAttempts,
      });
      console.warn('[管线] 状态提取失败（不影响叙事和快照保存）:', errMsg);
      // 不重新抛出：状态提取失败不应阻断管线，快照仍需保存以保持轮次连续性
    }
  }

  // ─── 重试单个阶段 ───────────────────────

  /**
   * 重试单个阶段
   * 将该阶段重置为 running 状态，执行 taskFn，更新最终状态
   */
  async retryStage(nodeId: PipelineNodeId, taskFn: () => Promise<void>): Promise<void> {
    this.updateStage(nodeId, {
      status: 'running',
      startTime: Date.now(),
      endTime: undefined,
      error: undefined,
      skipped: false,
    });

    try {
      await taskFn();
      this.updateStage(nodeId, { status: 'success', endTime: Date.now() });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : `${STAGE_LABELS[nodeId]}失败`;
      const isDegraded = errMsg.startsWith('[降级]');
      this.updateStage(nodeId, {
        status: isDegraded ? 'warning' : 'error',
        endTime: Date.now(),
        error: errMsg,
      });
    }
  }

  // ─── 内部工具 ───────────────────────────

  /** 跳过所有剩余 pending 阶段 */
  private skipRemaining() {
    for (const [key, stage] of Object.entries(this.status.stages)) {
      if (stage.status === 'pending') {
        this.updateStage(key as PipelineNodeId, { status: 'skipped', skipped: true });
      }
    }
  }

  /** 简单延迟 */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
