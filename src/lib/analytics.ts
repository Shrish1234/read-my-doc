import {
  GoalWithMetrics, SessionRecord, SkillRecord,
  PaceMetrics, SkillAllocation, EnergyHourScore, SuggestedSession, WeeklyReviewData
} from './types';

export function calculateWeeklyPace(sessions: SessionRecord[], goalId: string, asOfDate?: Date): number {
  const now = asOfDate || new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const hours = sessions
    .filter(s => s.goalId === goalId && new Date(s.startTime) >= weekAgo && new Date(s.startTime) <= now)
    .reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
  return Math.round(hours * 100) / 100;
}

export function calculateTotalLoggedHours(sessions: SessionRecord[], goalId: string): number {
  return sessions
    .filter(s => s.goalId === goalId)
    .reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
}

export function calculateRemainingHours(totalEstimated: number, totalLogged: number): number {
  return Math.max(0, totalEstimated - totalLogged);
}

export function calculateRemainingWeeks(deadline: string, asOfDate?: Date): number {
  const now = asOfDate || new Date();
  const dl = new Date(deadline);
  const days = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0.1, days / 7);
}

export function calculateRequiredPace(remainingHours: number, remainingWeeks: number): number {
  return remainingHours / remainingWeeks;
}

export function calculatePaceGap(requiredPace: number, currentPace: number): number {
  return requiredPace - currentPace;
}

export function calculateCompletionProbability(currentPace: number, remainingHours: number, remainingWeeks: number): number {
  if (remainingHours <= 0) return 1;
  const projected = currentPace * remainingWeeks;
  return Math.min(1, Math.max(0, projected / remainingHours));
}

export function getTrajectoryBand(paceGap: number): 'Stable' | 'Fragile' | 'At Risk' {
  if (paceGap <= 0) return 'Stable';
  if (paceGap <= 1.5) return 'Fragile';
  return 'At Risk';
}

export function computeFullPaceMetrics(goal: GoalWithMetrics, sessions: SessionRecord[]): PaceMetrics {
  const currentWeeklyPaceHours = calculateWeeklyPace(sessions, goal.id);
  const totalLoggedHours = calculateTotalLoggedHours(sessions, goal.id);
  const remainingHours = calculateRemainingHours(goal.totalEstimatedHours, totalLoggedHours);
  const remainingWeeks = calculateRemainingWeeks(goal.deadline);
  const requiredWeeklyPace = calculateRequiredPace(remainingHours, remainingWeeks);
  const paceGap = calculatePaceGap(requiredWeeklyPace, currentWeeklyPaceHours);
  const completionProbability = calculateCompletionProbability(currentWeeklyPaceHours, remainingHours, remainingWeeks);
  const trajectoryBand = getTrajectoryBand(paceGap);
  const projectedHoursByDeadline = totalLoggedHours + currentWeeklyPaceHours * remainingWeeks;

  return {
    currentWeeklyPaceHours,
    remainingHours,
    remainingWeeks,
    requiredWeeklyPace,
    paceGap,
    completionProbability,
    trajectoryBand,
    projectedHoursByDeadline,
    totalLoggedHours,
  };
}

export function calculateSkillAllocations(
  skills: SkillRecord[], sessions: SessionRecord[], goalId: string,
  trajectoryBand: string, deadline: string, lookbackDays = 14
): SkillAllocation[] {
  const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const daysToDeadline = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const recentSessions = sessions.filter(
    s => s.goalId === goalId && new Date(s.startTime) >= cutoff
  );
  const totalGoalHours = recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;

  return skills.filter(sk => sk.goalId === goalId).map(sk => {
    const skillHours = recentSessions
      .filter(s => s.skillId === sk.id)
      .reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    const actualAllocation = totalGoalHours > 0 ? skillHours / totalGoalHours : 0;
    return {
      skillId: sk.id,
      skillName: sk.name,
      recommendedAllocation: sk.recommendedAllocation,
      actualAllocation,
      hoursLast14Days: skillHours,
      isImbalanced: Math.abs(actualAllocation - sk.recommendedAllocation) > 0.15,
      isStagnant: skillHours < 0.5 && trajectoryBand !== 'Stable' && daysToDeadline < 60,
    };
  });
}

export function calculateEnergyScores(sessions: SessionRecord[], lookbackDays = 30): EnergyHourScore[] {
  const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
  const recent = sessions.filter(s => new Date(s.startTime) >= cutoff && s.focusQuality != null);

  const buckets: Record<number, { total: number; count: number }> = {};
  for (let h = 0; h < 24; h++) buckets[h] = { total: 0, count: 0 };

  for (const s of recent) {
    const hour = new Date(s.startTime).getHours();
    const score = (s.focusQuality ?? 0) * Math.min(1, s.durationMinutes / 25);
    buckets[hour].total += score;
    buckets[hour].count += 1;
  }

  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    averageScore: buckets[h].count > 0 ? buckets[h].total / buckets[h].count : 0,
    sessionCount: buckets[h].count,
  }));
}

