// ============================================================
//  游戏状态 Store — Zustand
// ============================================================
import { create } from 'zustand';
import type { ExplorationState, LevelDef, NotebookEntry, RuleDef, InventoryItem } from '../data/level-schema';
import { createDefaultExplorationState } from '../data/level-schema';
import { getLevelById } from '../data/levels';

export type Screen = 'menu' | 'game' | 'settings';

interface GameState {
  currentScreen: Screen;
  exploration: ExplorationState;
  currentLevel: LevelDef | null;
  isLoading: boolean;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface GameActions {
  setScreen: (screen: Screen) => void;
  startNewGame: () => void;
  continueGame: () => void;
  setCurrentLevel: (levelId: string) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addNotebookEntry: (entry: Omit<NotebookEntry, 'id' | 'timestamp'>) => void;
  addDiscoveredRule: (rule: RuleDef) => void;
  addInventoryItem: (item: InventoryItem) => void;
  incrementSurvivalTime: () => void;
  setMood: (mood: string) => void;
  setLoading: (loading: boolean) => void;
  resetGame: () => void;
}

const initialExploration = createDefaultExplorationState();
const initialLevel = getLevelById('level-0') || null;

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  currentScreen: 'menu',
  exploration: initialExploration,
  currentLevel: initialLevel,
  isLoading: false,
  messages: [],

  setScreen: (screen) => set({ currentScreen: screen }),

  startNewGame: () => {
    const exploration = createDefaultExplorationState();
    const level = getLevelById(exploration.currentLevelId) || null;
    set({
      currentScreen: 'game',
      exploration,
      currentLevel: level,
      messages: [{
        id: crypto.randomUUID(),
        role: 'system',
        content: '你醒了。你不记得自己是怎么来到这里的。你只知道，这不是你应该在的地方。',
        timestamp: Date.now(),
      }],
    });
  },

  continueGame: () => {
    // TODO: 从 IndexedDB 加载存档
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

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }],
  })),

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
  }),
}));
