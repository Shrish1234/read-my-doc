import { useState, useCallback } from 'react';
import { FocusProvider, useFocus } from '@/context/FocusContext';
import { TopBar } from '@/components/TopBar';
import { FocusToast } from '@/components/FocusToast';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { GateScreen } from '@/screens/GateScreen';
import { SprintScreen } from '@/screens/SprintScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

function AppContent() {
  const { state } = useFocus();
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToastDemo = useCallback(() => {
    setToast('gmail.com is blocked. Complete your sprint to unlock.');
  }, []);

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar onSettingsClick={() => setShowSettings(false)} showBack onBackClick={() => setShowSettings(false)} />
        <SettingsScreen />
      </div>
    );
  }

  if (state.appState === 'ONBOARDING') {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingScreen />
      </div>
    );
  }

  const renderScreen = () => {
    switch (state.appState) {
      case 'LOCKED':
        return <GateScreen />;
      case 'IN_SPRINT':
        return <SprintScreen />;
      case 'UNLOCKED':
        return <DashboardScreen />;
      default:
        return <GateScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar onSettingsClick={() => setShowSettings(true)} />
      {renderScreen()}
      {toast && <FocusToast message={toast} onDone={() => setToast(null)} />}
      {state.appState === 'LOCKED' && (
        <button
          onClick={showToastDemo}
          className="fixed bottom-4 right-4 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Simulate blocked site
        </button>
      )}
    </div>
  );
}

const Index = () => (
  <FocusProvider>
    <AppContent />
  </FocusProvider>
);

export default Index;
