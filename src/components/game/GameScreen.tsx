// ============================================================
//  游戏主屏幕 — 后室探索界面
// ============================================================
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../stores/gameStore';
import { useSaveStore } from '../../stores/saveStore';
import ChatPanel from './ChatPanel';
import LevelInfo from './LevelInfo';
import Notebook from './Notebook';
import { BookOpen, Map, Backpack, Settings, ArrowLeft } from 'lucide-react';
import { useState, useCallback } from 'react';

type RightPanel = 'notebook' | 'level' | 'inventory' | null;

export default function GameScreen() {
  const { state, actions } = useGame();
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);

  const togglePanel = (panel: RightPanel) => {
    setRightPanel(prev => prev === panel ? null : panel);
  };

  const handleBackToMenu = useCallback(async () => {
    // 返回主菜单前保存当前进度
    await useSaveStore.getState().flushAutoSave(() => {
      const gs = useGameStore.getState();
      const ss = useSaveStore.getState();
      if (!ss.currentSaveId) return null;
      return {
        id: ss.currentSaveId,
        name: ss.currentSaveName || '返回主菜单',
        timestamp: Date.now(),
        messages: gs.messages,
        exploration: gs.exploration,
        currentLevelId: gs.exploration.currentLevelId,
        characterProfile: gs.exploration.characterProfile,
      };
    });
    actions.resetGame();
  }, [actions]);

  return (
    <div className="game-screen">
      {/* 左侧导航栏 */}
      <div className="game-screen__sidebar">
        <button
          className="game-sidebar__btn"
          onClick={handleBackToMenu}
          title="返回主菜单"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="game-sidebar__spacer" />
        <button
          className={`game-sidebar__btn ${rightPanel === 'level' ? 'game-sidebar__btn--active' : ''}`}
          onClick={() => togglePanel('level')}
          title="层级信息"
        >
          <Map size={18} />
        </button>
        <button
          className={`game-sidebar__btn ${rightPanel === 'inventory' ? 'game-sidebar__btn--active' : ''}`}
          onClick={() => togglePanel('inventory')}
          title="背包"
        >
          <Backpack size={18} />
        </button>
        <button
          className={`game-sidebar__btn ${rightPanel === 'notebook' ? 'game-sidebar__btn--active' : ''}`}
          onClick={() => togglePanel('notebook')}
          title="笔记本"
        >
          <BookOpen size={18} />
        </button>
        <button
          className="game-sidebar__btn"
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
          {rightPanel === 'inventory' && (
            <div className="panel">
              <div className="panel__section-title">背包</div>
              {state.exploration.inventory.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                  你还什么都没有。仔细探索，你会找到有用的东西。
                </p>
              ) : (
                state.exploration.inventory.map((item, idx) => (
                  <div key={item.id || idx} className="notebook-entry">
                    <div className="notebook-entry__item-name">{item.name} ×{item.quantity}</div>
                    <div className="notebook-entry__desc">{item.description}</div>
                    <div className="notebook-entry__label">
                      发现于: {item.foundAt === state.exploration.currentLevelId ? '当前位置' : item.foundAt}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {rightPanel === 'level' && (
            <div className="panel">
              <div className="panel__section-title">层级信息</div>
              {state.currentLevel ? (
                <>
                  <h3 className="text-body" style={{ marginBottom: 'var(--space-3)', fontWeight: 600 }}>
                    {state.currentLevel.name}
                  </h3>
                  {state.currentLevel.subtitle && (
                    <p className="text-faded" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                      {state.currentLevel.subtitle}
                    </p>
                  )}
                  <p className="text-faded" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                    {state.currentLevel.description}
                  </p>
                  {state.currentLevel.entities.length > 0 && (
                    <div style={{ marginTop: 'var(--space-4)' }}>
                      <div className="panel__section-title">已知实体</div>
                      {state.currentLevel.entities.map(e => (
                        <div key={e.id} className="notebook-entry">
                          <strong>{e.name}</strong> — {e.description}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted">未知位置</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
