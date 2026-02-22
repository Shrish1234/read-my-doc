import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFocus } from '@/context/FocusContext';
import { computeFullPaceMetrics, calculateSkillAllocations } from '@/lib/analytics';
import { TrajectoryBadge } from '@/components/TrajectoryBadge';
import { StarRating } from '@/components/StarRating';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useFocus();
  const [whatIfSlider, setWhatIfSlider] = useState(0);

  const goal = state.goals.find(g => g.id === id);
  if (!goal) return <div className="mx-auto max-w-content px-8 py-8"><p>Goal not found.</p></div>;

  const metrics = computeFullPaceMetrics(goal, state.sessions);
  const goalSkills = state.skills.filter(sk => sk.goalId === goal.id);
  const allocations = calculateSkillAllocations(goalSkills, state.sessions, goal.id, metrics.trajectoryBand, goal.deadline);
  const goalSessions = [...state.sessions.filter(s => s.goalId === goal.id)].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const recentSessions = goalSessions.slice(0, 5);

  // What-if calculation
  const newPace = metrics.currentWeeklyPaceHours + whatIfSlider;
  const newProjected = newPace * metrics.remainingWeeks;
  const newProbability = Math.min(1, Math.max(0, metrics.remainingHours > 0 ? newProjected / metrics.remainingHours : 1));
  const probDelta = Math.round((newProbability - metrics.completionProbability) * 100);

  // Risk trend chart data
  const riskData = state.riskSnapshots
    .filter(rs => rs.goalId === goal.id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(rs => ({
      date: new Date(rs.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      probability: Math.round(rs.completionProbability * 100),
    }));

  return (
    <div className="animate-fade-in mx-auto max-w-content px-8 py-8 space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/goals" className="hover:text-foreground transition-colors">Goals</Link>
        <span>/</span>
        <span className="text-foreground">{goal.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <h1 className="page-title">{goal.name}</h1>
        <TrajectoryBadge band={metrics.trajectoryBand} />
      </div>

      {/* Pace & Trajectory */}
      <div className="focus-card">
        <div className="section-label mb-4">PACE & TRAJECTORY</div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <span className="text-xs text-muted-foreground">Current pace</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{metrics.currentWeeklyPaceHours.toFixed(1)} hrs/wk</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Required pace</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{metrics.requiredWeeklyPace.toFixed(1)} hrs/wk</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Pace gap</span>
            <p className={`mt-0.5 font-mono-calc ${metrics.paceGap > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
              {metrics.paceGap > 0 ? '+' : ''}{metrics.paceGap.toFixed(1)} hrs
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Probability</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{Math.round(metrics.completionProbability * 100)}%</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Total logged</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{metrics.totalLoggedHours.toFixed(1)} hrs</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Remaining</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{metrics.remainingHours.toFixed(1)} hrs</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Weeks left</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{metrics.remainingWeeks.toFixed(1)}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Projected total</span>
            <p className="mt-0.5 font-mono-calc text-foreground">{metrics.projectedHoursByDeadline.toFixed(1)} hrs</p>
          </div>
        </div>

        {/* What-if slider */}
        <div className="mt-6 border-t border-border pt-5">
          <div className="section-label mb-3">WHAT-IF ANALYSIS</div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={whatIfSlider}
            onChange={e => setWhatIfSlider(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="mt-2 font-mono-calc text-sm">
            At +{whatIfSlider} hrs/week → {Math.round(newProbability * 100)}% probability
            {probDelta !== 0 && <span className="text-[#16A34A]"> (+{probDelta}%)</span>}
          </p>
        </div>
      </div>

      {/* Skill Allocation */}
      {allocations.length > 0 && (
        <div className="focus-card">
          <div className="section-label mb-4">SKILL ALLOCATION</div>
          <div className="space-y-4">
            {allocations.map(a => (
              <div key={a.skillId}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{a.skillName}</span>
                  <span className="font-mono-calc text-muted-foreground">
                    {Math.round(a.actualAllocation * 100)}% / {Math.round(a.recommendedAllocation * 100)}%
                  </span>
                </div>
                <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full ${a.isImbalanced ? 'bg-[#DC2626]' : 'bg-[#16A34A]'}`}
                    style={{ width: `${Math.min(100, a.actualAllocation * 100)}%`, transition: 'width 500ms ease' }}
                  />
                  {/* recommended marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/40"
                    style={{ left: `${a.recommendedAllocation * 100}%` }}
                  />
                </div>
                {a.isStagnant && (
                  <p className="mt-1 text-xs text-[#DC2626]">⚠ Stagnant — no sessions in 14 days</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Trend */}
      {riskData.length > 1 && (
        <div className="focus-card">
          <div className="section-label mb-4">RISK TREND</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskData}>
                <ReferenceArea y1={0} y2={40} fill="#fef2f2" />
                <ReferenceArea y1={40} y2={70} fill="#fffbeb" />
                <ReferenceArea y1={70} y2={100} fill="#f0fdf4" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716C' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#78716C' }} />
                <Tooltip />
                <Line type="monotone" dataKey="probability" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: '#6366F1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="focus-card">
        <div className="section-label mb-4">SESSION HISTORY</div>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions logged for this goal yet.</p>
        ) : (
          <div className="space-y-4">
            {recentSessions.map(s => {
              const skill = state.skills.find(sk => sk.id === s.skillId);
              return (
                <div key={s.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(s.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {skill && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">{skill.name}</span>}
                    </div>
                    <span className="font-mono-calc text-sm text-muted-foreground">{s.durationMinutes} min</span>
                  </div>
                  {s.focusQuality && (
                    <div className="mt-1"><StarRating value={s.focusQuality} readonly size={12} /></div>
                  )}
                  <p className="mt-1 text-sm text-foreground">{s.movedForward}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">→ Next: {s.nextStart}</p>
                </div>
              );
            })}
          </div>
        )}
        {goalSessions.length > 5 && (
          <Link to={`/sessions?goalId=${goal.id}`} className="mt-3 inline-block text-sm text-primary hover:underline">
            View all →
          </Link>
        )}
      </div>
    </div>
  );
}
