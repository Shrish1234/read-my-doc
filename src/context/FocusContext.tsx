import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

export type AppState = 'ONBOARDING' | 'LOCKED' | 'IN_SPRINT' | 'UNLOCKED';

export interface Goal {
  id: string;
  name: string;
  deadline: string;
  weeklyTargetHours: number;
  sprintDurationMinutes: number;
  allowedUrls: string[];
}

export interface Session {
  id: string;
  goalId: string;
  date: string;
  durationMinutes: number;
  completionNote: string;
  nextStartingPoint: string;
}

export interface DriftScore {
  goalId: string;
  goalName: string;
  deficit: number;
  daysToDeadline: number;
  urgencyWeight: number;
  score: number;
  hoursCompletedThisWeek: number;
  weeklyTarget: number;
}

interface FocusState {
  appState: AppState;
  goals: Goal[];
  sessions: Session[];
  currentGoalId: string;
  swapUsedToday: boolean;
  emergencyUsedThisWeek: number;
  emergencyLimitPerWeek: number;
  reactiveBlocklist: string[];
  driftScores: DriftScore[];
  sprintNotes: string;
}

type Action =
  | { type: 'SET_APP_STATE'; payload: AppState }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_SESSION'; payload: Session }
  | { type: 'SET_CURRENT_GOAL'; payload: string }
  | { type: 'SET_SWAP_USED' }
  | { type: 'USE_EMERGENCY' }
  | { type: 'SET_BLOCKLIST'; payload: string[] }
  | { type: 'SET_EMERGENCY_LIMIT'; payload: number }
  | { type: 'SET_DRIFT_SCORES'; payload: DriftScore[] }
  | { type: 'SET_SPRINT_NOTES'; payload: string }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD_STATE'; payload: Partial<FocusState> };

const DEMO_GOALS: Goal[] = [
  {
    id: '1',
    name: 'Ship Career OS MVP',
    deadline: '2026-03-15',
    weeklyTargetHours: 8,
    sprintDurationMinutes: 45,
    allowedUrls: ['github.com/career-os', 'docs.google.com/d/project-spec'],
  },
  {
    id: '2',
    name: 'NLP Homework',
    deadline: '2026-03-01',
    weeklyTargetHours: 4,
    sprintDurationMinutes: 30,
    allowedUrls: ['piazza.com/class/nlp', 'arxiv.org'],
  },
  {
    id: '3',
    name: 'Echo Pitch Deck',
    deadline: '2026-04-01',
    weeklyTargetHours: 3,
    sprintDurationMinutes: 30,
    allowedUrls: ['pitch.com/echo'],
  },
];

const DEMO_SESSIONS: Session[] = [
  {
    id: 's1', goalId: '1', date: '2026-02-19', durationMinutes: 45,
    completionNote: 'Finished drift calculation logic, wrote test cases',
    nextStartingPoint: 'Wire up gate screen UI to scoring engine',
  },
  {
    id: 's2', goalId: '2', date: '2026-02-20', durationMinutes: 30,
    completionNote: 'Completed discourse parsing exercises 1-4',
    nextStartingPoint: 'Start sycophancy analysis section',
  },
  {
    id: 's3', goalId: '1', date: '2026-02-20', durationMinutes: 45,
    completionNote: 'Built onboarding flow prototype in Lovable',
    nextStartingPoint: 'Connect onboarding to state machine',
  },
  {
    id: 's4', goalId: '3', date: '2026-02-18', durationMinutes: 30,
    completionNote: 'Outlined slide structure, wrote problem statement slide',
    nextStartingPoint: 'Design solution slides with product screenshots',
  },
];

const DEMO_DRIFT_SCORES: DriftScore[] = [
  { goalId: '2', goalName: 'NLP Homework', deficit: 3.5, daysToDeadline: 8, urgencyWeight: 0.125, score: 0.438, hoursCompletedThisWeek: 0.5, weeklyTarget: 4 },
  { goalId: '1', goalName: 'Ship Career OS MVP', deficit: 4.5, daysToDeadline: 22, urgencyWeight: 0.045, score: 0.205, hoursCompletedThisWeek: 0.75, weeklyTarget: 8 },
  { goalId: '3', goalName: 'Echo Pitch Deck', deficit: 3.0, daysToDeadline: 39, urgencyWeight: 0.026, score: 0.077, hoursCompletedThisWeek: 0, weeklyTarget: 3 },
];

const DEFAULT_BLOCKLIST = [
  'mail.google.com', 'slack.com', 'instagram.com', 'x.com',
  'youtube.com', 'reddit.com', 'tiktok.com', 'facebook.com',
];

const initialState: FocusState = {
  appState: 'LOCKED',
  goals: DEMO_GOALS,
  sessions: DEMO_SESSIONS,
  currentGoalId: '2', // NLP Homework — highest drift score
  swapUsedToday: false,
  emergencyUsedThisWeek: 1,
  emergencyLimitPerWeek: 2,
  reactiveBlocklist: DEFAULT_BLOCKLIST,
  driftScores: DEMO_DRIFT_SCORES,
  sprintNotes: '',
};

function reducer(state: FocusState, action: Action): FocusState {
  switch (action.type) {
    case 'SET_APP_STATE':
      return { ...state, appState: action.payload };
    case 'SET_GOALS':
      return { ...state, goals: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'SET_CURRENT_GOAL':
      return { ...state, currentGoalId: action.payload };
    case 'SET_SWAP_USED':
      return { ...state, swapUsedToday: true };
    case 'USE_EMERGENCY':
      return { ...state, emergencyUsedThisWeek: state.emergencyUsedThisWeek + 1, appState: 'UNLOCKED' };
    case 'SET_BLOCKLIST':
      return { ...state, reactiveBlocklist: action.payload };
    case 'SET_EMERGENCY_LIMIT':
      return { ...state, emergencyLimitPerWeek: action.payload };
    case 'SET_DRIFT_SCORES':
      return { ...state, driftScores: action.payload };
    case 'SET_SPRINT_NOTES':
      return { ...state, sprintNotes: action.payload };
    case 'RESET_ALL':
      return { ...initialState, appState: 'ONBOARDING', goals: [], sessions: [], driftScores: [] };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const STORAGE_KEY = 'focusos-state';

function loadFromStorage(): Partial<FocusState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: FocusState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

interface FocusContextValue {
  state: FocusState;
  dispatch: React.Dispatch<Action>;
  currentGoal: Goal | undefined;
  currentDrift: DriftScore | undefined;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadFromStorage();
    return saved ? { ...init, ...saved } : init;
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const currentGoal = state.goals.find(g => g.id === state.currentGoalId);
  const currentDrift = state.driftScores.find(d => d.goalId === state.currentGoalId);

  return (
    <FocusContext.Provider value={{ state, dispatch, currentGoal, currentDrift }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}
