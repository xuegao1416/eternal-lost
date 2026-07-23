import { useRef, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ChatMessage } from '../../../../stores/gameStore';
import type { RenderedContent } from './renderPipeline';
import { useImageStore } from '../../../../stores/imageStore';

/** 延迟卸载 React root，避免在 React commit 阶段同步 unmount 导致竞态警告 */
function deferredUnmount(roots: Root[]) {
  queueMicrotask(() => {
    roots.forEach(root => {
      try { root.unmount(); } catch { /* ignore */ }
    });
  });
}

/**
 * 内联 Portal 挂载 Hook：生图按钮、对话头像卡片。
 */
export function useInlinePortals(
  messageHtmlRef: React.RefObject<HTMLDivElement | null>,
  renderedContent: RenderedContent,
  isUser: boolean,
  message: ChatMessage,
  isStreaming: boolean,
) {
  const imageGenRootsRef = useRef<Root[]>([]);
  const dialogueRootsRef = useRef<Root[]>([]);

  // ─── 生图按钮 Portal ────────────────────────
  const inlineImageEnabled = useImageStore((s) => s.config.inlineImageEnabled);

  useEffect(() => {
    deferredUnmount(imageGenRootsRef.current);
    imageGenRootsRef.current = [];

    if (!messageHtmlRef.current || isUser || !inlineImageEnabled || isStreaming) return;

    const placeholders = messageHtmlRef.current.querySelectorAll('.inline-image-gen-placeholder');
    if (placeholders.length === 0) return;

    const mountImageButtons = async () => {
      const { default: InlineImageGenButtonComponent } = await import('../InlineImageGenButton');

      placeholders.forEach(el => {
        const promptText = el.getAttribute('data-prompt') || '';
        if (!promptText.trim()) return;
        const container = document.createElement('div');
        el.replaceWith(container);
        const root = createRoot(container);
        root.render(<InlineImageGenButtonComponent prompt={promptText.trim()} msgId={message.id} />);
        imageGenRootsRef.current.push(root);
      });
    };

    mountImageButtons();

    return () => {
      deferredUnmount(imageGenRootsRef.current);
      imageGenRootsRef.current = [];
    };
  }, [renderedContent, inlineImageEnabled, isUser, isStreaming, message.id, messageHtmlRef]);

  // ─── 对话头像卡片 Portal ────────────────────────
  useEffect(() => {
    deferredUnmount(dialogueRootsRef.current);
    dialogueRootsRef.current = [];

    if (!messageHtmlRef.current || isUser || isStreaming) return;

    const placeholders = messageHtmlRef.current.querySelectorAll('.dialogue-avatar-placeholder');
    if (placeholders.length === 0) return;

    const mountDialogueCards = async () => {
      const { default: InlineDialogueCardComponent } = await import('../InlineDialogueCard');

      for (const el of Array.from(placeholders)) {
        const avatarUrl = el.getAttribute('data-avatar') || '';
        const name = el.getAttribute('data-name') || '';
        const title = el.getAttribute('data-title') || '';
        const text = el.getAttribute('data-text') || '';
        const action = el.getAttribute('data-action') || '';

        const container = document.createElement('div');
        el.replaceWith(container);
        const root = createRoot(container);
        root.render(
          <InlineDialogueCardComponent
            avatarUrl={avatarUrl}
            name={name}
            title={title}
            text={text}
            action={action}
          />,
        );
        dialogueRootsRef.current.push(root);
      }
    };

    mountDialogueCards();

    return () => {
      deferredUnmount(dialogueRootsRef.current);
      dialogueRootsRef.current = [];
    };
  }, [renderedContent, isUser, isStreaming, messageHtmlRef]);
}
