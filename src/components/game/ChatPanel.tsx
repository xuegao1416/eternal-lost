// ============================================================
//  对话面板 — 后室叙事交互（useGameEngine 驱动）
// ============================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameEngine } from '../../engine/useGameEngine';
import { useSaveStore } from '../../stores/saveStore';
import MessageBubble from './chat/MessageBubble';
import { Send, Square } from 'lucide-react';

export default function ChatPanel() {
  const { state, actions } = useGame();
  const { sendMessage, abort, isGenerating, error, clearError } = useGameEngine();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevGeneratingRef = useRef(false);

  // ─── 自动滚动 ─────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // ─── 自动存档：生成完成且无错误时触发 ──
  useEffect(() => {
    const wasGenerating = prevGeneratingRef.current;
    prevGeneratingRef.current = isGenerating;

    if (wasGenerating && !isGenerating && !error) {
      const timer = setTimeout(() => {
        useSaveStore.getState().scheduleAutoSave();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, error]);

  // ─── 流式消息标识 ─────────────────────
  // useGameEngine 在 store 中直接更新 assistant 消息内容，
  // 所以只需找到最后一条 assistant 消息作为"正在流式输出"的目标
  const streamingMsgId = isGenerating
    ? [...state.messages].reverse().find(m => m.role === 'assistant')?.id ?? null
    : null;

  // ─── 交互回调 ─────────────────────────

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
    // 回滚探索状态到这条消息发送前的快照
    actions.rollbackToMessageSnapshot(id);
    // 删除这条及之后的所有消息
    actions.deleteMessagesFrom(id);
    setInput(msg.content);
    textareaRef.current?.focus();
    // 截断后立即保存（防丢失）
    useSaveStore.getState().scheduleAutoSave();
  }, [state.messages, actions]);

  const handleResendFromHere = useCallback((id: string) => {
    actions.restoreFromMessage(id);
    useSaveStore.getState().scheduleAutoSave();
  }, [actions]);

  // ─── 发送 ─────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isGenerating) return;

    // 清除上一次的错误
    if (error) clearError();

    setInput('');
    await sendMessage(text);
  }, [input, isGenerating, error, clearError, sendMessage]);

  const handleStop = useCallback(() => {
    abort();
  }, [abort]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── 渲染 ─────────────────────────────

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
          const isMsgStreaming = msg.id === streamingMsgId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isMsgStreaming}
              onOptionClick={handleOptionClick}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onResend={handleResend}
              onResendFromHere={handleResendFromHere}
            />
          );
        })}
        {isGenerating && !streamingMsgId && (
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
          {isGenerating ? (
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
              disabled={!input.trim()}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
