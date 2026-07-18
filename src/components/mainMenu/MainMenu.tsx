// ============================================================
//  主菜单 — 后室风格（背景图版）
// ============================================================
import { useState } from 'react';
import { useGame } from '../../context/GameContext';

function MenuButton({ children, onClick, variant = 'ghost' }: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}) {
  const [hover, setHover] = useState(false);

  const base: React.CSSProperties = {
    padding: '14px 24px',
    borderRadius: 8,
    border: '2px solid rgba(240, 232, 200, 0.2)',
    cursor: 'pointer',
    fontSize: '1.05rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    transition: 'all 200ms ease',
    width: '100%',
    textAlign: 'center',
    transform: hover ? 'scale(1.04)' : 'scale(1)',
  };

  const primary: React.CSSProperties = {
    ...base,
    background: hover ? 'rgba(200, 160, 48, 0.35)' : 'rgba(200, 160, 48, 0.2)',
    color: '#f5edd0',
    borderColor: hover ? 'rgba(200, 160, 48, 0.7)' : 'rgba(200, 160, 48, 0.4)',
    boxShadow: hover ? '0 0 24px rgba(200, 160, 48, 0.25)' : 'none',
  };

  const ghost: React.CSSProperties = {
    ...base,
    background: hover ? 'rgba(240, 232, 200, 0.18)' : 'rgba(240, 232, 200, 0.08)',
    color: 'rgba(240, 232, 200, 0.9)',
    borderColor: hover ? 'rgba(240, 232, 200, 0.4)' : 'rgba(240, 232, 200, 0.22)',
  };

  return (
    <button
      style={variant === 'primary' ? primary : ghost}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function MainMenu() {
  const { actions } = useGame();

  return (
    <div className="main-menu" style={{
      backgroundImage: 'url(/room-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* 暗色遮罩 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
        zIndex: 0,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* 标题 — 荧光灯描边 + 闪烁 */}
        <h1 className="title-flicker" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.6rem',
          color: '#f5edd0',
          marginBottom: 6,
          letterSpacing: '0.12em',
          fontWeight: 700,
          WebkitTextStroke: '1px rgba(200, 160, 48, 0.5)',
        }}>
          永恒迷途录
        </h1>
        <p style={{
          fontSize: 'var(--font-size-base)',
          color: 'rgba(240, 232, 200, 0.45)',
          marginBottom: 56,
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
        }}>
          Eternal Lost
        </p>

        {/* 按钮组 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 200 }}>
          <MenuButton variant="primary" onClick={actions.startNewGame}>
            新游戏
          </MenuButton>
          <MenuButton onClick={actions.continueGame}>
            继续游戏
          </MenuButton>
          <MenuButton onClick={() => actions.setScreen('settings')}>
            设置
          </MenuButton>
        </div>

        <p style={{
          marginTop: 80,
          color: 'rgba(240, 232, 200, 0.2)', fontSize: 'var(--font-size-xs)',
        }}>
          v0.1.0
        </p>
      </div>
    </div>
  );
}
