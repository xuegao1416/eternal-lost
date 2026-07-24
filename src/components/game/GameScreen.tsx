// ============================================================
//  游戏主屏幕 — 后室探索界面（升级版）
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useGameStore } from '../../stores/gameStore';
import { useSaveStore } from '../../stores/saveStore';
import { useMediaQuery } from '../../hooks/useIsMobile';
import ChatPanel from './ChatPanel';
import LevelInfo from './LevelInfo';
import Notebook from './Notebook';
import MobileOverlay from './MobileOverlay';
import StateViewer from './StateViewer';
import {
  BookOpen, Map, Backpack, Settings, ArrowLeft,
  Maximize2, Minimize2, PanelRightClose, PanelRightOpen,
  FileSearch,
} from 'lucide-react';

type RightPanel = 'notebook' | 'level' | 'inventory' | 'state' | null;

export default function GameScreen() {
  const { state, actions } = useGame();
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const isMobile = useMediaQuery('(max-width: 900px)');

  // ── Fullscreen ──
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // 窄视口自动折叠右侧面板
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setRightCollapsed(true);
    };
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const togglePanel = (panel: RightPanel) => {
    setRightPanel(prev => prev === panel ? null : panel);
  };

  const handleBackToMenu = useCallback(async () => {
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

  // ── 面板内容渲染 ──
  const renderPanelContent = (panel: RightPanel) => {
    switch (panel) {
      case 'notebook': return <Notebook />;
      case 'inventory': return (
        <div className="panel">
          <div className="panel__section-title">背包</div>
          {state.exploration.inventory.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
              你还什么都没有。仔细探索，你会找到有用的东西。
            </p>
          ) : (
            state.exploration.inventory.map((item, idx) => (
              <div key={item.id || idx} className="notebook-entry">
                <div style={{ fontWeight: 600 }}>{item.name} ×{item.quantity}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faded)', marginTop: 'var(--space-1)' }}>
                  {item.description}
                </div>
                <div className="notebook-entry__label">
                  发现于: {item.foundAt === state.exploration.currentLevelId ? '当前位置' : item.foundAt}
                </div>
              </div>
            ))
          )}
        </div>
      );
      case 'state': return <StateViewer />;
      case 'level': return (
        <div className="panel">
          <div className="panel__section-title">层级信息</div>
          {state.currentLevel ? (
            <>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                marginBottom: 'var(--space-3)',
                fontWeight: 600,
                color: 'var(--ink)',
              }}>
                {state.currentLevel.name}
              </h3>
              {state.currentLevel.subtitle && (
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--ink-faded)',
                  marginBottom: 'var(--space-3)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {state.currentLevel.subtitle}
                </p>
              )}
              <p style={{
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
                color: 'var(--ink-faded)',
                fontFamily: 'var(--font-body)',
              }}>
                {state.currentLevel.description}
              </p>
              {state.currentLevel.entities.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div className="panel__section-title">已知实体</div>
                  {state.currentLevel.entities.map(e => (
                    <div key={e.id} className="notebook-entry">
                      <strong style={{ color: 'var(--stamp-red)' }}>{e.name}</strong>
                      <span style={{ color: 'var(--ink-faded)' }}> — {e.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
              [ 位置未知 ]
            </p>
          )}
        </div>
      );
      default: return null;
    }
  };

  const getPanelTitle = (panel: RightPanel): string => {
    switch (panel) {
      case 'notebook': return '笔记本';
      case 'inventory': return '背包';
      case 'level': return '层级信息';
      default: return '';
    }
  };

  // ── 移动端 ──
  if (isMobile) {
    return (
      <div className="game-screen" style={{ flexDirection: 'column' }}>
        {/* 移动端顶部栏 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--paper-warm)',
          borderBottom: '1px solid var(--border-light)',
          flexShrink: 0,
          minHeight: 'var(--mobile-header-height)',
        }}>
          <button className="game-sidebar__btn" onClick={handleBackToMenu} title="返回主菜单" style={{ width: '40px', height: '40px' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <LevelInfo compact />
          </div>
          <button
            className={`game-sidebar__btn ${rightPanel === 'level' ? 'game-sidebar__btn--active' : ''}`}
            onClick={() => togglePanel('level')}
            title="层级信息"
            style={{ width: '40px', height: '40px' }}
          >
            <Map size={18} />
          </button>
          <button
            className={`game-sidebar__btn ${rightPanel === 'inventory' ? 'game-sidebar__btn--active' : ''}`}
            onClick={() => togglePanel('inventory')}
            title="背包"
            style={{ width: '40px', height: '40px' }}
          >
            <Backpack size={18} />
          </button>
          <button
            className={`game-sidebar__btn ${rightPanel === 'notebook' ? 'game-sidebar__btn--active' : ''}`}
            onClick={() => togglePanel('notebook')}
            title="笔记本"
            style={{ width: '40px', height: '40px' }}
          >
            <BookOpen size={18} />
          </button>
          <button
            className={`game-sidebar__btn ${rightPanel === 'state' ? 'game-sidebar__btn--active' : ''}`}
            onClick={() => togglePanel('state')}
            title="状态档案"
            style={{ width: '40px', height: '40px' }}
          >
            <FileSearch size={18} />
          </button>
          <button
            className="game-sidebar__btn"
            onClick={() => actions.setScreen('settings')}
            title="设置"
            style={{ width: '40px', height: '40px' }}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* 主内容区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <ChatPanel />
        </div>

        {/* 移动端面板覆盖层 */}
        {rightPanel && (
          <MobileOverlay
            open={true}
            onClose={() => setRightPanel(null)}
            title={getPanelTitle(rightPanel)}
            side="right"
          >
            {renderPanelContent(rightPanel)}
          </MobileOverlay>
        )}

        {/* 通知 */}
        {notification && (
          <div style={{
            position: 'fixed', bottom: 'var(--space-6)', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--liminal-surface)', border: '1px solid var(--liminal-border)',
            padding: 'var(--space-3) var(--space-5)', fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)', color: 'var(--liminal-ink)',
            zIndex: 200, animation: 'fadeIn var(--motion-fast) ease',
          }}>
            {notification}
          </div>
        )}
      </div>
    );
  }

  // ── 桌面端 ──
  return (
    <div className="game-screen">
      {/* 左侧导航栏 */}
      <div className="game-screen__sidebar">
        <button className="game-sidebar__btn" onClick={handleBackToMenu} title="返回主菜单">
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
          className={`game-sidebar__btn ${rightPanel === 'state' ? 'game-sidebar__btn--active' : ''}`}
          onClick={() => togglePanel('state')}
          title="状态档案"
        >
          <FileSearch size={18} />
        </button>
        <div className="game-sidebar__spacer" />
        <button
          className="game-sidebar__btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? '退出全屏' : '全屏'}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          className="game-sidebar__btn"
          onClick={() => setRightCollapsed(c => !c)}
          title={rightCollapsed ? '展开右侧面板' : '折叠右侧面板'}
        >
          {rightCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
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
      {rightPanel && !rightCollapsed && (
        <div className="game-screen__right-panel">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-light)',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--ink-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {getPanelTitle(rightPanel)}
            </span>
            <button
              onClick={() => setRightPanel(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                padding: 'var(--space-1)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <PanelRightClose size={14} />
            </button>
          </div>
          {renderPanelContent(rightPanel)}
        </div>
      )}

      {/* 通知 */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 'var(--space-6)', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--liminal-surface)', border: '1px solid var(--liminal-border)',
          padding: 'var(--space-3) var(--space-5)', fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)', color: 'var(--liminal-ink)',
          zIndex: 200, animation: 'fadeIn var(--motion-fast) ease',
        }}>
          {notification}
        </div>
      )}
    </div>
  );
}
