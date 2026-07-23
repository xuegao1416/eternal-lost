import { useRef, useState, useCallback, useEffect, memo } from 'react';
import type { ChatMessage } from '../../../stores/gameStore';
import { useRenderedContent, useDisplayScripts } from './messageBubble/renderPipeline';
import { useInlinePortals } from './messageBubble/InlinePortals';
import BubbleContent from './messageBubble/BubbleContent';
import EditMode from './messageBubble/EditMode';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { Pencil, Copy, RefreshCw, ArrowLeftToLine, Trash2 } from 'lucide-react';
import { processRegexScripts } from '../../../utils/regexScripts';

interface Props {
  message: ChatMessage;
  isStreaming: boolean;
  onOptionClick?: (optionText: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  onResend?: (id: string) => void;
  onResendFromHere?: (id: string) => void;
}

const ROLE_CLASS_MAP: Record<string, string> = {
  assistant: 'msg-bubble--narrative',
  user: 'msg-bubble--player',
  system: 'msg-bubble--system',
};

/**
 * 消息气泡组件 — 编排渲染管线 + 内联 Portal 水合 + 右键菜单。
 */
export default memo(function MessageBubble({ message, isStreaming, onOptionClick, onDelete, onEdit, onResend, onResendFromHere }: Props) {
  const isUser = message.role === 'user';
  const isThisStreaming = isUser ? false : isStreaming;

  // 渲染管线
  const { renderedContent, iframeRef } = useRenderedContent(message, isUser, isThisStreaming);
  const displayScripts = useDisplayScripts();

  // 内联 Portal
  const messageHtmlRef = useRef<HTMLDivElement>(null);
  useInlinePortals(messageHtmlRef, renderedContent, isUser, message, isThisStreaming);

  // 右键菜单
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const editingRef = useRef(false);
  editingRef.current = editing;
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      if (editingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, []);

  const handleEdit = useCallback(() => {
    setEditText(message.content || '');
    setEditing(true);
    setContextMenu(null);
  }, [message.content]);

  const handleEditConfirm = useCallback(() => {
    if (editText.trim() !== message.content) {
      onEdit?.(message.id, editText.trim());
    }
    setEditing(false);
  }, [editText, message.id, message.content, onEdit]);

  const handleEditCancel = useCallback(() => setEditing(false), []);

  const handleCopy = useCallback(() => {
    const raw = message.content || '';
    const text = isUser ? raw : processRegexScripts(raw, displayScripts);
    navigator.clipboard.writeText(text).catch(() => {});
  }, [message.content, isUser, displayScripts]);

  const bubbleClass = ROLE_CLASS_MAP[message.role] || 'msg-bubble--narrative';

  const menuItems: ContextMenuItem[] = [
    {
      label: '编辑消息',
      icon: <Pencil size={14} />,
      action: handleEdit,
    },
    {
      label: '复制内容',
      icon: <Copy size={14} />,
      action: handleCopy,
    },
    ...(isUser ? [{
      label: '重新发送',
      icon: <RefreshCw size={14} />,
      action: () => onResend?.(message.id),
    }] : []),
    ...(!isUser && !isThisStreaming ? [{
      label: '从此处重新开始',
      icon: <ArrowLeftToLine size={14} />,
      action: () => onResendFromHere?.(message.id),
    }] : []),
    ...(onDelete ? [{
      label: '删除消息',
      icon: <Trash2 size={14} />,
      action: () => onDelete(message.id),
      danger: true,
    }] : []),
  ];

  return (
    <div ref={bubbleRef} className={bubbleClass}>
      {editing ? (
        <EditMode
          editText={editText}
          setEditText={setEditText}
          onConfirm={handleEditConfirm}
          onCancel={handleEditCancel}
        />
      ) : (
        <BubbleContent
          message={message}
          isUser={isUser}
          renderedContent={renderedContent}
          iframeRef={iframeRef}
          messageHtmlRef={messageHtmlRef}
          onOptionClick={onOptionClick}
          isStreaming={isThisStreaming}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});
