import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFocus } from '@/context/FocusContext';
import { computeFullPaceMetrics, getSuggestedSession } from '@/lib/analytics';
import { TrajectoryBadge } from '@/components/TrajectoryBadge';
import { PaceBar } from '@/components/PaceBar';
import { StarRating } from '@/components/StarRating';
import { SessionTimerModal } from '@/components/SessionTimerModal';

export default function TodayPage() {
  const { state } = useFocus();
  const [showTimer, setShowTimer] = useState(false);

  const activeGoals = state.goals.filter(g => !g.archived);

  const goalMetrics = useMemo(() =>
    activeGoals.map(g => ({ goal: g, metrics: computeFullPaceMetrics(g, state.sessions) })),
    [activeGoals, state.sessions]
  );

  const suggestion = useMemo(() =>
    getSuggestedSession(state.goals, state.sessions, state.skills),
    [state.goals, state.sessions, state.skills]
  );

  const lastSession = useMemo(() => {
    const sorted = [...state.sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return sorted[0] ?? null;
  }, [state.sessions]);

  const lastSessionGoal = lastSession ? state.goals.find(g => g.id === lastSession.goalId) : null;

  // Strategic memo — find most urgent goal
  const urgentGoalData = useMemo(() => {
    if (goalMetrics.length === 0) return null;
    const sorted = [...goalMetrics].sort((a, b) => b.metrics.paceGap - a.metrics.paceGap);
    const { goal, metrics } = sorted[0];
    const days = Math.round(metrics.remainingWeeks * 7);
    const focusLine = suggestion
      ? `Focus ${suggestion.suggestedDurationMinutes} min on ${suggestion.goalName}${suggestion.skillName ? ` → ${suggestion.skillName}` : ''}`
      : `Stay on track with ${goal.name}`;
    return { goal, metrics, days, focusLine };
  }, [goalMetrics, suggestion]);

  if (activeGoals.length === 0) {
    return (
      <div className="mx-auto max-w-content px-8 py-12">
        <div className="focus-card text-center py-16">
          <p className="text-lg text-foreground">Set up your first goal to get started</p>
          <Link to="/onboarding" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Go to onboarding →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-content px-8 py-8 space-y-8">
      <h1 className="page-title">Today</h1>

      {/* Strategic Memo — Cockpit Card */}
      {urgentGoalData && (
        <div className="focus-card">
          <div className="section-label mb-3">STRATEGIC MEMO</div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-foreground leading-tight">{urgentGoalData.goal.name}</h2>
            <TrajectoryBadge band={urgentGoalData.metrics.trajectoryBand} />
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex-1 rounded-lg bg-accent px-3 py-2">
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Pace Gap</span>
              <span className="block text-base font-bold text-foreground mt-0.5 font-mono-calc">
                {urgentGoalData.metrics.paceGap > 0 ? `−${urgentGoalData.metrics.paceGap.toFixed(1)} hrs` : 'On pace'}
              </span>
            </div>
            <div className="flex-1 rounded-lg bg-accent px-3 py-2">
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Days Left</span>
              <span className="block text-base font-bold text-foreground mt-0.5 font-mono-calc">{urgentGoalData.days}</span>
            </div>
            <div className="flex-1 rounded-lg bg-accent px-3 py-2">
              <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Probability</span>
              <span className="block text-base font-bold text-foreground mt-0.5 font-mono-calc">{Math.round(urgentGoalData.metrics.completionProbability * 100)}%</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground truncate">{urgentGoalData.focusLine}</p>
        </div>
      )}

      {/* Suggested Focus Session */}
      {suggestion && (
        <div className="focus-card">
          <div className="section-label mb-3">SUGGESTED FOCUS SESSION</div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="card-title">{suggestion.goalName}{suggestion.skillName ? ` → ${suggestion.skillName}` : ''}</p>
              <p className="mt-1 font-mono-calc text-muted-foreground">{suggestion.suggestedDurationMinutes} minutes</p>
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.reason}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowTimer(true)}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ borderRadius: 8 }}
            >
              Start This Session
            </button>
          </div>
        </div>
      )}

      {/* Last Reflection */}
      {lastSession && (
        <div className="focus-card">
          <div className="section-label mb-3">LAST REFLECTION</div>
          <p className="card-title">{lastSessionGoal?.name ?? 'Unknown'}</p>
          <div className="mt-3 space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Moved forward:</span>
              <p className="text-sm text-foreground">{lastSession.movedForward}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Next starting point:</span>
              <p className="text-sm text-foreground">{lastSession.nextStart}</p>
            </div>
            {lastSession.focusQuality && (
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Focus:</span>
                  <StarRating value={lastSession.focusQuality} readonly size={14} />
                </div>
                {lastSession.difficulty && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Difficulty:</span>
                    <StarRating value={lastSession.difficulty} readonly size={14} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {state.sessions.length === 0 && (
        <div className="focus-card text-center py-8">
          <p className="text-sm text-muted-foreground">No sessions yet. Start your first focus session above.</p>
        </div>
      )}

      {/* Goal Quick Status */}
      <div>
        <div className="section-label mb-4">GOAL STATUS</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {goalMetrics.map(({ goal, metrics }) => (
            <Link key={goal.id} to={`/goals/${goal.id}`} className="focus-card block">
              <div className="flex items-start justify-between">
                <p className="card-title">{goal.name}</p>
                <TrajectoryBadge band={metrics.trajectoryBand} size="sm" />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="font-mono-calc">{metrics.currentWeeklyPaceHours.toFixed(1)} / {goal.weeklyTargetHours} hrs</span>
                <span className="font-mono-calc text-muted-foreground">{Math.round(metrics.completionProbability * 100)}%</span>
              </div>
              <div className="mt-2">
                <PaceBar current={metrics.currentWeeklyPaceHours} required={metrics.requiredWeeklyPace} target={goal.weeklyTargetHours} band={metrics.trajectoryBand} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showTimer && suggestion && (
        <SessionTimerModal
          goalId={suggestion.goalId}
          skillId={suggestion.skillId}
          durationMinutes={suggestion.suggestedDurationMinutes}
          onClose={() => setShowTimer(false)}
          onComplete={() => setShowTimer(false)}
        />
      )}
    </div>
  );
}
