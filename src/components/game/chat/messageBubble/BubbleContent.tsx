import type { ChatMessage } from '../../../../stores/gameStore';
import { createIframeSrcDoc } from '../../../../utils/markdown';
import type { RenderedContent } from './renderPipeline';

interface BubbleContentProps {
  message: ChatMessage;
  isUser: boolean;
  renderedContent: RenderedContent;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  messageHtmlRef: React.RefObject<HTMLDivElement | null>;
  onOptionClick?: (optionText: string) => void;
  isStreaming: boolean;
}

/**
 * 主内容渲染：用户消息 pre-wrap、iframe、或 HTML div + ref。
 */
export default function BubbleContent({
  message,
  isUser,
  renderedContent,
  iframeRef,
  messageHtmlRef,
  onOptionClick,
  isStreaming,
}: BubbleContentProps) {
  if (isUser) {
    return (
      <div className="bubble-content">
        {message.content || ''}
      </div>
    );
  }

  if (renderedContent?.type === 'iframe') {
    return (
      <iframe
        ref={iframeRef}
        className="message-renderer-iframe"
        srcDoc={createIframeSrcDoc(renderedContent.content)}
        sandbox="allow-scripts"
        loading="lazy"
      />
    );
  }

  return (
    <>
      {renderedContent?.content ? (
        <div
          ref={messageHtmlRef}
          className="message-html-content bubble-html-content"
          dangerouslySetInnerHTML={{ __html: renderedContent.content }}
          onClick={(e) => {
            const target = e.target as HTMLElement;

            // 代码块复制按钮（事件委托）
            const copyBtn = target.closest('[data-action="copy-code"]') as HTMLButtonElement | null;
            if (copyBtn) {
              e.preventDefault();
              e.stopPropagation();
              const wrapper = copyBtn.closest('.code-block-wrapper');
              const code = wrapper?.querySelector('code');
              if (code) {
                navigator.clipboard.writeText(code.textContent || '').then(() => {
                  copyBtn.textContent = '已复制!';
                  setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
                }).catch(() => {
                  copyBtn.textContent = '失败';
                  setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
                });
              }
              return;
            }

            // 行动选项点击
            const optionEl = target.closest('.action-option-card') as HTMLElement;
            if (optionEl && onOptionClick) {
              const optionText = optionEl.getAttribute('data-option-text');
              if (optionText) {
                onOptionClick(optionText);
              }
            }
          }}
        />
      ) : isStreaming && !message.content ? (
        <span className="text-muted">思考中...</span>
      ) : null}
      {isStreaming && (
        <span className="cursor-blink" />
      )}
    </>
  );
}
