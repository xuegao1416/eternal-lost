// ============================================================
//  游戏引擎 — 后室世界专用
//  串联 API 调用 → 动作解析 → 变量提取 → 状态更新 → 事件发射
//  比主项目精简，聚焦后室探索的核心循环
// ============================================================

import { useCallback, useRef, useState } from 'react';
import type { ApiConfig, Message } from '../api/types';
import { requestStreamWithRetry } from '../api/client';
import { extractContentForPrompt, type ParsedResponse } from './responseExtractor';
import { sanitizeForContext } from './contextManager';
import { parseGameActions, executeGameActions } from './gameActionParser';
import { runVariableExtraction } from './variableExtraction';
import { variableManager } from './variableManager';
import { eventBus, EVENTS } from './eventBus';
import { assembleSystemPrompt, switchLevelWorldBook } from './promptAssembler';
import { useGameStore, type ChatMessage } from '../stores/gameStore';
import { STORAGE_KEYS } from '../config/storageKeys';
import type { ExplorationState } from '../data/level-schema';

// ────────────────────────────────────────
//  类型定义
// ────────────────────────────────────────

export interface GameEngine {
  /** 发送消息并处理完整流程 */
  sendMessage: (text: string) => Promise<void>;
  /** 中止当前生成 */
  abort: () => void;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 最近的错误信息 */
  error: string | null;
  /** 清除错误 */
  clearError: () => void;
  /** 管线状态（用于 UI 展示） */
  pipelineStatus: string;
}

// ────────────────────────────────────────
//  工具函数
// ────────────────────────────────────────

/** 从 localStorage 读取 API 配置 */
function loadApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (!raw) return null;
    return JSON.parse(raw) as ApiConfig;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────
//  useGameEngine Hook
// ────────────────────────────────────────

