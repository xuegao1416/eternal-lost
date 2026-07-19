// ============================================================
//  对话面板 — 后室叙事交互（接入真实 AI API）
// ============================================================
import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useConfigStore } from '../../stores/configStore';
import { requestCompletionStream } from '../../api/client';
import { assembleSystemPrompt } from '../../engine/promptAssembler';
import type { Message } from '../../api/types';
import { Send, Square } from 'lucide-react';

export default function ChatPanel() {
  const { state, actions } = useGame();
  const apiConfig = useConfigStore(s => s.apiConfig);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, streaming]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || state.isLoading || isStreaming) return;

    if (!apiConfig?.apiKey) {
      actions.addMessage({ role: 'system', content: '请先在设置中配置 API Key。' });
      return;
    }

    actions.addMessage({ role: 'user', content: text });
    setInput('');
    actions.setLoading(true);
    setIsStreaming(true);
    setStreaming('');

    // 构建消息列表（世界书需要聊天历史进行关键词扫描）
    const chatHistory = state.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const systemPrompt = assembleSystemPrompt(
      state.currentLevel,
      state.exploration,
      undefined, // 使用默认预设
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

    try {
      let accumulated = '';
      const result = await requestCompletionStream(apiConfig, messages, {
        signal: controller.signal,
        onDelta: (delta) => {
          accumulated += delta;
          setStreaming(accumulated);
        },
      });

      if (result.text) {
        actions.addMessage({ role: 'assistant', content: result.text });
        actions.incrementSurvivalTime();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[ChatPanel] API error:', err);
        actions.addMessage({
          role: 'system',
          content: `请求失败：${err.message || '未知错误'}`,
        });
      }
    } finally {
      setStreaming('');
      setIsStreaming(false);
      actions.setLoading(false);
      abortRef.current = null;
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
        {state.messages.map(msg => (
          <div
            key={msg.id}
            className={`message-bubble message-bubble--${msg.role}`}
          >
            {msg.role === 'system' ? (
              <em style={{ color: 'var(--text-muted)' }}>{msg.content}</em>
            ) : (
              msg.content.split('\n').map((line, i) => (
                <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
              ))
            )}
          </div>
        ))}
        {streaming && (
          <div className="message-bubble message-bubble--assistant">
            {streaming.split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
            <span className="typewriter-cursor" />
          </div>
        )}
        {state.isLoading && !streaming && (
          <div className="message-bubble message-bubble--assistant">
            <span className="typewriter-cursor" />
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
              className="input-area__send"
              onClick={handleStop}
              style={{ background: 'var(--danger)' }}
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
