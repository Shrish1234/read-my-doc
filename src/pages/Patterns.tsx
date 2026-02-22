import { useMemo } from 'react';
import { useFocus } from '@/context/FocusContext';
import { calculateEnergyScores, calculateSkillAllocations, computeFullPaceMetrics } from '@/lib/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6AM-10PM

export default function PatternsPage() {
  const { state } = useFocus();

  const energyScores = useMemo(() => calculateEnergyScores(state.sessions), [state.sessions]);

  // Build heatmap data: group sessions by dayOfWeek + hour
  const heatmapData = useMemo(() => {
    const grid: Record<string, { total: number; count: number }> = {};
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const s of state.sessions) {
      if (new Date(s.startTime) < cutoff || !s.focusQuality) continue;
      const d = new Date(s.startTime);
      const day = (d.getDay() + 6) % 7; // Mon=0
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      if (!grid[key]) grid[key] = { total: 0, count: 0 };
      grid[key].total += s.focusQuality * Math.min(1, s.durationMinutes / 25);
      grid[key].count += 1;
    }

    return grid;
  }, [state.sessions]);

  // Peak hours
  const peakHours = useMemo(() => {
    const topScores = energyScores.filter(e => e.sessionCount > 0).sort((a, b) => b.averageScore - a.averageScore).slice(0, 3);
    return topScores.map(e => `${e.hour}:00`).join(', ');
  }, [energyScores]);

  // Skill health alerts
  const skillAlerts = useMemo(() => {
    const alerts: { goalName: string; skillName: string; type: string; goalId: string; skillId: string }[] = [];
    for (const g of state.goals.filter(g => !g.archived)) {
      const metrics = computeFullPaceMetrics(g, state.sessions);
      const goalSkills = state.skills.filter(sk => sk.goalId === g.id);
      const allocations = calculateSkillAllocations(goalSkills, state.sessions, g.id, metrics.trajectoryBand, g.deadline);
      for (const a of allocations) {
        if (a.isStagnant) alerts.push({ goalName: g.name, skillName: a.skillName, type: 'stagnant', goalId: g.id, skillId: a.skillId });
        if (a.isImbalanced) alerts.push({ goalName: g.name, skillName: a.skillName, type: 'imbalanced', goalId: g.id, skillId: a.skillId });
      }
    }
    return alerts;
  }, [state.goals, state.sessions, state.skills]);

  // Weekly focus quality trend
  const weeklyFocusTrend = useMemo(() => {
    const weeks: { label: string; avg: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const weekSessions = state.sessions.filter(s => {
        const d = new Date(s.startTime);
        return d >= weekStart && d < weekEnd && s.focusQuality;
      });
      const avg = weekSessions.length > 0
        ? Math.round(weekSessions.reduce((sum, s) => sum + (s.focusQuality ?? 0), 0) / weekSessions.length * 10) / 10
        : 0;
      weeks.push({
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avg,
      });
    }
    return weeks;
  }, [state.sessions]);

  if (state.sessions.length < 5) {
    return (
      <div className="mx-auto max-w-content px-8 py-8">
        <h1 className="page-title mb-6">Patterns</h1>
        <div className="focus-card text-center py-12">
          <p className="text-sm text-muted-foreground">Log at least 5 sessions to start seeing patterns.</p>
        </div>
      </div>
    );
  }

  const getHeatColor = (score: number): string => {
    if (score === 0) return 'hsl(var(--background))';
    if (score < 2) return '#E0E7FF';
    if (score < 3.5) return '#818CF8';
    return '#16A34A';
  };

  return (
    <div className="animate-fade-in mx-auto max-w-content px-8 py-8 space-y-8">
      <h1 className="page-title">Patterns</h1>

      {/* Energy Heatmap */}
      <div className="focus-card">
        <div className="section-label mb-4">ENERGY HEATMAP</div>
        <div className="overflow-x-auto">
          <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(7, 1fr)`, minWidth: 400 }}>
            <div />
            {DAYS.map(d => <div key={d} className="text-center text-xs text-muted-foreground">{d}</div>)}
            {HOURS.map(h => (
              <>
                <div key={`h-${h}`} className="text-right text-xs text-muted-foreground pr-2 leading-6">
                  {h > 12 ? h - 12 : h}{h >= 12 ? 'PM' : 'AM'}
                </div>
                {Array.from({ length: 7 }, (_, day) => {
                  const key = `${day}-${h}`;
                  const data = heatmapData[key];
                  const score = data ? data.total / data.count : 0;
                  return (
                    <div
                      key={`${day}-${h}`}
                      className="h-6 rounded-sm border border-border/50"
                      style={{ backgroundColor: getHeatColor(score) }}
                      title={data ? `${DAYS[day]} ${h}:00 — avg focus ${score.toFixed(1)}, ${data.count} sessions` : `${DAYS[day]} ${h}:00 — no data`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
        {peakHours && (
          <p className="mt-4 text-sm text-muted-foreground">
            Your peak focus hours are <span className="font-medium text-foreground">{peakHours}</span>. Consider scheduling demanding sessions in this window.
          </p>
        )}
      </div>

      {/* Skill Health Alerts */}
      {skillAlerts.length > 0 && (
        <div className="focus-card">
          <div className="section-label mb-4">SKILL HEALTH ALERTS</div>
          <div className="space-y-2">
            {skillAlerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">
                  <span className={a.type === 'stagnant' ? 'text-[#DC2626]' : 'text-[#D97706]'}>
                    {a.type === 'stagnant' ? '⚠' : '◐'}
                  </span>{' '}
                  {a.skillName} ({a.goalName}) — {a.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus Quality Trend */}
      <div className="focus-card">
        <div className="section-label mb-4">FOCUS QUALITY TREND</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyFocusTrend}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#78716C' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#78716C' }} />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: '#6366F1' }} name="Avg Focus" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
