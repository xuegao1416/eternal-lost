// ============================================================
//  空状态 — SCP 档案空文件夹风格
// ============================================================
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  message: string;
  action?: { label: string; onClick: () => void };
}

/**
 * 统一空状态组件 — SCP 档案空文件夹风格
 * 显示为一个空的档案夹，带有褪色的文字和可选操作
 */
export default function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-12) var(--space-6)',
      textAlign: 'center',
      minHeight: '200px',
      position: 'relative',
    }}>
      {/* 档案夹背景装饰 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '2px dashed var(--border)',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* 图标 — 褪色的印章风格 */}
      {Icon && (
        <div style={{
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-4)',
          background: 'var(--paper-warm)',
          border: '1px solid var(--border)',
          position: 'relative',
        }}>
          <Icon
            size={32}
            strokeWidth={1.2}
            style={{
              color: 'var(--ink-muted)',
              opacity: 0.6,
            }}
          />
          {/* 旧化效果 — 角落折痕 */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '12px',
            height: '12px',
            background: 'linear-gradient(135deg, var(--paper) 50%, var(--border) 50%)',
          }} />
        </div>
      )}

      {/* 消息 — 打字机风格 */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-base)',
        color: 'var(--ink-faded)',
        lineHeight: 1.6,
        maxWidth: '280px',
        marginBottom: action ? 'var(--space-5)' : 0,
        fontStyle: 'italic',
      }}>
        {message}
      </p>

      {/* 操作按钮 — 档案标签风格 */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--ink)',
            background: 'var(--paper)',
            border: '1px solid var(--border)',
            padding: 'var(--space-2) var(--space-4)',
            cursor: 'pointer',
            transition: 'all var(--motion-fast) var(--ease-standard)',
            position: 'relative',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--ink-faded)';
            e.currentTarget.style.background = 'var(--paper-warm)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'var(--paper)';
          }}
        >
          {'> '}{action.label}
        </button>
      )}

      {/* 底部装饰 — 档案编号 */}
      <div style={{
        position: 'absolute',
        bottom: 'var(--space-3)',
        right: 'var(--space-4)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--ink-muted)',
        opacity: 0.4,
      }}>
        [ EMPTY ]
      </div>
    </div>
  );
}
