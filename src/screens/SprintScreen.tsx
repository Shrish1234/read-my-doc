import { useState, useEffect, useRef } from 'react';
import { useFocus } from '@/context/FocusContext';
import { Pencil } from 'lucide-react';
import { CompletionScreen } from './CompletionScreen';

export function SprintScreen() {
  const { state, dispatch, currentGoal } = useFocus();
  const totalSeconds = (currentGoal?.sprintDurationMinutes ?? 30) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const endTimeRef = useRef(Date.now() + totalSeconds * 1000);

  const emergencyRemaining = state.emergencyLimitPerWeek - state.emergencyUsedThisWeek;

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setTimerDone(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!currentGoal) return null;

  if (timerDone) {
    return <CompletionScreen />;
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const elapsed = totalSeconds - secondsRemaining;
  const progressPct = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;

  return (
    <div className="animate-fade-in mx-auto flex min-h-[calc(100vh-56px)] max-w-[640px] flex-col items-center justify-center px-5">
      <div className="w-full text-center">
        <div className="timer-digits">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div className="mx-auto mt-2 h-[3px] w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progressPct}%`, transition: 'width 1s linear' }}
          />
        </div>
        <p className="mt-4 text-lg text-muted-foreground">{currentGoal.name}</p>
      </div>

      {currentGoal.allowedUrls.length > 0 && (
        <div className="mt-12 w-full">
          <div className="section-label mb-3">ALLOWED RESOURCES</div>
          <div className="space-y-2">
            {currentGoal.allowedUrls.map((url, i) => (
              <a key={i} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline">
                {url}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 w-full">
        {!showNotes ? (
          <button onClick={() => setShowNotes(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Pencil size={14} /> Add notes...
          </button>
        ) : (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Working notes — what are you figuring out?"
            rows={4}
            className="w-full resize-y rounded-lg border border-border bg-card px-3 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors animate-fade-in"
          />
        )}
      </div>

      <div className="mt-8">
        {emergencyRemaining > 0 ? (
          <button onClick={() => dispatch({ type: 'USE_EMERGENCY' })} className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Emergency unlock ({emergencyRemaining} remaining)
          </button>
        ) : (
          <p className="text-[13px] text-muted-foreground opacity-40">No emergency unlocks remaining</p>
        )}
      </div>
    </div>
  );
}
