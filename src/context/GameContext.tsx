// ============================================================
//  GameContext — 桥接 useGameStore 到 React Context
//  注入自动存档 builder + F5 恢复 + 暴露 save 操作
// ============================================================
import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useGameStore, type ChatMessage, type Screen } from '../stores/gameStore';
import { useSaveStore, setAutoSaveBuilder, resetForNewGame } from '../stores/saveStore';
import type { ExplorationState, LevelDef, NotebookEntry, RuleDef, InventoryItem, CharacterProfile } from '../data/level-schema';
import type { GameSave } from '../storage/db';
import { loadGame, ACTIVE_SAVE_KEY } from '../storage/db';

interface GameContextValue {
  state: {
    currentScreen: Screen;
    exploration: ExplorationState;
    currentLevel: LevelDef | null;
    isLoading: boolean;
    messages: ChatMessage[];
    round: number;
  };
  actions: {
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
    incrementRound: () => void;
    loadSave: (save: GameSave) => void;
    restoreFromMessage: (id: string) => void;
    rollbackToMessageSnapshot: (id: string) => void;
  };
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const store = useGameStore();
  const newGameStartedRef = useRef(false);

  // F5 刷新自动恢复：挂载时检测 ACTIVE_SAVE_KEY 并加载
  useEffect(() => {
    const savedId = localStorage.getItem(ACTIVE_SAVE_KEY);
    if (!savedId) return;
    loadGame(savedId).then(save => {
      if (!save || newGameStartedRef.current) return;
      useSaveStore.getState().loadSave(save.id);
      store.loadSaveState({
        messages: save.messages,
        exploration: save.exploration,
        currentLevelId: save.currentLevelId,
        round: save.messages.reduce((max, m) => Math.max(max, m.round ?? 0), 0),
      });
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // 劫持 startNewGame 标记新游戏（阻止 F5 恢复覆盖）
  const originalStartNewGame = store.startNewGame;
  const wrappedStartNewGame = useCallback((profile?: CharacterProfile) => {
    newGameStartedRef.current = true;
    originalStartNewGame(profile);
  }, [originalStartNewGame]);

  // 注入自动存档 builder
  useEffect(() => {
    setAutoSaveBuilder(() => {
      const gs = useGameStore.getState();
      const ss = useSaveStore.getState();
      if (!ss.currentSaveId || !ss.currentSaveName) return null;
      return {
        id: ss.currentSaveId,
        name: ss.currentSaveName,
        timestamp: Date.now(),
        messages: gs.messages,
        exploration: gs.exploration,
        currentLevelId: gs.exploration.currentLevelId,
        characterProfile: gs.exploration.characterProfile,
      };
    });
    return () => setAutoSaveBuilder(() => null);
  }, []);

  const loadSave = useCallback((save: GameSave) => {
    store.loadSaveState({
      messages: save.messages,
      exploration: save.exploration,
      currentLevelId: save.currentLevelId,
      round: save.messages.reduce((max, m) => Math.max(max, m.round ?? 0), 0),
    });
  }, [store]);

  const value: GameContextValue = {
    state: {
      currentScreen: store.currentScreen,
      exploration: store.exploration,
      currentLevel: store.currentLevel,
      isLoading: store.isLoading,
      messages: store.messages,
      round: store.round,
    },
    actions: {
      setScreen: store.setScreen,
      startNewGame: wrappedStartNewGame,
      continueGame: store.continueGame,
      setCurrentLevel: store.setCurrentLevel,
      addMessage: store.addMessage,
      updateMessage: store.updateMessage,
      deleteMessage: store.deleteMessage,
      deleteMessagesFrom: store.deleteMessagesFrom,
      addNotebookEntry: store.addNotebookEntry,
      addDiscoveredRule: store.addDiscoveredRule,
      addInventoryItem: store.addInventoryItem,
      incrementSurvivalTime: store.incrementSurvivalTime,
      setMood: store.setMood,
      setLoading: store.setLoading,
      resetGame: store.resetGame,
      incrementRound: store.incrementRound,
      loadSave,
      restoreFromMessage: store.restoreFromMessage,
      rollbackToMessageSnapshot: store.rollbackToMessageSnapshot,
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
