// ============================================================
//  存档存储层 — IndexedDB（直接照搬自 Omni-plane-Travels）
//  消息分片 + 紧凑头部 + 增量写入
// ============================================================
import { openDB, type IDBPDatabase } from 'idb';
import type { ChatMessage } from '../stores/gameStore';
import type { ExplorationState, CharacterProfile } from '../data/level-schema';

// ─── 类型定义 ─────────────────────────────────────────

export interface GameSave {
  id: string;
  name: string;
  timestamp: number;
  messages: ChatMessage[];
  exploration: ExplorationState;
  currentLevelId: string;
  characterProfile: CharacterProfile | null;
}

export interface SaveMeta {
  id: string;
  name: string;
  timestamp: number;
  preview: string;
  estBytes?: number;
  messageCount?: number;
}

export interface CompactSaveRecord {
  id: string;
  name: string;
  timestamp: number;
  schemaVersion: number;
  round: number;
  exploration: ExplorationState;
  currentLevelId: string;
  characterProfile: CharacterProfile | null;
  messageCount: number;
  lastMessageSeq: number;
  estBytes?: number;
}

export interface MessageRecord {
  key: string;
  saveId: string;
  seq: number;
  message: ChatMessage;
}

// ─── DB 常量 ──────────────────────────────────────────

const DB_NAME = 'eternal-lost';
const DB_VERSION = 2;
const SAVES_STORE = 'saves';
const GLOBAL_STORE = 'global';
const MESSAGES_STORE = 'messages';
const SAVE_SCHEMA_VERSION = 1;
export { SAVE_SCHEMA_VERSION };
const ACTIVE_SAVE_KEY = 'eternal-lost-active-save';
export { ACTIVE_SAVE_KEY };

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, transaction) {
        // 创建 saves store
        if (!db.objectStoreNames.contains(SAVES_STORE)) {
          db.createObjectStore(SAVES_STORE, { keyPath: 'id' });
        }
        // 创建 global store
        if (!db.objectStoreNames.contains(GLOBAL_STORE)) {
          db.createObjectStore(GLOBAL_STORE, { keyPath: 'key' });
        }
        // 创建 messages store
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const msgStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'key' });
          msgStore.createIndex('saveId', 'saveId');
          msgStore.createIndex('saveId_seq', ['saveId', 'seq']);
        }

        // 从 v1 迁移：将内联 messages 的老格式拆分为分片 + 紧凑头部
        if (oldVersion < 2) {
          const savesTx = transaction.objectStore(SAVES_STORE);
          const saveRecords = await savesTx.getAll();
          for (const record of saveRecords) {
            const old = record as any;
            const messages: ChatMessage[] = old.messages || [];
            if (!Array.isArray(messages) || messages.length === 0) continue;

            // 写消息分片
            const msgTx = transaction.objectStore(MESSAGES_STORE);
            for (let i = 0; i < messages.length; i++) {
              const msg = messages[i];
              msg.seq = msg.seq ?? i;
              msg.round = msg.round ?? 0;
              msgTx.put({
                key: `${old.id}#${i}`,
                saveId: old.id,
                seq: i,
                message: msg,
              });
            }

            // 转为紧凑头部（去掉 messages 字段）
            const compact: CompactSaveRecord = {
              id: old.id,
              name: old.name || '旧存档',
              timestamp: old.timestamp || Date.now(),
              schemaVersion: SAVE_SCHEMA_VERSION,
              round: messages.reduce((max, m) => Math.max(max, m.round ?? 0), 0),
              exploration: old.exploration || old.gameState,
              currentLevelId: old.currentLevelId || old.exploration?.currentLevelId || 'level-0',
              characterProfile: old.characterProfile || null,
              messageCount: messages.length,
              lastMessageSeq: messages.length - 1,
            };
            savesTx.put(compact as any);
          }

          // 从 saves store 构建初始元数据
          const afterMigration = await savesTx.getAll();
          const metas: SaveMeta[] = afterMigration.map((r: any) => ({
            id: r.id,
            name: r.name,
            timestamp: r.timestamp,
            preview: r.characterProfile?.name || r.exploration?.characterProfile?.name || '未知旅者',
            messageCount: r.messageCount || 0,
          }));
          const globalTx = transaction.objectStore(GLOBAL_STORE);
          globalTx.put({ key: 'saves', value: metas });
        }
      },
    });
  }
  return dbPromise;
}

