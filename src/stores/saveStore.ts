// ============================================================
//  存档状态管理 — Zustand（直接照搬自 Omni-plane-Travels）
//  防并发写入 + debounce 自动存档
// ============================================================
import { create } from 'zustand';
import type { GameSave, SaveMeta, CompactSaveRecord } from '../storage/db';
import {
  saveGameIncremental,
  loadGame as loadGameFromDb,
  deleteSave as deleteSaveFromDb,
  forceDeleteSave as forceDeleteSaveFromDb,
  getAllSaveMeta,
  saveAllSaveMeta,
  invalidateSaveMetaCache,
  generateSaveId,
  buildPreview,
  getLastMessageSeq,
  deleteMessages,
  updateSaveHead,
  exportSave as exportSaveFromDb,
  importSaveFromData,
  ACTIVE_SAVE_KEY,
  SAVE_SCHEMA_VERSION,
} from '../storage/db';

/** 校验 saveId 格式：save_<timestamp>_<random>，过滤 localStorage 脏数据 */
function validateSaveId(raw: string | null): string | null {
  if (!raw) return null;
  if (/^save_\d+_[a-z0-9]{6,}$/.test(raw)) return raw;
  console.warn('[saveStore] 非法 activeSaveId，已忽略:', raw);
  return null;
}

// ─── Store ───

interface SaveState {
  savesMeta: SaveMeta[];
  currentSaveId: string | null;
  currentSaveName: string;

  initialize: () => Promise<void>;
  createNewGame: (saveName: string) => Promise<string>;
  loadSave: (saveId: string) => Promise<GameSave | null>;
  deleteSave: (saveId: string) => Promise<void>;
  forceDeleteSave: (saveId: string) => Promise<void>;
  renameSave: (saveId: string, newName: string) => Promise<void>;
  importSave: (data: any) => Promise<SaveMeta | null>;
  exportSave: (saveId: string) => Promise<Blob>;

  /** 写入 DB + 更新元数据 */
  performSave: (saveData: GameSave) => Promise<void>;

  /** 防并发保存 */
  saveGame: (buildSaveData: () => GameSave | null) => Promise<void>;

  /** debounce 自动存档 */
  scheduleAutoSave: () => void;
  flushAutoSave: (buildSaveData: () => GameSave | null) => Promise<void>;
}

