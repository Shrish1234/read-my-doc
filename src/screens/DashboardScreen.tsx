import { useState } from 'react';
import { useFocus } from '@/context/FocusContext';
import { GoalHealthBar } from '@/components/GoalHealthBar';
import { Check } from 'lucide-react';

export function DashboardScreen() {
  const { state } = useFocus();
  const [showAll, setShowAll] = useState(false);

  const todaySessions = state.sessions.filter(
    s => s.date === new Date().toISOString().split('T')[0]
  );
  const latestToday = todaySessions[todaySessions.length - 1];
  const todayGoal = latestToday ? state.goals.find(g => g.id === latestToday.goalId) : null;

  const sortedSessions = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const displaySessions = showAll ? sortedSessions : sortedSessions.slice(0, 5);

  const getGoalName = (goalId: string) => state.goals.find(g => g.id === goalId)?.name ?? 'Unknown';

  return (
    <div className="animate-fade-in mx-auto max-w-[640px] px-5 py-10">
      {/* Today's Summary */}
      {latestToday && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-success">
              <Check size={10} className="text-success-foreground" />
            </div>
            <span className="text-[15px] text-foreground">Today's sprint complete</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {todayGoal?.name} — {latestToday.durationMinutes} min
          </p>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">
            {latestToday.completionNote}
          </p>
        </div>
      )}

      {/* Goal Health */}
      <div className="mt-8">
        <div className="section-label mb-5">YOUR GOALS THIS WEEK</div>
        <div className="space-y-5">
          {state.driftScores.map(d => (
            <GoalHealthBar key={d.goalId} drift={d} isActive={d.goalId === state.currentGoalId} />
          ))}
        </div>
      </div>

      {/* Sprint History */}
      <div className="mt-8">
        <div className="section-label mb-5">RECENT SPRINTS</div>
        <div className="space-y-4">
          {displaySessions.map(s => (
            <div key={s.id} className="border-b border-border pb-4 last:border-0">
              <p className="text-[13px] text-muted-foreground">
                {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <p className="mt-1 text-[15px] text-foreground">
                {getGoalName(s.goalId)} ({s.durationMinutes} min)
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                "{s.completionNote}"
              </p>
              <p className="mt-0.5 text-sm" style={{ color: 'hsl(240 12% 56%)' }}>
                → Next: "{s.nextStartingPoint}"
              </p>
            </div>
          ))}
        </div>
        {sortedSessions.length > 5 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            View all
          </button>
        )}
      </div>
    </div>
  );
}