// ─── 消息分片操作 ─────────────────────────────────────

export async function getLastMessageSeq(saveId: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readonly');
  const index = tx.store.index('saveId_seq');
  const range = IDBKeyRange.bound(
    [saveId, 0],
    [saveId, Number.MAX_SAFE_INTEGER],
  );
  let lastSeq = -1;
  let cursor = await index.openCursor(range, 'prev');
  if (cursor) lastSeq = cursor.value.seq;
  return lastSeq;
}

export async function getRecentMessages(saveId: string, count: number): Promise<ChatMessage[]> {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readonly');
  const index = tx.store.index('saveId_seq');
  const lastSeq = await getLastMessageSeq(saveId);
  if (lastSeq < 0) return [];
  const startSeq = Math.max(0, lastSeq - count + 1);
  const range = IDBKeyRange.bound([saveId, startSeq], [saveId, lastSeq]);
  const messages: ChatMessage[] = [];
  let cursor = await index.openCursor(range, 'next');
  while (cursor) {
    messages.push(cursor.value.message);
    cursor = await cursor.continue();
  }
  return messages;
}

export async function getAllMessages(saveId: string): Promise<ChatMessage[]> {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readonly');
  const index = tx.store.index('saveId_seq');
  const range = IDBKeyRange.bound([saveId, 0], [saveId, Number.MAX_SAFE_INTEGER]);
  const messages: ChatMessage[] = [];
  let cursor = await index.openCursor(range, 'next');
  while (cursor) {
    messages.push(cursor.value.message);
    cursor = await cursor.continue();
  }
  return messages;
}

export async function putMessages(saveId: string, messages: ChatMessage[], startSeq: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readwrite');
  for (let i = 0; i < messages.length; i++) {
    const seq = startSeq + i;
    tx.store.put({ key: `${saveId}#${seq}`, saveId, seq, message: messages[i] });
  }
  await tx.done;
}

