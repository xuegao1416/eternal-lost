// ============================================================
//  可折叠面板 — SCP 档案折叠风格
// ============================================================
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleProps {
  icon?: React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ icon, title, count, children, defaultOpen = true }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: '1px solid var(--border)',
      background: 'var(--paper-light)',
      marginBottom: 'var(--space-2)',
    }}>
      {/* 折叠头 — 类似档案文件夹标签 */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          cursor: 'pointer',
          userSelect: 'none',
          background: open ? 'var(--paper-warm)' : 'transparent',
          borderBottom: open ? '1px solid var(--border-light)' : 'none',
          fontFamily: 'var(--font-mono)',
          transition: 'background var(--motion-fast) var(--ease-standard)',
        }}
      >
        {/* 图标 */}
        {icon && (
          <span style={{
            color: 'var(--ink-faded)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </span>
        )}

        {/* 标题 */}
        <span style={{
          flex: 1,
          fontSize: 'var(--text-base)',
          color: 'var(--ink)',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}>
          {title}
        </span>

        {/* 计数 */}
        {count != null && (
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            background: 'var(--paper)',
            border: '1px solid var(--border-light)',
          }}>
            {count}
          </span>
        )}

        {/* 展开箭头 */}
        <ChevronRight
          size={14}
          style={{
            color: 'var(--ink-muted)',
            transition: 'transform var(--motion-fast) var(--ease-standard)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* 折叠内容 — 档案内页 */}
      {open && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          animation: 'fadeIn var(--motion-fast) var(--ease-standard)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
