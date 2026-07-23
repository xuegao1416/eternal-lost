import { useEffect, useRef, useCallback } from 'react';

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const adjustPosition = useCallback(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const el = menuRef.current;

    if (x + rect.width > vw - 8) {
      el.style.left = `${vw - rect.width - 8}px`;
    }
    if (y + rect.height > vh - 8) {
      el.style.top = `${vh - rect.height - 8}px`;
    }
  }, [x, y]);

  useEffect(() => {
    adjustPosition();
  }, [adjustPosition]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      role="menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
      }}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={`context-menu__item ${item.danger ? 'context-menu__item--danger' : ''} ${item.disabled ? 'context-menu__item--disabled' : ''}`}
          role="menuitem"
          tabIndex={item.disabled ? -1 : 0}
          aria-disabled={item.disabled}
          onClick={() => {
            if (item.disabled) return;
            item.action();
            onClose();
          }}
        >
          <span className="context-menu__icon">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