export async function deleteMessages(saveId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readwrite');
  const index = tx.store.index('saveId');
  let cursor = await index.openCursor(IDBKeyRange.only(saveId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function deleteMessagesAboveSeq(saveId: string, maxSeq: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(MESSAGES_STORE, 'readwrite');
  const index = tx.store.index('saveId_seq');
  let cursor = await index.openCursor(IDBKeyRange.bound([saveId, maxSeq + 1], [saveId, Number.MAX_SAFE_INTEGER]));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

/** 轻量更新存档头部 */
export async function updateSaveHead(saveId: string, patch: { name?: string; timestamp?: number }): Promise<void> {
  const db = await getDB();
  const record = await db.get(SAVES_STORE, saveId);
  if (!record) return;
  if (patch.name !== undefined) record.name = patch.name;
  if (patch.timestamp !== undefined) record.timestamp = patch.timestamp;
  await db.put(SAVES_STORE, record);
}

// ─── Global store ─────────────────────────────────────

async function getGlobal<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const record = await db.get(GLOBAL_STORE, key);
  return record?.value as T | undefined;
}

async function putGlobal(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put(GLOBAL_STORE, { key, value });
}

// ─── 存档元数据管理 ─────────────────────────────────

let cachedSaveMeta: SaveMeta[] | null = null;

async function buildMetaFromSavesStore(): Promise<SaveMeta[]> {
  const db = await getDB();
  const allRecords = await db.getAll(SAVES_STORE);
  return allRecords.map((r: any) => ({
    id: r.id,
    name: r.name,
    timestamp: r.timestamp,
    preview: r.characterProfile?.name || r.exploration?.characterProfile?.name || '未知旅者',
    messageCount: r.messageCount || 0,
  })).sort((a, b) => b.timestamp - a.timestamp);
}

export async function getAllSaveMeta(): Promise<SaveMeta[]> {
  if (cachedSaveMeta) return cachedSaveMeta;
  const metas = await getGlobal<SaveMeta[]>('saves');
  if (metas && metas.length > 0) {
    cachedSaveMeta = metas;
    return cachedSaveMeta;
  }
  // 全局缓存为空时从 saves store 重建
  const rebuilt = await buildMetaFromSavesStore();
  if (rebuilt.length > 0) {
    cachedSaveMeta = rebuilt;
    await putGlobal('saves', rebuilt);
  } else {
    cachedSaveMeta = [];
  }
  return cachedSaveMeta;
}

export async function saveAllSaveMeta(metas: SaveMeta[]): Promise<void> {
  cachedSaveMeta = metas;
  await putGlobal('saves', metas);
}

export function invalidateSaveMetaCache(): void {
  cachedSaveMeta = null;
}

// ─── 存档 CRUD ────────────────────────────────────────

export async function saveGameIncremental(
  saveId: string,
  compactHead: Omit<CompactSaveRecord, 'messageCount' | 'lastMessageSeq'>,
  newMessages: ChatMessage[],
): Promise<void> {
  const db = await getDB();
  let maxSeq = -1;
  if (newMessages.length > 0) {
    const tx = db.transaction(MESSAGES_STORE, 'readwrite');
    for (const msg of newMessages) {
      const seq = msg.seq ?? 0;
      tx.store.put({ key: `${saveId}#${seq}`, saveId, seq, message: msg });
      maxSeq = Math.max(maxSeq, seq);
    }
    await tx.done;
  }
  const currentLastSeq = (compactHead as any).lastMessageSeq ?? -1;
  const newLastSeq = Math.max(currentLastSeq, maxSeq);
  await db.put(SAVES_STORE, {
    ...compactHead,
    schemaVersion: SAVE_SCHEMA_VERSION,
    messageCount: newLastSeq + 1,
    lastMessageSeq: newLastSeq,
  } as any);
}

export async function loadGame(id: string): Promise<GameSave | undefined> {
  try {
    const db = await getDB();
    const record = await db.get(SAVES_STORE, id);
    if (!record) return undefined;
    const compactHead = record as CompactSaveRecord;
    const messages = await getAllMessages(id);
    const hasSeq = messages.some(m => m.seq !== undefined);
    if (!hasSeq && messages.length > 0) {
      messages.forEach((m, i) => { m.seq = i; });
    }
    return {
      id: compactHead.id,
      name: compactHead.name,
      timestamp: compactHead.timestamp,
      messages,
      exploration: compactHead.exploration,
      currentLevelId: compactHead.currentLevelId,
      characterProfile: compactHead.characterProfile,
    };
  } catch (err) {
    console.error('[DB] 加载失败:', err);
    return undefined;
  }
}

export async function deleteSave(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([SAVES_STORE, MESSAGES_STORE], 'readwrite');
  await tx.objectStore(SAVES_STORE).delete(id);
  const msgIndex = tx.objectStore(MESSAGES_STORE).index('saveId');
  let cursor = await msgIndex.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function forceDeleteSave(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(SAVES_STORE, id);
  const metas = await getAllSaveMeta();
  const filtered = metas.filter(s => s.id !== id);
  await saveAllSaveMeta(filtered);
  if (localStorage.getItem(ACTIVE_SAVE_KEY) === id) {
    localStorage.removeItem(ACTIVE_SAVE_KEY);
  }
}

export function generateSaveId(): string {
  return `save_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildPreview(save: GameSave): string {
  if (save.characterProfile?.name) return save.characterProfile.name;
  return '未知旅者';
}
