import { useState } from 'react';
import { useFocus } from '@/context/FocusContext';
import { Check } from 'lucide-react';

export function CompletionScreen() {
  const { state, dispatch, currentGoal } = useFocus();
  const [completionNote, setCompletionNote] = useState('');
  const [nextPoint, setNextPoint] = useState('');

  if (!currentGoal) return null;

  const canSubmit = completionNote.trim().length > 0 && nextPoint.trim().length > 0;

  const handleSubmit = () => {
    const session = {
      id: `s${Date.now()}`,
      goalId: currentGoal.id,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: currentGoal.sprintDurationMinutes,
      completionNote: completionNote.trim(),
      nextStartingPoint: nextPoint.trim(),
    };
    dispatch({ type: 'ADD_SESSION', payload: session });

    // Update drift scores
    const updatedDrift = state.driftScores.map(d =>
      d.goalId === currentGoal.id
        ? {
            ...d,
            hoursCompletedThisWeek: d.hoursCompletedThisWeek + currentGoal.sprintDurationMinutes / 60,
            deficit: Math.max(0, d.deficit - currentGoal.sprintDurationMinutes / 60),
          }
        : d
    );
    dispatch({ type: 'SET_DRIFT_SCORES', payload: updatedDrift });
    dispatch({ type: 'SET_APP_STATE', payload: 'UNLOCKED' });
  };

  return (
    <div className="animate-fade-in mx-auto flex min-h-[calc(100vh-56px)] max-w-[640px] flex-col items-center justify-center px-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success">
        <Check size={20} className="text-success-foreground" />
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">Sprint Complete</h2>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {currentGoal.sprintDurationMinutes} minutes on {currentGoal.name}
      </p>

      <div className="mt-8 w-full space-y-4">
        <div>
          <label className="text-base text-foreground">What did you move forward?</label>
          <textarea
            value={completionNote}
            onChange={e => setCompletionNote(e.target.value)}
            placeholder="Finished the discourse parsing exercises, reviewed key concepts..."
            rows={3}
            className="mt-2 w-full resize-y rounded-lg border border-border bg-card px-3 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-base text-foreground">Where do you pick up next time?</label>
          <textarea
            value={nextPoint}
            onChange={e => setNextPoint(e.target.value)}
            placeholder="Start the sycophancy analysis section, read the paper first..."
            rows={2}
            className="mt-2 w-full resize-y rounded-lg border border-border bg-card px-3 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-6 w-full rounded-lg bg-success py-3 text-base font-semibold text-success-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        style={{ height: 48 }}
      >
        Complete & Unlock
      </button>
    </div>
  );
}
