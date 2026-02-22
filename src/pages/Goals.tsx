import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFocus } from '@/context/FocusContext';
import { computeFullPaceMetrics } from '@/lib/analytics';
import { TrajectoryBadge } from '@/components/TrajectoryBadge';
import { PaceBar } from '@/components/PaceBar';

export default function GoalsPage() {
  const { state } = useFocus();
  const activeGoals = state.goals.filter(g => !g.archived);

  const goalMetrics = useMemo(() =>
    activeGoals.map(g => ({ goal: g, metrics: computeFullPaceMetrics(g, state.sessions) })),
    [activeGoals, state.sessions]
  );

  return (
    <div className="animate-fade-in mx-auto max-w-content px-8 py-8 space-y-8">
      <h1 className="page-title">Goals</h1>

      <div className="space-y-4">
        {goalMetrics.map(({ goal, metrics }) => {
          const daysRemaining = Math.round(metrics.remainingWeeks * 7);
          const goalSessions = state.sessions.filter(s => s.goalId === goal.id);
          const goalSkills = state.skills.filter(sk => sk.goalId === goal.id);

          return (
            <Link key={goal.id} to={`/goals/${goal.id}`} className="focus-card block">
              <div className="flex items-start justify-between">
                <div>
                  <p className="card-title">{goal.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Due {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {daysRemaining} days remaining
                  </p>
                </div>
                <TrajectoryBadge band={metrics.trajectoryBand} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <span className="section-label">Current pace</span>
                  <p className="mt-1 font-mono-calc text-foreground">{metrics.currentWeeklyPaceHours.toFixed(1)} hrs/wk</p>
                </div>
                <div>
                  <span className="section-label">Required</span>
                  <p className="mt-1 font-mono-calc text-foreground">{metrics.requiredWeeklyPace.toFixed(1)} hrs/wk</p>
                </div>
                <div>
                  <span className="section-label">Probability</span>
                  <p className="mt-1 font-mono-calc text-foreground">{Math.round(metrics.completionProbability * 100)}%</p>
                </div>
                <div>
                  <span className="section-label">Sessions</span>
                  <p className="mt-1 font-mono-calc text-foreground">{goalSessions.length} · {metrics.totalLoggedHours.toFixed(1)} hrs</p>
                </div>
              </div>

              <div className="mt-3">
                <PaceBar current={metrics.currentWeeklyPaceHours} required={metrics.requiredWeeklyPace} target={goal.weeklyTargetHours} band={metrics.trajectoryBand} />
              </div>

              {goalSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {goalSkills.map(sk => (
                    <span key={sk.id} className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">{sk.name}</span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
