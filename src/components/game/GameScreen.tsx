// ============================================================
//  游戏主屏幕 — 后室探索界面
// ============================================================
import { useGame } from '../../context/GameContext';
import ChatPanel from './ChatPanel';
import LevelInfo from './LevelInfo';
import Notebook from './Notebook';
import { BookOpen, Map, Settings, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

type RightPanel = 'notebook' | 'level' | null;

export default function GameScreen() {
  const { state, actions } = useGame();
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);

  const togglePanel = (panel: RightPanel) => {
    setRightPanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="game-screen">
      {/* 左侧导航栏 */}
      <div className="game-screen__sidebar">
        <button
          className="btn-ghost btn-icon"
          onClick={actions.resetGame}
          title="返回主菜单"
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }} />
        <button
          className={`btn-ghost btn-icon ${rightPanel === 'level' ? 'active' : ''}`}
          onClick={() => togglePanel('level')}
          title="层级信息"
        >
          <Map size={18} />
        </button>
        <button
          className={`btn-ghost btn-icon ${rightPanel === 'notebook' ? 'active' : ''}`}
          onClick={() => togglePanel('notebook')}
          title="笔记本"
        >
          <BookOpen size={18} />
        </button>
        <button
          className="btn-ghost btn-icon"
          onClick={() => actions.setScreen('settings')}
          title="设置"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* 主内容区 */}
      <div className="game-screen__main">
        <LevelInfo />
        <ChatPanel />
      </div>

      {/* 右侧面板 */}
      {rightPanel && (
        <div className="game-screen__right-panel">
          {rightPanel === 'notebook' && <Notebook />}
          {rightPanel === 'level' && (
            <div className="panel-section">
              <div className="panel-section__title">层级信息</div>
              {state.currentLevel ? (
                <>
                  <h3 style={{ color: 'var(--accent)', marginBottom: 8 }}>
                    {state.currentLevel.name}
                  </h3>
                  {state.currentLevel.subtitle && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 8 }}>
                      {state.currentLevel.subtitle}
                    </p>
                  )}
                  <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {state.currentLevel.description}
                  </p>
                  {state.currentLevel.entities.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="panel-section__title">已知实体</div>
                      {state.currentLevel.entities.map(e => (
                        <div key={e.id} className="notebook-entry">
                          <strong>{e.name}</strong> — {e.description}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>未知位置</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
