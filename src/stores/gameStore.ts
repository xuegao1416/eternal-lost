// ============================================================
//  游戏状态 Store — Zustand
// ============================================================
import { create } from 'zustand';
import type { ExplorationState, LevelDef, NotebookEntry, RuleDef, InventoryItem, CharacterProfile } from '../data/level-schema';
import { createDefaultExplorationState } from '../data/level-schema';
import { getLevelById } from '../data/levels';
import { loadGame, getAllSaveMeta } from '../storage/db';
import type { GameSave } from '../storage/db';

export type Screen = 'menu' | 'game' | 'settings' | 'opening';

interface GameState {
  currentScreen: Screen;
  exploration: ExplorationState;
  currentLevel: LevelDef | null;
  isLoading: boolean;
  messages: ChatMessage[];
  /** 当前轮次（每完成一轮 AI 回复 +1） */
  round: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** 消息序号（增量存档用） */
  seq?: number;
  /** 轮次 */
  round?: number;
  /** 该消息时的探索状态快照（用于回滚恢复） */
  snapshot?: ExplorationState;
}

interface GameActions {
  setScreen: (screen: Screen) => void;
  startNewGame: (profile?: CharacterProfile) => void;
  continueGame: () => void;
  setCurrentLevel: (levelId: string) => void;
  addMessage: (msg: Partial<ChatMessage> & Pick<ChatMessage, 'role' | 'content'>) => void;
  updateMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  deleteMessagesFrom: (id: string) => void;
  addNotebookEntry: (entry: Omit<NotebookEntry, 'id' | 'timestamp'>) => void;
  addDiscoveredRule: (rule: RuleDef) => void;
  addInventoryItem: (item: InventoryItem) => void;
  incrementSurvivalTime: () => void;
  setMood: (mood: string) => void;
  setLoading: (loading: boolean) => void;
  resetGame: () => void;
  /** 轮次 +1 */
  incrementRound: () => void;
  /** 从存档恢复状态 */
  loadSaveState: (data: {
    messages: ChatMessage[];
    exploration: ExplorationState;
    currentLevelId: string;
    round: number;
  }) => void;
  /** 从指定消息处截断并回滚探索状态（用时序图恢复） */
  restoreFromMessage: (id: string) => void;
  /** 回滚到指定消息的快照状态（保留该消息本身，供"重新发送"使用） */
  rollbackToMessageSnapshot: (id: string) => void;
}