export function getSuggestedSession(
  goals: GoalWithMetrics[], sessions: SessionRecord[], skills: SkillRecord[]
): SuggestedSession | null {
  const activeGoals = goals.filter(g => !g.archived);
  if (activeGoals.length === 0) return null;

  let best: { goal: GoalWithMetrics; metrics: PaceMetrics; urgency: number } | null = null;

  for (const goal of activeGoals) {
    const metrics = computeFullPaceMetrics(goal, sessions);
    const daysToDeadline = Math.max(1, metrics.remainingWeeks * 7);
    const urgency = (Math.max(0, metrics.paceGap) / Math.max(1, metrics.requiredWeeklyPace)) * (1 / Math.max(1, daysToDeadline));
    if (!best || urgency > best.urgency) {
      best = { goal, metrics, urgency };
    }
  }

  if (!best) return null;

  const goalSkills = skills.filter(sk => sk.goalId === best!.goal.id);
  let skillId: string | null = null;
  let skillName: string | null = null;

  if (goalSkills.length > 0) {
    const allocations = calculateSkillAllocations(goalSkills, sessions, best.goal.id, best.metrics.trajectoryBand, best.goal.deadline);
    const mostNeeded = allocations.sort((a, b) => (b.recommendedAllocation - b.actualAllocation) - (a.recommendedAllocation - a.actualAllocation))[0];
    if (mostNeeded) {
      skillId = mostNeeded.skillId;
      skillName = mostNeeded.skillName;
    }
  }

  const duration = best.metrics.trajectoryBand === 'Stable' ? 25 : best.metrics.trajectoryBand === 'Fragile' ? 35 : 45;
  const daysToDeadline = Math.round(best.metrics.remainingWeeks * 7);
  const reason = `${best.goal.name} is ${best.metrics.paceGap.toFixed(1)} hours behind pace with ${daysToDeadline} days remaining.${skillName ? ` ${skillName} has been neglected this cycle.` : ''}`;

  return {
    goalId: best.goal.id,
    goalName: best.goal.name,
    skillId,
    skillName,
    suggestedDurationMinutes: duration,
    reason,
    urgencyScore: best.urgency,
  };
}

export function buildWeeklyReview(
  goals: GoalWithMetrics[], sessions: SessionRecord[], skills: SkillRecord[],
  previousSnapshots: any[], weekStartDate: Date
): WeeklyReviewData {
  const weekEnd = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.startTime);
    return d >= weekStartDate && d < weekEnd;
  });

  const totalSessions = weekSessions.length;
  const totalHours = Math.round(weekSessions.reduce((s, r) => s + r.durationMinutes, 0) / 60 * 10) / 10;
  const qualityValues = weekSessions.filter(s => s.focusQuality != null).map(s => s.focusQuality!);
  const averageFocusQuality = qualityValues.length > 0 ? Math.round(qualityValues.reduce((a, b) => a + b, 0) / qualityValues.length * 10) / 10 : 0;

  const goalSummaries = goals.filter(g => !g.archived).map(g => {
    const metrics = computeFullPaceMetrics(g, sessions);
    const goalWeekSessions = weekSessions.filter(s => s.goalId === g.id);
    const hoursThisWeek = Math.round(goalWeekSessions.reduce((s, r) => s + r.durationMinutes, 0) / 60 * 10) / 10;
    const prevSnap = previousSnapshots.find((s: any) => s.goalId === g.id);
    const bandChange = prevSnap && prevSnap.trajectoryBand !== metrics.trajectoryBand
      ? `${prevSnap.trajectoryBand} → ${metrics.trajectoryBand}` : null;

    return {
      goalId: g.id,
      goalName: g.name,
      hoursThisWeek,
      targetHours: g.weeklyTargetHours,
      paceGap: Math.round(metrics.paceGap * 10) / 10,
      trajectoryBand: metrics.trajectoryBand,
      bandChange,
    };
  });

  const skillNotes: string[] = [];
  const recommendations: string[] = [];

  for (const g of goals.filter(g => !g.archived)) {
    const metrics = computeFullPaceMetrics(g, sessions);
    const goalSkills = skills.filter(sk => sk.goalId === g.id);
    const allocations = calculateSkillAllocations(goalSkills, sessions, g.id, metrics.trajectoryBand, g.deadline);
    for (const a of allocations) {
      if (a.isStagnant) skillNotes.push(`${a.skillName} (${g.name}) is stagnant — no sessions in 14 days.`);
      if (a.isImbalanced) skillNotes.push(`${a.skillName} (${g.name}) allocation is off by ${Math.round(Math.abs(a.actualAllocation - a.recommendedAllocation) * 100)}%.`);
    }
    if (metrics.trajectoryBand === 'At Risk') {
      recommendations.push(`Increase ${g.name} effort by ${metrics.paceGap.toFixed(1)} hrs/week to get back on track.`);
    }
  }

  const dateRange = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekEnd.getTime() - 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  let memoText = `## Weekly Review — ${dateRange}\n\n`;
  memoText += `**Summary:** ${totalSessions} sessions · ${totalHours} hours · avg focus ${averageFocusQuality}/5\n\n`;

  for (const gs of goalSummaries) {
    memoText += `**${gs.goalName}:** ${gs.hoursThisWeek} / ${gs.targetHours} hrs · ${gs.trajectoryBand}`;
    if (gs.bandChange) memoText += ` (${gs.bandChange})`;
    memoText += '\n';
    memoText += gs.paceGap > 0 ? `Behind pace by ${gs.paceGap} hrs.` : 'On pace.';
    const prob = goalSummaries.find(x => x.goalId === gs.goalId);
    memoText += ` Probability: ${Math.round(computeFullPaceMetrics(goals.find(g => g.id === gs.goalId)!, sessions).completionProbability * 100)}%.\n\n`;
  }

  if (skillNotes.length > 0) memoText += `**Skill Alert:** ${skillNotes.join(' ')}\n\n`;
  if (recommendations.length > 0) memoText += `**Recommendation:** ${recommendations.join(' ')}\n`;

  return { weekStart: weekStartDate.toISOString(), totalSessions, totalHours, averageFocusQuality, goalSummaries, skillNotes, recommendations, memoText };
}