let _savePromise: Promise<void> | null = null;
let _saveQueued = false;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useSaveStore = create<SaveState>((set, get) => ({
  savesMeta: [],
  currentSaveId: validateSaveId(localStorage.getItem(ACTIVE_SAVE_KEY)),
  currentSaveName: '',

  initialize: async () => {
    try {
      const metas = await getAllSaveMeta();
      set({ savesMeta: metas });
    } catch (err) {
      console.warn('[存档] 初始化失败:', err);
    }
  },

  createNewGame: async (saveName) => {
    const { savesMeta } = get();
    if (savesMeta.some((s) => s.name === saveName)) {
      throw new Error('存档名称已存在');
    }

    const saveId = generateSaveId();
    localStorage.setItem(ACTIVE_SAVE_KEY, saveId);
    set({ currentSaveId: saveId, currentSaveName: saveName });

    return saveId;
  },

  loadSave: async (saveId) => {
    try {
      const saveData = await loadGameFromDb(saveId);
      if (!saveData) return null;
      localStorage.setItem(ACTIVE_SAVE_KEY, saveId);
      set({ currentSaveId: saveId, currentSaveName: saveData.name });
      return saveData;
    } catch (err) {
      console.error('[存档] 加载失败:', err);
      return null;
    }
  },

  deleteSave: async (saveId) => {
    console.log(`[存档] 开始删除: ${saveId}`);
    await deleteSaveFromDb(saveId);
    const { savesMeta, currentSaveId } = get();
    const updated = savesMeta.filter(s => s.id !== saveId);
    console.log(`[存档] 删除前 ${savesMeta.length} 条，删除后 ${updated.length} 条`);

    const changes: Partial<SaveState> = { savesMeta: updated };
    if (currentSaveId === saveId) {
      localStorage.removeItem(ACTIVE_SAVE_KEY);
      changes.currentSaveId = null;
      changes.currentSaveName = '';
      console.log(`[存档] 清除 ACTIVE_SAVE_KEY（删除的是当前存档）`);
    }

    set(changes);
    invalidateSaveMetaCache();
    await saveAllSaveMeta(updated);
    console.log(`[存档] 删除完成，已持久化 ${updated.length} 条元数据`);
  },

  forceDeleteSave: async (saveId) => {
    console.log(`[存档] 强制删除: ${saveId}`);
    await forceDeleteSaveFromDb(saveId);
    const { savesMeta, currentSaveId } = get();
    const updated = savesMeta.filter(s => s.id !== saveId);

    const changes: Partial<SaveState> = { savesMeta: updated };
    if (currentSaveId === saveId) {
      changes.currentSaveId = null;
      changes.currentSaveName = '';
    }

    set(changes);
    invalidateSaveMetaCache();
    console.log(`[存档] 强制删除完成`);
  },

  renameSave: async (saveId, newName) => {
    const { savesMeta, currentSaveId } = get();
    const existingMeta = savesMeta.find(m => m.id === saveId);
    if (!existingMeta) return;
    const newTimestamp = Date.now();
    const meta: SaveMeta = {
      id: saveId,
      name: newName,
      timestamp: newTimestamp,
      preview: existingMeta.preview,
    };
    const updated = savesMeta.map(m => m.id === saveId ? meta : m);

    const changes: Partial<SaveState> = { savesMeta: updated };
    if (currentSaveId === saveId) {
      changes.currentSaveName = newName;
    }

    set(changes);
    await saveAllSaveMeta(updated);
    try {
      await updateSaveHead(saveId, { name: newName, timestamp: newTimestamp });
    } catch (err) {
      console.warn('[存档] 更新头部 name 失败:', err);
    }
  },

  importSave: async (data) => {
    try {
      const meta = await importSaveFromData(data);
      const metas = await getAllSaveMeta();
      set({ savesMeta: metas });
      return meta;
    } catch (err) {
      console.error('[存档] 导入失败:', err);
      return null;
    }
  },

  exportSave: async (saveId) => {
    return exportSaveFromDb(saveId);
  },

  performSave: async (saveData) => {
    // 截断检测：如果数据库中的消息数 > 当前消息数，说明发生过回滚截断，全量重写
    const lastSeq = await getLastMessageSeq(saveData.id);
    const allMessages = saveData.messages || [];
    const dbMessageCount = lastSeq >= 0 ? lastSeq + 1 : 0;
    const needsFullRewrite = dbMessageCount > allMessages.length;
    if (needsFullRewrite) {
      await deleteMessages(saveData.id);
    }
    const newMessages = needsFullRewrite
      ? allMessages
      : allMessages.filter(m => (m.seq ?? 0) > lastSeq);

    const compactHead: Omit<CompactSaveRecord, 'messageCount' | 'lastMessageSeq'> = {
      id: saveData.id,
      name: saveData.name,
      timestamp: saveData.timestamp,
      schemaVersion: SAVE_SCHEMA_VERSION,
      round: allMessages.reduce((max, m) => Math.max(max, m.round ?? 0), 0),
      exploration: saveData.exploration,
      currentLevelId: saveData.currentLevelId,
      characterProfile: saveData.characterProfile,
    };

    // 关键写入：存档数据（失败则导出兜底）
    try {
      await saveGameIncremental(saveData.id, compactHead, newMessages);
    } catch (err) {
      console.error('[存档] 存档数据写入失败:', err);
      // 尝试兜底导出
      try {
        const recentMessages = (saveData.messages || []).slice(-50);
        const backupData = {
          type: 'eternal-lost-save-backup',
          version: '2.0',
          exportedAt: Date.now(),
          reason: '存档数据写入失败自动备份（只含最近50条消息）',
          save: {
            id: saveData.id, name: saveData.name, timestamp: saveData.timestamp,
            messages: recentMessages, exploration: saveData.exploration,
            currentLevelId: saveData.currentLevelId, characterProfile: saveData.characterProfile,
          },
        };
        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `save-backup-${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        console.warn('[存档] 已自动导出备份 JSON');
      } catch (exportErr) {
        console.error('[存档] 导出备份也失败:', exportErr);
      }
      throw err;
    }

    const meta: SaveMeta = {
      id: saveData.id,
      name: saveData.name,
      timestamp: saveData.timestamp,
      preview: buildPreview(saveData),
      estBytes: allMessages.length * 500,
      messageCount: allMessages.length,
    };
    const { savesMeta } = get();
    const idx = savesMeta.findIndex(m => m.id === meta.id);
    const updated = idx >= 0
      ? savesMeta.map((m, i) => i === idx ? meta : m)
      : [...savesMeta, meta];
    set({ savesMeta: updated });
    try {
      await saveAllSaveMeta(updated);
    } catch (err) {
      // 元数据写入失败不影响存档本身，内存中已更新
      console.warn('[存档] 元数据持久化失败（内存已更新，不影响游戏）:', err);
    }
  },

  saveGame: async (buildSaveData) => {
    if (_savePromise) {
      _saveQueued = true;
      return _savePromise;
    }
    const run = async () => {
      do {
        _saveQueued = false;
        const saveData = buildSaveData();
        if (saveData) {
          await get().performSave(saveData);
        }
      } while (_saveQueued);
    };
    _savePromise = run();
    try {
      await _savePromise;
    } finally {
      _savePromise = null;
    }
  },

  scheduleAutoSave: () => {
    if (_saveTimer) clearTimeout(_saveTimer);
    // debounce 500ms 后通过全局注入的 _autoSaveBuilder 执行保存
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      if (_autoSaveBuilder) {
        console.log('[auto-save] 触发自动存档...');
        get().saveGame(_autoSaveBuilder).catch(err => {
          console.error('[auto-save] 保存失败（需要用户注意）:', err);
        });
      } else {
        console.warn('[auto-save] _autoSaveBuilder 未注入，跳过存档');
      }
    }, 500);
  },

  flushAutoSave: async (buildSaveData) => {
    if (_saveTimer) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    await get().saveGame(buildSaveData);
  },
}));

// ─── 自动存档 builder（由 GameContext 注入） ───

let _autoSaveBuilder: (() => GameSave | null) | null = null;

export function setAutoSaveBuilder(builder: () => GameSave | null) {
  console.log('[auto-save] 注入 _autoSaveBuilder');
  _autoSaveBuilder = builder;
}

/** 重置模块级变量，防止新建存档时旧存档的数据污染 */
export function resetForNewGame() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  _saveQueued = false;
  _savePromise = null;
  // 注意：不要清空 _autoSaveBuilder，否则自动存档会失效
  // _autoSaveBuilder 由 GameContext 的 useEffect 注入，生命周期与组件一致
}
