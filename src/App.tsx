import ErrorBoundary from './components/ErrorBoundary';
import { UISettingsProvider } from './context/UISettingsContext';
import { GameProvider, useGame } from './context/GameContext';
import MainMenu from './components/mainMenu/MainMenu';
import GameScreen from './components/game/GameScreen';
import SettingsScreen from './components/settings/SettingsScreen';

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
