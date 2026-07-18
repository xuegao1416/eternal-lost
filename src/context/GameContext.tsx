// ============================================================
//  GameContext — 桥接 useGameStore 到 React Context
//  保持与原项目一致的 useGame() 接口
// ============================================================
import { createContext, useContext, type ReactNode } from 'react';
import { useGameStore, type ChatMessage, type Screen } from '../stores/gameStore';
import type { ExplorationState, LevelDef, NotebookEntry, RuleDef, InventoryItem } from '../data/level-schema';

interface GameContextValue {
  state: {
    currentScreen: Screen;
    exploration: ExplorationState;
    currentLevel: LevelDef | null;
    isLoading: boolean;
    messages: ChatMessage[];
  };
  actions: {
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
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const store = useGameStore();

  const value: GameContextValue = {
    state: {
      currentScreen: store.currentScreen,
      exploration: store.exploration,
      currentLevel: store.currentLevel,
      isLoading: store.isLoading,
      messages: store.messages,
    },
    actions: {
      setScreen: store.setScreen,
      startNewGame: store.startNewGame,
      continueGame: store.continueGame,
      setCurrentLevel: store.setCurrentLevel,
      addMessage: store.addMessage,
      addNotebookEntry: store.addNotebookEntry,
      addDiscoveredRule: store.addDiscoveredRule,
      addInventoryItem: store.addInventoryItem,
      incrementSurvivalTime: store.incrementSurvivalTime,
      setMood: store.setMood,
      setLoading: store.setLoading,
      resetGame: store.resetGame,
    },
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
