// ============================================================
//  移动端覆盖层 — 阈限空间风格
// ============================================================
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  side: 'left' | 'right';
  width?: number;
  children: React.ReactNode;
}

export default function MobileOverlay({
  open,
  onClose,
  title,
  side,
  width = 280,
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC 键关闭
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 阻止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
        background: 'rgba(26, 22, 18, 0.7)',
        animation: 'fadeIn var(--motion-fast) var(--ease-standard)',
      }}
    >
      {/* 静态噪点效果 — 旧监控质感 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
        animation: 'staticNoise 0.5s steps(5) infinite',
        pointerEvents: 'none',
        opacity: 0.3,
      }} />

      {/* 侧面板 — 档案柜风格 */}
      <div
        ref={panelRef}
        style={{
          width: `${width}px`,
          maxWidth: '80vw',
          background: 'var(--liminal-bg)',
          borderLeft: side === 'right' ? '1px solid var(--liminal-border)' : 'none',
          borderRight: side === 'left' ? '1px solid var(--liminal-border)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          animation: `slideIn var(--motion-base) var(--ease-standard)`,
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 — 档案标签风格 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--liminal-border)',
          background: 'var(--liminal-surface)',
          minHeight: 'var(--mobile-header-height)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-base)',
            color: 'var(--liminal-ink)',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            {title}
          </h2>

          {/* 关闭按钮 — 印章风格 */}
          <button
            onClick={onClose}
            aria-label="关闭"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--liminal-border)',
              color: 'var(--liminal-ink-faded)',
              cursor: 'pointer',
              transition: 'all var(--motion-fast) var(--ease-standard)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--stamp-red)';
              e.currentTarget.style.borderColor = 'var(--stamp-red)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--liminal-ink-faded)';
              e.currentTarget.style.borderColor = 'var(--liminal-border)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容区 — 阈限空间 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-4)',
          background: 'var(--liminal-bg)',
          position: 'relative',
        }}>
          {/* 荧光灯闪烁效果 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '1px',
            height: '100%',
            background: 'linear-gradient(180deg, rgba(200, 160, 48, 0.05) 0%, transparent 50%, rgba(200, 160, 48, 0.03) 100%)',
            pointerEvents: 'none',
            animation: 'flicker 4s infinite',
          }} />

          {children}
        </div>

        {/* 底部装饰 — 档案编号 */}
        <div style={{
          padding: 'var(--space-2) var(--space-4)',
          borderTop: '1px solid var(--liminal-border)',
          background: 'var(--liminal-surface)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--liminal-ink-faded)',
          textAlign: 'right',
          opacity: 0.5,
        }}>
          [ MOBILE OVERLAY ]
        </div>
      </div>
    </div>
  );
}
