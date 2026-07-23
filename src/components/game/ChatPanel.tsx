// ============================================================
//  对话面板 — 后室叙事交互（接入真实 AI API）
// ============================================================
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../stores/gameStore';
import { useSaveStore } from '../../stores/saveStore';
import { useConfigStore } from '../../stores/configStore';
import { requestCompletionStream } from '../../api/client';
import { assembleSystemPrompt } from '../../engine/promptAssembler';
import { parseGameActions, executeGameActions } from '../../engine/gameActionParser';
import type { Message } from '../../api/types';
import MessageBubble from './chat/MessageBubble';
import { Send, Square } from 'lucide-react';

export default function ChatPanel() {
  const { state, actions } = useGame();
  const apiConfig = useConfigStore(s => s.apiConfig);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, streamingText]);

  // 渲染消息列表（包含流式消息）
  const displayMessages = useMemo(() => {
    if (streamingMsgId && streamingText) {
      // 流式消息已通过 addMessage 添加，直接用现有列表
      return state.messages;
    }
    return state.messages;
  }, [state.messages, streamingMsgId, streamingText]);

  const handleOptionClick = useCallback((optionText: string) => {
    setInput(optionText);
    textareaRef.current?.focus();
  }, []);

  const handleDelete = useCallback((id: string) => {
    actions.deleteMessage(id);
  }, [actions]);

  const handleEdit = useCallback((id: string, content: string) => {
    actions.updateMessage(id, content);
  }, [actions]);

  const handleResend = useCallback((id: string) => {
    const msg = state.messages.find(m => m.id === id);
    if (!msg) return;
    // 先回滚探索状态（物品/规则/层级/轮数）到这条消息发送前的快照
    actions.rollbackToMessageSnapshot(id);
    // 再删除这条及之后的所有消息
    actions.deleteMessagesFrom(id);
    setInput(msg.content);
    textareaRef.current?.focus();
    // 截断后立即保存（防丢失）
    useSaveStore.getState().scheduleAutoSave();
  }, [state.messages, actions]);

  const handleResendFromHere = useCallback((id: string) => {
    actions.restoreFromMessage(id);
    // 回滚后立即保存
    useSaveStore.getState().scheduleAutoSave();
  }, [actions]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || state.isLoading || isStreaming) return;

    if (!apiConfig?.apiKey) {
      actions.addMessage({ role: 'system', content: '请先在设置中配置 API Key。' });
      return;
    }

    // 发送前捕获当前状态快照与轮次（用于回滚恢复）
    const preSend = useGameStore.getState();
    const sendSnapshot = preSend.exploration;
    const sendRound = preSend.round;

    actions.addMessage({
      role: 'user',
      content: text,
      snapshot: sendSnapshot,
      round: sendRound,
    });
    setInput('');
    actions.setLoading(true);
    setIsStreaming(true);
    setStreamingText('');

    // 构建消息列表（世界书需要聊天历史进行关键词扫描）
    const chatHistory = state.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const systemPrompt = assembleSystemPrompt(
      state.currentLevel,
      state.exploration,
      undefined,
      chatHistory,
      text,
    );

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: text },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    // 预创建一条 assistant 消息用于流式更新（保存快照+轮次用于回滚）
    const tempId = `streaming-${Date.now()}`;
    const currentSnapshot = useGameStore.getState().exploration;
    const currentRound = useGameStore.getState().round;
    actions.addMessage({ id: tempId, role: 'assistant', content: '', snapshot: currentSnapshot, round: currentRound });
    setStreamingMsgId(tempId);

    try {
      let accumulated = '';
      const result = await requestCompletionStream(apiConfig, messages, {
        signal: controller.signal,
        onDelta: (delta) => {
          accumulated += delta;
          setStreamingText(accumulated);
        },
      });

      if (result.text) {
        // 解析游戏动作标记
        const { cleanText, actions: parsedActions } = parseGameActions(result.text);

        // 更新流式消息为清理后的内容
        actions.updateMessage(tempId, cleanText);

        // 执行游戏动作（层级切换、物品发现、规则发现等）
        if (parsedActions.length > 0) {
          const actionFeedback = executeGameActions(parsedActions);
          if (actionFeedback.length > 0) {
            console.log('[GameAction] 执行的游戏动作:', actionFeedback);
          }
        }

        actions.incrementSurvivalTime();
        actions.incrementRound();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[ChatPanel] API error:', err);
        actions.updateMessage(tempId, `请求失败：${err.message || '未知错误'}`);
      }
    } finally {
      setStreamingText('');
      setStreamingMsgId(null);
      setIsStreaming(false);
      actions.setLoading(false);
      abortRef.current = null;

      // 每轮对话后触发自动存档（debounce 500ms）
      useSaveStore.getState().scheduleAutoSave();
    }
  }, [input, state.isLoading, isStreaming, apiConfig, state.messages, state.currentLevel, state.exploration, actions]);

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__messages">
        {state.messages.map(msg => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="msg-bubble--system">
                <span className="msg-system-text">{msg.content}</span>
              </div>
            );
          }
          const isMsgStreaming = msg.id === streamingMsgId && isStreaming;
          return (
            <MessageBubble
              key={msg.id}
              message={isMsgStreaming ? { ...msg, content: streamingText || msg.content } : msg}
              isStreaming={isMsgStreaming}
              onOptionClick={handleOptionClick}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onResend={handleResend}
              onResendFromHere={handleResendFromHere}
            />
          );
        })}
        {state.isLoading && !streamingText && (
          <div className="msg-bubble--narrative" style={{ maxWidth: '85%', padding: 'var(--space-3)' }}>
            <span className="cursor-blink" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-panel__input-area">
        <div className="input-area">
          <textarea
            ref={textareaRef}
            className="input-area__textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的行动..."
            rows={1}
          />
          {isStreaming ? (
            <button
              className="input-area__send input-area__send--stop"
              onClick={handleStop}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="input-area__send"
              onClick={handleSend}
              disabled={!input.trim() || state.isLoading}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