export function useGameEngine(): GameEngine {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── 中止 ───────────────────────────

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setPipelineStatus('idle');
    eventBus.emit(EVENTS.GENERATION_STOPPED);
  }, []);

  // ─── 清除错误 ───────────────────────

  const clearError = useCallback(() => setError(null), []);

  // ─── 主流程 ─────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    const store = useGameStore.getState();
    const trimmed = text.trim();
    if (!trimmed || store.isLoading) return;

    // 加载 API 配置
    const apiConfig = loadApiConfig();
    if (!apiConfig) {
      setError('请先在设置中配置 API');
      return;
    }

    // 创建 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 初始化状态
    setIsGenerating(true);
    setError(null);
    store.setLoading(true);
    eventBus.emit(EVENTS.GENERATION_STARTED);

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      round: store.round,
    };
    store.addMessage(userMessage);
    eventBus.emit(EVENTS.MESSAGE_SENT, { content: trimmed });

    // 创建占位 assistant 消息（用于流式填充）
    const assistantMsgId = crypto.randomUUID();
    store.addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      round: store.round,
    });

    try {
      // ── 阶段 1: 组装上下文 ──
      setPipelineStatus('组装上下文...');

      const exploration = store.exploration;
      const currentLevel = store.currentLevel;

      // 切换世界书到当前层级
      if (currentLevel) {
        switchLevelWorldBook(currentLevel.id);
      }

      // 组装 system prompt
      const systemPrompt = assembleSystemPrompt(
        currentLevel,
        exploration,
        undefined, // 使用默认预设
        store.messages.map(m => ({ role: m.role, content: m.content })),
        trimmed,
      );

      // 清理历史消息用于 API 上下文
      const contextMessages = sanitizeForContext(store.messages, store.round);
      const apiMessages: Message[] = [
        { role: 'system', content: systemPrompt },
        ...contextMessages,
        { role: 'user', content: trimmed },
      ];

      // ── 阶段 2: 调用 AI API ──
      setPipelineStatus('生成中...');

      let fullText = '';
      const result = await requestStreamWithRetry(apiConfig, apiMessages, {
        signal: controller.signal,
        onDelta: (delta, accumulated) => {
          fullText = accumulated;
          // 流式更新 assistant 消息
          store.updateMessage(assistantMsgId, accumulated);
        },
      });

      fullText = result.text || fullText;

      if (!fullText) {
        throw new Error('AI 返回了空响应');
      }

      // ── 阶段 3: 解析游戏动作 ──
      setPipelineStatus('解析动作...');

      const parseResult = parseGameActions(fullText);

      // 用清理后的文本更新 assistant 消息（移除标记）
      if (parseResult.cleanText !== fullText) {
        store.updateMessage(assistantMsgId, parseResult.cleanText);
      }

      // 执行游戏动作（层级切换、物品发现等）
      if (parseResult.actions.length > 0) {
        const feedback = executeGameActions(parseResult.actions);
        if (feedback.length > 0) {
          console.log('[GameEngine] 执行的动作:', feedback);
        }
      }

      // ── 阶段 4: 响应提取 ──
      setPipelineStatus('提取响应...');

      const parsed: ParsedResponse = {
        content: extractContentForPrompt(fullText),
        thinking: '',
        summary: null,
      };

      // ── 阶段 5: 变量提取（异步，不阻塞 UI）──
      const varExtractEnabled = localStorage.getItem(STORAGE_KEYS.VARIABLE_ENABLED) !== 'false';
      if (varExtractEnabled && parsed.content) {
        setPipelineStatus('提取变量...');

        // 读取管线配置
        let delayMs = 1000;
        let maxRetries = 3;
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.PIPELINE_CONFIG);
          if (raw) {
            const cfg = JSON.parse(raw);
            if (typeof cfg.stateExtractDelayMs === 'number') delayMs = cfg.stateExtractDelayMs;
            if (typeof cfg.stateExtractMaxRetries === 'number') maxRetries = cfg.stateExtractMaxRetries;
          }
        } catch { /* use defaults */ }

        const currentExploration = useGameStore.getState().exploration;

        // 在后台运行变量提取，不阻塞用户交互
        runVariableExtraction({
          varMgr: variableManager,
          parsed,
          round: store.round,
          userText: trimmed,
          mainApiConfig: apiConfig,
          exploration: currentExploration,
          delayMs,
          maxRetries,
          signal: controller.signal,
          onUpdate: (newState: ExplorationState) => {
            // 变量提取完成后，更新探索状态
            useGameStore.setState({ exploration: newState });

            // 检测层级切换并发射事件
            if (newState.currentLevelId !== currentExploration.currentLevelId) {
              const oldLevel = store.currentLevel;
              switchLevelWorldBook(newState.currentLevelId);
              eventBus.emit(EVENTS.LEVEL_CHANGE, {
                from: oldLevel,
                to: { id: newState.currentLevelId },
              });
            }

            // 检测情绪变化
            if (newState.currentMood !== currentExploration.currentMood) {
              eventBus.emit(EVENTS.MOOD_CHANGE, {
                from: currentExploration.currentMood,
                to: newState.currentMood,
              });
            }

            // 检测死亡
            if (newState.deathCount > currentExploration.deathCount) {
              eventBus.emit(EVENTS.PLAYER_DEATH, {
                cause: 'unknown',
                levelId: currentExploration.currentLevelId,
              });
            }
          },
        }).catch(err => {
          console.warn('[GameEngine] 变量提取失败（不影响主流程）:', err);
        });
      }

      // ── 阶段 6: 完成 ──
      setPipelineStatus('完成');

      // 轮次 +1
      store.incrementRound();

      // 快照当前状态到消息（用于回滚）
      const snapshot = variableManager.takeSnapshot(
        useGameStore.getState().exploration,
        store.round,
      );
      // 将快照附加到 assistant 消息
      useGameStore.setState(state => ({
        messages: state.messages.map(m =>
          m.id === assistantMsgId
            ? { ...m, snapshot: snapshot.state }
            : m,
        ),
      }));

      // 发射消息接收事件
      eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
        message: {
          id: assistantMsgId,
          role: 'assistant',
          content: parseResult.cleanText,
          timestamp: Date.now(),
          round: store.round,
        },
      });

      // 发射自动存档事件
      eventBus.emit(EVENTS.AUTO_SAVE);

    } catch (err: unknown) {
      if (controller.signal.aborted) {
        // 用户主动中止，不视为错误
        console.log('[GameEngine] 用户中止生成');
        return;
      }

      const errMsg = err instanceof Error ? err.message : '未知错误';
      console.error('[GameEngine] 生成失败:', errMsg);
      setError(errMsg);

      // 移除空的 assistant 消息
      const currentState = useGameStore.getState();
      const assistantMsg = currentState.messages.find(m => m.id === assistantMsgId);
      if (assistantMsg && !assistantMsg.content) {
        store.deleteMessage(assistantMsgId);
      }
    } finally {
      setIsGenerating(false);
      store.setLoading(false);
      setPipelineStatus('idle');
      abortControllerRef.current = null;
      eventBus.emit(EVENTS.GENERATION_ENDED);
    }
  }, []);

  return {
    sendMessage,
    abort,
    isGenerating,
    error,
    clearError,
    pipelineStatus,
  };
}
