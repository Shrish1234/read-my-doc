export interface GoalWithMetrics {
  id: string;
  name: string;
  description: string;
  deadline: string;
  totalEstimatedHours: number;
  weeklyTargetHours: number;
  archived: boolean;
  allowed_sites: {
    categories: string[];
    customSites: string[];
  };
}

export interface SessionRecord {
  id: string;
  goalId: string;
  skillId: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  focusQuality: number | null;
  difficulty: number | null;
  movedForward: string;
  hesitation: string;
  nextStart: string;
}

export interface SkillRecord {
  id: string;
  goalId: string;
  name: string;
  recommendedAllocation: number;
}

export interface PaceMetrics {
  currentWeeklyPaceHours: number;
  remainingHours: number;
  remainingWeeks: number;
  requiredWeeklyPace: number;
  paceGap: number;
  completionProbability: number;
  trajectoryBand: 'Stable' | 'Fragile' | 'At Risk';
  projectedHoursByDeadline: number;
  totalLoggedHours: number;
}

export interface SkillAllocation {
  skillId: string;
  skillName: string;
  recommendedAllocation: number;
  actualAllocation: number;
  hoursLast14Days: number;
  isImbalanced: boolean;
  isStagnant: boolean;
}

export interface EnergyHourScore {
  hour: number;
  averageScore: number;
  sessionCount: number;
}

export interface SuggestedSession {
  goalId: string;
  goalName: string;
  skillId: string | null;
  skillName: string | null;
  suggestedDurationMinutes: number;
  reason: string;
  urgencyScore: number;
}

export interface RiskSnapshot {
  id: string;
  goalId: string;
  date: string;
  currentWeeklyPace: number;
  requiredWeeklyPace: number;
  paceGap: number;
  projectedHours: number;
  completionProbability: number;
  trajectoryBand: string;
}

export interface WeeklyReviewData {
  weekStart: string;
  totalSessions: number;
  totalHours: number;
  averageFocusQuality: number;
  goalSummaries: {
    goalId: string;
    goalName: string;
    hoursThisWeek: number;
    targetHours: number;
    paceGap: number;
    trajectoryBand: string;
    bandChange: string | null;
  }[];
  skillNotes: string[];
  recommendations: string[];
  memoText: string;
}

export const SKILL_TEMPLATES: Record<string, { label: string; skills: { name: string; allocation: number }[] }> = {
  'software-project': {
    label: 'Software Project',
    skills: [
      { name: 'Architecture & Design', allocation: 0.2 },
      { name: 'Implementation', allocation: 0.4 },
      { name: 'Testing', allocation: 0.15 },
      { name: 'Documentation', allocation: 0.1 },
      { name: 'DevOps & Deployment', allocation: 0.15 },
    ],
  },
  'academic-course': {
    label: 'Academic Course',
    skills: [
      { name: 'Lectures & Reading', allocation: 0.3 },
      { name: 'Problem Sets', allocation: 0.3 },
      { name: 'Projects', allocation: 0.25 },
      { name: 'Exam Prep', allocation: 0.15 },
    ],
  },
  'startup-launch': {
    label: 'Startup Launch',
    skills: [
      { name: 'Product Development', allocation: 0.35 },
      { name: 'Customer Research', allocation: 0.2 },
      { name: 'Pitch & Fundraising', allocation: 0.2 },
      { name: 'Operations', allocation: 0.15 },
      { name: 'Marketing', allocation: 0.1 },
    ],
  },
  'research-paper': {
    label: 'Research Paper',
    skills: [
      { name: 'Literature Review', allocation: 0.25 },
      { name: 'Methodology', allocation: 0.2 },
      { name: 'Data Collection', allocation: 0.2 },
      { name: 'Analysis', allocation: 0.2 },
      { name: 'Writing', allocation: 0.15 },
    ],
  },
};
