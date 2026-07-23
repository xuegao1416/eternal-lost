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
  ACTIVE_SAVE_KEY,
  SAVE_SCHEMA_VERSION,
} from '../storage/db';

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
  currentSaveId: (() => {
    const raw = localStorage.getItem(ACTIVE_SAVE_KEY);
    if (raw && /^save_\d+_[a-z0-9]{6,}$/.test(raw)) return raw;
    return null;
  })(),
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
    await deleteSaveFromDb(saveId);
    const { savesMeta, currentSaveId } = get();
    const updated = savesMeta.filter(s => s.id !== saveId);
    const changes: Partial<SaveState> = { savesMeta: updated };
    if (currentSaveId === saveId) {
      localStorage.removeItem(ACTIVE_SAVE_KEY);
      changes.currentSaveId = null;
      changes.currentSaveName = '';
    }
    set(changes);
    invalidateSaveMetaCache();
    await saveAllSaveMeta(updated);
  },

  forceDeleteSave: async (saveId) => {
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
  },

  renameSave: async (saveId, newName) => {
    const { savesMeta } = get();
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
    set({ savesMeta: updated });
    await saveAllSaveMeta(updated);
    try {
      await updateSaveHead(saveId, { name: newName, timestamp: newTimestamp });
    } catch (err) {
      console.warn('[存档] 更新头部 name 失败:', err);
    }
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

    try {
      await saveGameIncremental(saveData.id, compactHead, newMessages);
    } catch (err) {
      console.error('[存档] 写入失败:', err);
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
      console.warn('[存档] 元数据持久化失败:', err);
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
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      if (_autoSaveBuilder) {
        get().saveGame(_autoSaveBuilder).catch(err => {
          console.error('[auto-save] 保存失败:', err);
        });
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
  _autoSaveBuilder = builder;
}

export function resetForNewGame() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  _saveQueued = false;
  _savePromise = null;
}
