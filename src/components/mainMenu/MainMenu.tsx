// ============================================================
//  主菜单 — SCP 档案风
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import { useSaveStore } from '../../stores/saveStore';
import { FileText, Settings, Archive } from 'lucide-react';
import SavesView from './SavesView';
import type { GameSave } from '../../storage/db';

export default function MainMenu() {
  const { actions } = useGame();
  const saveStore = useSaveStore();
  const [showSaves, setShowSaves] = useState(false);

  useEffect(() => {
    saveStore.initialize();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadSave = useCallback((save: GameSave) => {
    actions.loadSave(save);
  }, [actions]);

  const handleDeleteSave = useCallback(async (id: string) => {
    await saveStore.deleteSave(id);
  }, [saveStore]);

  const handleForceDeleteSave = useCallback(async (id: string) => {
    await saveStore.forceDeleteSave(id);
  }, [saveStore]);

  const handleRenameSave = useCallback(async (id: string, name: string) => {
    await saveStore.renameSave(id, name);
  }, [saveStore]);

  if (showSaves) {
    return (
      <SavesView
        allSaves={saveStore.savesMeta}
        currentSaveId={saveStore.currentSaveId}
        onBack={() => setShowSaves(false)}
        onLoadSave={handleLoadSave}
        onDeleteSave={handleDeleteSave}
        onForceDeleteSave={handleForceDeleteSave}
        onRenameSave={handleRenameSave}
      />
    );
  }

  return (
    <div className="main-menu static-noise">
      <div className="main-menu__card">
        <div className="main-menu__title-block">
          <h1 className="main-menu__title">
            <span className="main-menu__title-char">永</span>
            <span className="main-menu__title-char">恒</span>
            <span className="main-menu__title-char">迷</span>
            <span className="main-menu__title-char">途</span>
            <span className="main-menu__title-char">录</span>
          </h1>
          <p className="main-menu__subtitle">ETERNAL LOST</p>
          <p className="main-menu__tagline">
            <span className="divider-text">A Backrooms Narrative</span>
          </p>
        </div>

        <div className="main-menu__actions">
          <button
            className="btn btn-primary btn-typewriter"
            onClick={() => actions.setScreen('opening')}
          >
            <FileText size={16} />
            新的旅程
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowSaves(true)}
            style={{ position: 'relative' }}
          >
            <Archive size={16} />
            存档管理
            {saveStore.savesMeta.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--stamp-red)',
                }}
              >
                {saveStore.savesMeta.length}
              </span>
            )}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => actions.setScreen('settings')}
          >
            <Settings size={16} />
            档案设置
          </button>
        </div>

        <p className="main-menu__footer">
          档案编号: EL-0001 &nbsp;·&nbsp; v1.0
        </p>
      </div>
    </div>
  );
}
