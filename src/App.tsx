import { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { UISettingsProvider } from './context/UISettingsContext';
import { GameProvider, useGame } from './context/GameContext';
import MainMenu from './components/mainMenu/MainMenu';
import GameScreen from './components/game/GameScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import { initWorldBookSystem } from './data/worldbook';
import { initPromptAssembler } from './engine/promptAssembler';

// 初始化世界书系统
initWorldBookSystem();
initPromptAssembler();

function AppContent() {
  const { state } = useGame();
  switch (state.currentScreen) {
    case 'settings': return <SettingsScreen />;
    case 'game': return <GameScreen />;
    default: return <MainMenu />;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <UISettingsProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </UISettingsProvider>
    </ErrorBoundary>
  );
}
