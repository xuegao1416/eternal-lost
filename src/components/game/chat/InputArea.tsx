// ============================================================
//  输入区 — 打字机/终端输入风格
// ============================================================
import { useState, useRef, useCallback, useEffect } from 'react';
import { useMediaQuery } from '../../../hooks/useIsMobile';
import { Send, StopCircle } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  onCancel: () => void;
  isGenerating: boolean;
  placeholder?: string;
  externalText?: string;
  onExternalTextChange?: () => void;
}

export default function InputArea({
  onSend,
  onCancel,
  isGenerating,
  placeholder = '输入你的行动...',
  externalText,
  onExternalTextChange,
}: Props) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  // 处理外部文本变化
  const lastExternalRef = useRef(externalText);
  useEffect(() => {
    if (externalText && externalText !== lastExternalRef.current) {
      lastExternalRef.current = externalText;
      setText(externalText);
      onExternalTextChange?.();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [externalText, onExternalTextChange]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  }, [text, isGenerating, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--paper)',
      position: 'relative',
    }}>
      {/* 打字机纹理装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'repeating-linear-gradient(90deg, var(--border) 0px, var(--border) 4px, transparent 4px, transparent 8px)',
        opacity: 0.5,
      }} />

      {/* 输入区 */}
      <div style={{
        padding: isMobile ? 'var(--space-3) var(--space-4)' : 'var(--space-4) var(--space-5)',
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'flex-end',
      }}>
        {/* 打字机输入框 */}
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          {/* 行号装饰 */}
          <div style={{
            position: 'absolute',
            left: '0',
            top: '0',
            bottom: '0',
            width: '24px',
            background: 'var(--paper-warm)',
            borderRight: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: 'var(--space-2) var(--space-1)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--ink-muted)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            {'>'}
          </div>

          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isGenerating}
            rows={isMobile ? 2 : 3}
            style={{
              width: '100%',
              resize: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-base)',
              lineHeight: 1.6,
              color: 'var(--ink)',
              background: 'var(--paper-light)',
              border: '1px solid var(--border)',
              borderBottom: '2px solid var(--border)',
              padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-8)',
              outline: 'none',
              minHeight: 'var(--touch-min)',
              transition: 'border-color var(--motion-fast) var(--ease-standard)',
              opacity: isGenerating ? 0.6 : 1,
            }}
            onFocus={e => {
              e.currentTarget.style.borderBottomColor = 'var(--ink)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderBottomColor = 'var(--border)';
            }}
          />

          {/* 打字机光标位置指示 */}
          {text.length > 0 && (
            <div style={{
              position: 'absolute',
              right: 'var(--space-2)',
              bottom: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--ink-muted)',
              pointerEvents: 'none',
            }}>
              {text.length}
            </div>
          )}
        </div>

        {/* 发送/停止按钮 — 印章风格 */}
        {isGenerating ? (
          <button
            onClick={onCancel}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'transparent',
              color: 'var(--stamp-red)',
              border: '1px solid var(--stamp-red)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              minWidth: 'var(--touch-min)',
              minHeight: 'var(--touch-min)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--stamp-red-bg)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <StopCircle size={16} />
            {'停止'}
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: text.trim() ? 'var(--ink)' : 'var(--ink-muted)',
              color: 'var(--paper-light)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              minWidth: 'var(--touch-min)',
              minHeight: 'var(--touch-min)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-1)',
              transition: 'all var(--motion-fast) var(--ease-standard)',
              opacity: text.trim() ? 1 : 0.6,
            }}
            onMouseEnter={e => {
              if (text.trim()) {
                e.currentTarget.style.background = '#3A3226';
              }
            }}
            onMouseLeave={e => {
              if (text.trim()) {
                e.currentTarget.style.background = 'var(--ink)';
              }
            }}
          >
            <Send size={16} />
            {'发送'}
          </button>
        )}
      </div>

      {/* 底部装饰 — 终端风格 */}
      <div style={{
        padding: '0 var(--space-5) var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--ink-muted)',
        display: 'flex',
        justifyContent: 'space-between',
        opacity: 0.5,
      }}>
        <span>Enter 发送 / Shift+Enter 换行</span>
        <span>{isGenerating ? '生成中...' : '就绪'}</span>
      </div>
    </div>
  );
}
