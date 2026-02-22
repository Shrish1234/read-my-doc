import { DriftScore } from '@/context/FocusContext';

interface GoalHealthBarProps {
  drift: DriftScore;
  isActive: boolean;
}

export function GoalHealthBar({ drift, isActive }: GoalHealthBarProps) {
  const pct = Math.min(100, Math.max(0, (drift.hoursCompletedThisWeek / drift.weeklyTarget) * 100));

  const fillColor = pct >= 70
    ? 'bg-success'
    : pct >= 40
      ? 'bg-warning'
      : 'bg-destructive';

  return (
    <div className={`${isActive ? 'border-l-[3px] border-l-primary pl-3' : ''}`}>
      <div className="flex items-baseline justify-between">
        <span className={`text-base ${isActive ? 'text-foreground' : 'text-foreground/75'}`}>
          {drift.goalName}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {drift.hoursCompletedThisWeek} / {drift.weeklyTarget} hrs
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full ${fillColor} transition-all duration-500 ease-in-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
