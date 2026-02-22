import { useState } from 'react';
import { useFocus } from '@/context/FocusContext';
import { GoalHealthBar } from '@/components/GoalHealthBar';

export function GateScreen() {
  const { state, dispatch, currentGoal, currentDrift } = useFocus();
  const [showWhy, setShowWhy] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const emergencyRemaining = state.emergencyLimitPerWeek - state.emergencyUsedThisWeek;

  const startSprint = () => {
    dispatch({ type: 'SET_APP_STATE', payload: 'IN_SPRINT' });
  };

  const swapGoal = (goalId: string) => {
    dispatch({ type: 'SET_CURRENT_GOAL', payload: goalId });
    dispatch({ type: 'SET_SWAP_USED' });
    setShowSwap(false);
  };

  const confirmEmergency = () => {
    dispatch({ type: 'USE_EMERGENCY' });
    setShowEmergency(false);
  };

  if (!currentGoal || !currentDrift) return null;

  const driftColor = currentDrift.daysToDeadline <= 7 ? 'text-destructive' : 'text-warning';

  return (
    <div className="animate-fade-in mx-auto max-w-[640px] px-5 py-10">
      {/* Goal Health */}
      <div className="section-label mb-5">YOUR GOALS THIS WEEK</div>
      <div className="space-y-5">
        {state.driftScores.map(d => (
          <GoalHealthBar key={d.goalId} drift={d} isActive={d.goalId === state.currentGoalId} />
        ))}
      </div>

      {/* Sprint Assignment Card */}
      <div className="mt-8 animate-slide-up rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <div className="small-label text-primary">TODAY'S LEVERAGE SPRINT</div>
        <h1 className="mt-3 text-[32px] font-semibold leading-tight text-foreground md:text-4xl">
          {currentGoal.name}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {currentGoal.sprintDurationMinutes} minute sprint
        </p>
        <p className={`mt-2 text-[15px] ${driftColor}`}>
          {currentDrift.deficit} hours behind target. Deadline in {currentDrift.daysToDeadline} days
          {currentDrift.daysToDeadline <= 7 ? ' — this is urgent.' : '.'}
        </p>

        {/* Why this goal */}
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="mt-3 flex items-center gap-1 text-[13px] text-primary hover:underline"
        >
          <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: showWhy ? 'rotate(90deg)' : 'none' }}>▸</span>
          Why this goal?
        </button>

        {showWhy && (
          <div className="mt-3 rounded-lg border border-border bg-background p-4 animate-fade-in">
            <div className="font-mono-calc space-y-1.5 text-[13px] text-muted-foreground">
              {state.driftScores.map(d => (
                <div key={d.goalId} className="flex items-center justify-between">
                  <span className="min-w-[180px]">{d.goalName}</span>
                  <span>{d.deficit} hrs × {d.urgencyWeight.toFixed(3)} = {d.score.toFixed(3)}</span>
                  {d.goalId === state.currentGoalId && (
                    <span className="ml-2 text-primary">← selected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-4">
        <button
          onClick={startSprint}
          className="w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
          style={{ height: 48 }}
        >
          Start Sprint
        </button>

        <button
          onClick={() => !state.swapUsedToday && setShowSwap(true)}
          disabled={state.swapUsedToday}
          className="w-full rounded-lg border border-border py-2.5 text-[15px] text-muted-foreground transition-all duration-150 hover:border-foreground/20 disabled:opacity-30 disabled:pointer-events-none"
          style={{ height: 44 }}
        >
          {state.swapUsedToday ? 'Swap Goal (used today)' : 'Swap Goal'}
        </button>

        {emergencyRemaining > 0 ? (
          <button
            onClick={() => setShowEmergency(true)}
            className="w-full text-center text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Emergency unlock ({emergencyRemaining} of {state.emergencyLimitPerWeek} remaining this week)
          </button>
        ) : (
          <p className="text-center text-[13px] text-muted-foreground opacity-40">
            No emergency unlocks remaining
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-[13px] text-muted-foreground">
        Complete your sprint to unlock browsing for the day.
      </p>

      {/* Swap Modal */}
      {showSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50" onClick={() => setShowSwap(false)}>
          <div className="animate-modal-in w-full max-w-[400px] rounded-xl border border-border bg-card p-5 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Swap today's goal</h2>
              <button onClick={() => setShowSwap(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="mt-4 space-y-1">
              {state.driftScores.filter(d => d.goalId !== state.currentGoalId).map(d => (
                <button
                  key={d.goalId}
                  onClick={() => swapGoal(d.goalId)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-secondary"
                >
                  <span className="text-[15px] text-foreground">{d.goalName}</span>
                  <span className="text-[13px] text-muted-foreground">{d.score.toFixed(3)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50" onClick={() => setShowEmergency(false)}>
          <div className="animate-modal-in w-full max-w-[360px] rounded-xl border border-border bg-card p-5 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] text-foreground">
              Skip today's sprint? You have {emergencyRemaining} emergency unlock{emergencyRemaining !== 1 ? 's' : ''} remaining this week.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowEmergency(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground hover:border-foreground/20 transition-colors"
              >Cancel</button>
              <button
                onClick={confirmEmergency}
                className="flex-1 rounded-lg bg-warning py-2.5 text-sm font-semibold text-warning-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
              >Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
