// ============================================================
//  工具按钮 — 印章/图章风格
// ============================================================

interface ToolBtnProps {
  onClick: (e?: any) => void;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * 通用工具按钮 — 印章/图章风格
 * 用于变量快照、变量设置等面板
 */
export default function ToolBtn({ onClick, title, disabled, children }: ToolBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: '36px',
        height: '36px',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: '1px solid var(--border)',
        color: 'var(--ink-faded)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all var(--motion-fast) var(--ease-standard)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.color = 'var(--stamp-red)';
          e.currentTarget.style.borderColor = 'var(--stamp-red-light)';
          e.currentTarget.style.background = 'var(--stamp-red-bg)';
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.color = 'var(--ink-faded)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {children}
      {/* 印章边框装饰 — 四角 */}
      <div style={{
        position: 'absolute',
        top: '-1px',
        left: '-1px',
        width: '4px',
        height: '4px',
        borderTop: '1px solid var(--ink-muted)',
        borderLeft: '1px solid var(--ink-muted)',
        opacity: 0.3,
      }} />
      <div style={{
        position: 'absolute',
        top: '-1px',
        right: '-1px',
        width: '4px',
        height: '4px',
        borderTop: '1px solid var(--ink-muted)',
        borderRight: '1px solid var(--ink-muted)',
        opacity: 0.3,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-1px',
        left: '-1px',
        width: '4px',
        height: '4px',
        borderBottom: '1px solid var(--ink-muted)',
        borderLeft: '1px solid var(--ink-muted)',
        opacity: 0.3,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-1px',
        right: '-1px',
        width: '4px',
        height: '4px',
        borderBottom: '1px solid var(--ink-muted)',
        borderRight: '1px solid var(--ink-muted)',
        opacity: 0.3,
      }} />
    </button>
  );
}
