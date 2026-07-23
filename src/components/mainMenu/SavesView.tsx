// ============================================================
//  存档管理界面（照搬自 Omni-plane-Travels，适配本主题）
//  支持：选中读档 / 重命名 / 删除 / 右键菜单
// ============================================================
import { useState, useRef } from 'react';
import { ArrowLeft, Save, Trash2, User, MessageSquare, Edit3, Check, X, RotateCcw } from 'lucide-react';
import type { SaveMeta, GameSave } from '../../storage/db';
import { loadGame as loadGameFromDb } from '../../storage/db';
import ContextMenu, { type ContextMenuItem } from '../game/chat/ContextMenu';

interface Props {
  allSaves: SaveMeta[];
  currentSaveId: string | null;
  onBack: () => void;
  onLoadSave: (save: GameSave) => void;
  onDeleteSave: (id: string) => void;
  onForceDeleteSave: (id: string) => void;
  onRenameSave: (id: string, newName: string) => void;
}

export default function SavesView({
  allSaves, currentSaveId, onBack, onLoadSave, onDeleteSave, onForceDeleteSave, onRenameSave,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; save: SaveMeta } | null>(null);

  const handleLoadSelected = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const fullSave = await loadGameFromDb(selectedId);
      if (fullSave) onLoadSave(fullSave);
    } finally {
      setLoading(false);
    }
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const confirmRename = () => {
    if (editingId && editingName.trim()) {
      onRenameSave(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, save: SaveMeta) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, save });
  };

  const contextItems: ContextMenuItem[] = contextMenu ? [
    {
      label: '读取存档',
      icon: <RotateCcw size={14} />,
      action: () => {
        setSelectedId(contextMenu.save.id);
        handleLoadSelected();
      },
    },
    {
      label: '重命名',
      icon: <Edit3 size={14} />,
      action: () => startRename(contextMenu.save.id, contextMenu.save.name),
    },
    {
      label: '删除存档',
      icon: <Trash2 size={14} />,
      action: () => onDeleteSave(contextMenu.save.id),
      danger: true,
    },
  ] : [];

  return (
    <div className="main-menu static-noise">
      <div className="main-menu__card" style={{ maxWidth: '600px' }}>
        {/* 头部 */}
        <div className="main-menu__title-block" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="main-menu__title" style={{ fontSize: 'var(--text-2xl)', gap: 0 }}>
            存档管理
          </h1>
          <p className="main-menu__subtitle">SAVE ARCHIVE · {allSaves.length} 个存档</p>
        </div>

        {/* 存档列表 */}
        <div className="saves-list" style={{
          maxHeight: '50vh',
          overflowY: 'auto',
          marginBottom: 'var(--space-4)',
        }}>
          {allSaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)' }}>
              <p className="text-muted" style={{ marginBottom: 'var(--space-3)' }}>暂无存档记录</p>
              <p className="text-faded" style={{ fontSize: 'var(--text-sm)' }}>开始新的旅程后，系统将自动创建存档</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {allSaves.map(meta => {
                const isActive = meta.id === currentSaveId;
                const isSelected = meta.id === selectedId;
                const isEditing = meta.id === editingId;

                return (
                  <div
                    key={meta.id}
                    className="save-card"
                    onClick={() => setSelectedId(meta.id)}
                    onContextMenu={(e) => handleContextMenu(e, meta)}
                    style={{
                      background: isSelected ? 'var(--paper-warm)' : 'var(--paper-light)',
                      border: `1px solid ${isSelected ? 'var(--stamp-red-dim)' : 'var(--border)'}`,
                      padding: 'var(--space-3) var(--space-4)',
                      cursor: 'pointer',
                      transition: 'all var(--motion-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <input
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null); }}
                              className="input-field"
                              style={{ flex: 1, fontSize: 'var(--text-sm)', padding: '2px 6px' }}
                              autoFocus
                            />
                            <button onClick={e => { e.stopPropagation(); confirmRename(); }} className="game-sidebar__btn" style={{ width: 24, height: 24 }}><Check size={12} /></button>
                            <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="game-sidebar__btn" style={{ width: 24, height: 24 }}><X size={12} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-body" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--text-base)' }}>
                              {meta.name}
                            </span>
                            {isActive && (
                              <span style={{
                                fontSize: 'var(--text-xs)',
                                padding: '1px 6px',
                                borderRadius: '8px',
                                background: 'var(--stamp-red-dim)',
                                color: 'var(--stamp-red)',
                                fontWeight: 500,
                                flexShrink: 0,
                              }}>
                                当前
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                          <button onClick={e => { e.stopPropagation(); startRename(meta.id, meta.name); }} className="game-sidebar__btn" style={{ width: 24, height: 24 }} title="重命名">
                            <Edit3 size={11} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); onDeleteSave(meta.id); }} className="game-sidebar__btn" style={{ width: 24, height: 24 }} title="删除">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 预览信息 */}
                    {meta.preview && (
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{
                          fontSize: 'var(--text-xs)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: 'var(--paper-deep)',
                          color: 'var(--ink-faded)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <User size={11} /> {meta.preview}
                        </span>
                      </div>
                    )}

                    {/* 时间 + 消息数 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                      <span>{new Date(meta.timestamp).toLocaleString()}</span>
                      {meta.messageCount && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <MessageSquare size={11} /> {meta.messageCount} 条消息
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="main-menu__actions" style={{ marginTop: 0 }}>
          <button className="btn btn-ghost" onClick={onBack}>
            <ArrowLeft size={14} /> 返回
          </button>

          {selectedId && (
            <button
              className="btn btn-primary btn-typewriter"
              onClick={handleLoadSelected}
              disabled={loading}
            >
              <Save size={14} /> {loading ? '加载中...' : '读取存档'}
            </button>
          )}

          {selectedId && selectedId !== currentSaveId && (
            <button
              className="btn btn-ghost"
              onClick={() => onForceDeleteSave(selectedId)}
              style={{ color: 'var(--stamp-red)' }}
            >
              <Trash2 size={14} /> 强制删除
            </button>
          )}
        </div>

        <p className="main-menu__footer">
          右键存档可删除回滚点
        </p>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