const initialExploration = createDefaultExplorationState();
const initialLevel = getLevelById('level-0') || null;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  currentScreen: 'menu',
  exploration: initialExploration,
  currentLevel: initialLevel,
  isLoading: false,
  messages: [],
  round: 0,

  setScreen: (screen) => set({ currentScreen: screen }),

  startNewGame: (profile) => {
    const exploration = createDefaultExplorationState();
    if (profile) {
      exploration.characterProfile = profile;
    }
    const level = getLevelById(exploration.currentLevelId) || null;

    // 构建开局 system 消息
    let openingMsg = '你醒了。你不记得自己是怎么来到这里的。你只知道，这不是你应该在的地方。';
    if (profile) {
      openingMsg = `你醒了。${openingMsg}\n\n你是${profile.name}。${profile.background}。${profile.appearance}。口袋里有${profile.items}。`;
    }

    set({
      currentScreen: 'game',
      exploration,
      currentLevel: level,
      round: 0,
      messages: [{
        id: crypto.randomUUID(),
        role: 'system',
        content: openingMsg,
        timestamp: Date.now(),
      }],
    });
  },

  continueGame: async () => {
    // 尝试加载上次存档
    try {
      const metas = await getAllSaveMeta();
      if (metas.length > 0) {
        const last = await loadGame(metas[0].id);
        if (last) {
          const level = getLevelById(last.currentLevelId) || null;
          set({
            currentScreen: 'game',
            exploration: last.exploration,
            currentLevel: level,
            messages: last.messages,
            round: last.messages.reduce((max, m) => Math.max(max, m.round ?? 0), 0),
          });
          return;
        }
      }
    } catch (_) { /* fallback to new game */ }
    get().startNewGame();
  },

  setCurrentLevel: (levelId) => {
    const level = getLevelById(levelId);
    if (!level) return;
    set((state) => ({
      currentLevel: level,
      exploration: {
        ...state.exploration,
        currentLevelId: levelId,
        visitedLevels: state.exploration.visitedLevels.includes(levelId)
          ? state.exploration.visitedLevels
          : [...state.exploration.visitedLevels, levelId],
      },
    }));
  },

  addMessage: (msg) => set((state) => {
    const seq = state.messages.length;
    return {
      messages: [...state.messages, {
        ...msg,
        id: msg.id || crypto.randomUUID(),
        timestamp: msg.timestamp || Date.now(),
        seq,
      }],
    };
  }),

  updateMessage: (id, content) => set((state) => ({
    messages: state.messages.map(m =>
      m.id === id ? { ...m, content } : m,
    ),
  })),

  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter(m => m.id !== id),
  })),

  deleteMessagesFrom: (id) => set((state) => {
    const idx = state.messages.findIndex(m => m.id === id);
    if (idx === -1) return state;
    return { messages: state.messages.slice(0, idx) };
  }),

  restoreFromMessage: (id) => set((state) => {
    const idx = state.messages.findIndex(m => m.id === id);
    if (idx === -1) return state;
    const target = state.messages[idx];
    if (!target.snapshot) return { messages: state.messages.slice(0, idx) };
    const level = getLevelById(target.snapshot.currentLevelId) || null;
    return {
      messages: state.messages.slice(0, idx),
      exploration: target.snapshot,
      currentLevel: level,
      round: target.round ?? state.round,
    };
  }),

  /** 回滚到指定消息的快照状态（供"重新发送"使用，保留该消息本身以便重新输入） */
  rollbackToMessageSnapshot: (id) => set((state) => {
    const idx = state.messages.findIndex(m => m.id === id);
    if (idx === -1) return state;
    const target = state.messages[idx];
    if (!target.snapshot) return state;
    const level = getLevelById(target.snapshot.currentLevelId) || null;
    return {
      exploration: target.snapshot,
      currentLevel: level,
      round: target.round ?? state.round,
    };
  }),

  addNotebookEntry: (entry) => set((state) => ({
    exploration: {
      ...state.exploration,
      notebook: [...state.exploration.notebook, {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }],
    },
  })),

  addDiscoveredRule: (rule) => set((state) => ({
    exploration: {
      ...state.exploration,
      discoveredRules: [...state.exploration.discoveredRules, rule],
    },
  })),

  addInventoryItem: (item) => set((state) => ({
    exploration: {
      ...state.exploration,
      inventory: [...state.exploration.inventory, item],
    },
  })),

  incrementSurvivalTime: () => set((state) => ({
    exploration: {
      ...state.exploration,
      survivalTime: state.exploration.survivalTime + 1,
    },
  })),

  setMood: (mood) => set((state) => ({
    exploration: { ...state.exploration, currentMood: mood },
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  resetGame: () => set({
    currentScreen: 'menu',
    exploration: createDefaultExplorationState(),
    currentLevel: getLevelById('level-0') || null,
    messages: [],
    round: 0,
  }),

  incrementRound: () => set((state) => ({
    round: state.round + 1,
  })),

  loadSaveState: (data) => {
    const level = getLevelById(data.currentLevelId) || null;
    // 分配 seq（从 save 加载的消息可能没有 seq）
    const messages = data.messages.map((m, i) => ({ ...m, seq: i }));
    set({
      currentScreen: 'game',
      exploration: data.exploration,
      currentLevel: level,
      messages,
      round: data.round,
    });
  },
}));
