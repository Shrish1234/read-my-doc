import { GoalWithMetrics, SessionRecord, SkillRecord, RiskSnapshot } from './types';

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function endTime(start: string, mins: number): string {
  return new Date(new Date(start).getTime() + mins * 60000).toISOString();
}

export const DEMO_GOALS: GoalWithMetrics[] = [
  {
    id: 'g1',
    name: 'Ship Career OS MVP',
    description: 'Build and launch the career planning platform',
    deadline: '2026-03-31',
    totalEstimatedHours: 120,
    weeklyTargetHours: 10,
    archived: false,
    allowed_sites: { categories: ['Development', 'Docs'], customSites: ['github.com', 'vercel.com'] },
  },
  {
    id: 'g2',
    name: 'NLP Research Paper',
    description: 'Complete discourse analysis paper for conference submission',
    deadline: '2026-03-15',
    totalEstimatedHours: 60,
    weeklyTargetHours: 6,
    archived: false,
    allowed_sites: { categories: ['Research', 'Learning'], customSites: ['scholar.google.com'] },
  },
  {
    id: 'g3',
    name: 'Echo Pitch Deck',
    description: 'Prepare investor pitch deck for seed round',
    deadline: '2026-04-15',
    totalEstimatedHours: 30,
    weeklyTargetHours: 3,
    archived: false,
    allowed_sites: { categories: ['Design', 'Communication'], customSites: ['pitch.com'] },
  },
];

export const DEMO_SKILLS: SkillRecord[] = [
  { id: 'sk1', goalId: 'g1', name: 'Architecture & Design', recommendedAllocation: 0.2 },
  { id: 'sk2', goalId: 'g1', name: 'Implementation', recommendedAllocation: 0.4 },
  { id: 'sk3', goalId: 'g1', name: 'Testing', recommendedAllocation: 0.15 },
  { id: 'sk4', goalId: 'g1', name: 'Documentation', recommendedAllocation: 0.1 },
  { id: 'sk5', goalId: 'g1', name: 'DevOps & Deployment', recommendedAllocation: 0.15 },
  { id: 'sk6', goalId: 'g2', name: 'Literature Review', recommendedAllocation: 0.25 },
  { id: 'sk7', goalId: 'g2', name: 'Methodology', recommendedAllocation: 0.2 },
  { id: 'sk8', goalId: 'g2', name: 'Data Collection', recommendedAllocation: 0.2 },
  { id: 'sk9', goalId: 'g2', name: 'Analysis', recommendedAllocation: 0.2 },
  { id: 'sk10', goalId: 'g2', name: 'Writing', recommendedAllocation: 0.15 },
  { id: 'sk11', goalId: 'g3', name: 'Product Development', recommendedAllocation: 0.35 },
  { id: 'sk12', goalId: 'g3', name: 'Customer Research', recommendedAllocation: 0.2 },
  { id: 'sk13', goalId: 'g3', name: 'Pitch & Fundraising', recommendedAllocation: 0.3 },
  { id: 'sk14', goalId: 'g3', name: 'Marketing', recommendedAllocation: 0.15 },
];

