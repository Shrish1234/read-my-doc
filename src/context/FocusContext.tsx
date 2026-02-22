import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GoalWithMetrics, SessionRecord, SkillRecord, RiskSnapshot } from '@/lib/types';
import { DEMO_GOALS, DEMO_SKILLS, DEMO_SESSIONS, DEMO_RISK_SNAPSHOTS } from '@/lib/demo-data';

export interface AppState {
  goals: GoalWithMetrics[];
  sessions: SessionRecord[];
  skills: SkillRecord[];
  riskSnapshots: RiskSnapshot[];
  initialized: boolean;
}

type Action =
  | { type: 'SET_GOALS'; payload: GoalWithMetrics[] }
  | { type: 'ADD_SESSION'; payload: SessionRecord }
  | { type: 'SET_SKILLS'; payload: SkillRecord[] }
  | { type: 'ADD_RISK_SNAPSHOT'; payload: RiskSnapshot }
  | { type: 'SET_RISK_SNAPSHOTS'; payload: RiskSnapshot[] }
  | { type: 'UPDATE_GOAL'; payload: GoalWithMetrics }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_ALL' };

const initialState: AppState = {
  goals: DEMO_GOALS,
  sessions: DEMO_SESSIONS,
  skills: DEMO_SKILLS,
  riskSnapshots: DEMO_RISK_SNAPSHOTS,
  initialized: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_GOALS': return { ...state, goals: action.payload };
    case 'ADD_SESSION': return { ...state, sessions: [...state.sessions, action.payload] };
    case 'SET_SKILLS': return { ...state, skills: action.payload };
    case 'ADD_RISK_SNAPSHOT': return { ...state, riskSnapshots: [...state.riskSnapshots, action.payload] };
    case 'SET_RISK_SNAPSHOTS': return { ...state, riskSnapshots: action.payload };
    case 'UPDATE_GOAL': return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'LOAD_STATE': return { ...state, ...action.payload };
    case 'RESET_ALL': return { ...initialState, initialized: false };
    default: return state;
  }
}

const STORAGE_KEY = 'focusos-v2-state';

interface FocusContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return { ...init, ...saved };
      }
    } catch { /* ignore */ }
    return init;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  return (
    <FocusContext.Provider value={{ state, dispatch }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}
