import { useFocus } from '@/context/FocusContext';
import { Settings } from 'lucide-react';

interface TopBarProps {
  onSettingsClick: () => void;
  showBack?: boolean;
  onBackClick?: () => void;
}

export function TopBar({ onSettingsClick, showBack, onBackClick }: TopBarProps) {
  const { state } = useFocus();

  const pillConfig = {
    ONBOARDING: { label: 'Setup', color: 'text-primary bg-primary/15' },
    LOCKED: { label: 'Locked', color: 'text-primary bg-primary/15' },
    IN_SPRINT: { label: 'In Sprint', color: 'text-primary bg-primary/15' },
    UNLOCKED: { label: 'Unlocked', color: 'text-success bg-success/15' },
  };

  const pill = pillConfig[state.appState];

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-5">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBackClick}
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              ← Back
            </button>
          )}
          {!showBack && (
            <span className="text-base font-semibold text-foreground">FocusOS</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`small-label rounded-full px-2.5 py-1 ${pill.color}`}>
            {pill.label}
          </span>
          <button
            onClick={onSettingsClick}
            className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