export const DEMO_SESSIONS: SessionRecord[] = [
  {
    id: 's1', goalId: 'g1', skillId: 'sk2', startTime: daysAgo(1, 10), endTime: endTime(daysAgo(1, 10), 45),
    durationMinutes: 45, focusQuality: 4, difficulty: 3,
    movedForward: 'Built the drift calculation engine and integrated it with the gate screen',
    hesitation: 'Got stuck on the urgency weight formula for a bit',
    nextStart: 'Wire up the sprint timer to the state machine',
  },
  {
    id: 's2', goalId: 'g2', skillId: 'sk6', startTime: daysAgo(1, 14), endTime: endTime(daysAgo(1, 14), 35),
    durationMinutes: 35, focusQuality: 5, difficulty: 2,
    movedForward: 'Read 3 papers on discourse coherence, took structured notes',
    hesitation: 'None — deep flow state',
    nextStart: 'Start methodology section outline',
  },
  {
    id: 's3', goalId: 'g1', skillId: 'sk1', startTime: daysAgo(2, 9), endTime: endTime(daysAgo(2, 9), 45),
    durationMinutes: 45, focusQuality: 3, difficulty: 4,
    movedForward: 'Designed the analytics engine architecture, defined all interfaces',
    hesitation: 'Spent too long deciding between two approaches for skill allocation',
    nextStart: 'Implement calculateSkillAllocations function',
  },
  {
    id: 's4', goalId: 'g3', skillId: 'sk13', startTime: daysAgo(2, 16), endTime: endTime(daysAgo(2, 16), 30),
    durationMinutes: 30, focusQuality: 4, difficulty: 3,
    movedForward: 'Drafted problem statement and market opportunity slides',
    hesitation: 'Struggled with quantifying the market size',
    nextStart: 'Work on the solution and product demo slides',
  },
  {
    id: 's5', goalId: 'g1', skillId: 'sk2', startTime: daysAgo(3, 11), endTime: endTime(daysAgo(3, 11), 45),
    durationMinutes: 45, focusQuality: 4, difficulty: 3,
    movedForward: 'Implemented the session timer modal with countdown and progress bar',
    hesitation: 'Edge case with timer going below zero',
    nextStart: 'Add reflection form step to the timer modal',
  },
  {
    id: 's6', goalId: 'g2', skillId: 'sk9', startTime: daysAgo(4, 10), endTime: endTime(daysAgo(4, 10), 35),
    durationMinutes: 35, focusQuality: 3, difficulty: 4,
    movedForward: 'Set up the analysis pipeline, ran initial coherence metrics',
    hesitation: 'The correlation between metrics was weaker than expected',
    nextStart: 'Try alternative feature extraction approach',
  },
  {
    id: 's7', goalId: 'g1', skillId: 'sk3', startTime: daysAgo(5, 14), endTime: endTime(daysAgo(5, 14), 30),
    durationMinutes: 30, focusQuality: 4, difficulty: 2,
    movedForward: 'Wrote unit tests for all analytics functions',
    hesitation: 'Unsure about edge case test coverage',
    nextStart: 'Integration tests for the full pace metrics pipeline',
  },
  {
    id: 's8', goalId: 'g2', skillId: 'sk7', startTime: daysAgo(6, 9), endTime: endTime(daysAgo(6, 9), 40),
    durationMinutes: 40, focusQuality: 5, difficulty: 3,
    movedForward: 'Outlined the methodology section, decided on evaluation metrics',
    hesitation: 'None',
    nextStart: 'Write the first draft of methodology',
  },
  {
    id: 's9', goalId: 'g1', skillId: 'sk2', startTime: daysAgo(7, 10), endTime: endTime(daysAgo(7, 10), 45),
    durationMinutes: 45, focusQuality: 3, difficulty: 4,
    movedForward: 'Built the onboarding flow with goal creation wizard',
    hesitation: 'UI state management got complex with multiple steps',
    nextStart: 'Add skill template selection to onboarding step 2',
  },
  {
    id: 's10', goalId: 'g3', skillId: 'sk11', startTime: daysAgo(8, 15), endTime: endTime(daysAgo(8, 15), 25),
    durationMinutes: 25, focusQuality: 4, difficulty: 2,
    movedForward: 'Created product screenshots and demo video outline',
    hesitation: 'Should I use real or mocked data for screenshots?',
    nextStart: 'Record the 60-second product walkthrough',
  },
];

export const DEMO_RISK_SNAPSHOTS: RiskSnapshot[] = [
  { id: 'rs1', goalId: 'g1', date: daysAgo(7).split('T')[0], currentWeeklyPace: 7.5, requiredWeeklyPace: 9.2, paceGap: 1.7, projectedHours: 95, completionProbability: 0.65, trajectoryBand: 'At Risk' },
  { id: 'rs2', goalId: 'g1', date: daysAgo(3).split('T')[0], currentWeeklyPace: 8.0, requiredWeeklyPace: 9.0, paceGap: 1.0, projectedHours: 102, completionProbability: 0.72, trajectoryBand: 'Fragile' },
  { id: 'rs3', goalId: 'g2', date: daysAgo(7).split('T')[0], currentWeeklyPace: 4.0, requiredWeeklyPace: 5.5, paceGap: 1.5, projectedHours: 42, completionProbability: 0.58, trajectoryBand: 'Fragile' },
  { id: 'rs4', goalId: 'g2', date: daysAgo(3).split('T')[0], currentWeeklyPace: 4.5, requiredWeeklyPace: 5.8, paceGap: 1.3, projectedHours: 45, completionProbability: 0.62, trajectoryBand: 'Fragile' },
  { id: 'rs5', goalId: 'g3', date: daysAgo(7).split('T')[0], currentWeeklyPace: 2.5, requiredWeeklyPace: 2.8, paceGap: 0.3, projectedHours: 28, completionProbability: 0.89, trajectoryBand: 'Stable' },
  { id: 'rs6', goalId: 'g3', date: daysAgo(3).split('T')[0], currentWeeklyPace: 2.0, requiredWeeklyPace: 2.9, paceGap: 0.9, projectedHours: 26, completionProbability: 0.78, trajectoryBand: 'Fragile' },
];
