import { useState } from 'react';
import { useFocus } from '@/context/FocusContext';
import { GoalWithMetrics } from '@/lib/types';

export default function SettingsPage() {
  const { state, dispatch } = useFocus();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const exportData = () => {
    const data = JSON.stringify({ goals: state.goals, sessions: state.sessions, skills: state.skills }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focusos-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const archiveGoal = (goalId: string) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (goal) dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, archived: true } });
  };

  const resetAll = () => {
    localStorage.removeItem('focusos-v2-state');
    dispatch({ type: 'RESET_ALL' });
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="animate-fade-in mx-auto max-w-content px-8 py-8 space-y-10">
      <h1 className="page-title">Settings</h1>

      {/* Profile */}
      <div className="focus-card">
        <div className="section-label mb-4">PROFILE</div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Name</label>
            <input type="text" defaultValue="Demo User" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Timezone</label>
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none">
              <option>America/New_York</option>
              <option>America/Chicago</option>
              <option>America/Denver</option>
              <option>America/Los_Angeles</option>
              <option>Europe/London</option>
              <option>Asia/Tokyo</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Week starts on</label>
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none">
              <option value="1">Monday</option>
              <option value="0">Sunday</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="focus-card">
        <div className="section-label mb-4">DATA</div>
        <div className="space-y-3">
          <button onClick={exportData} className="w-full rounded-lg border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ borderRadius: 8 }}>
            Export data (JSON)
          </button>
          <div>
            <label className="text-sm font-medium text-foreground">Archive a goal</label>
            <div className="mt-2 space-y-2">
              {state.goals.filter(g => !g.archived).map(g => (
                <div key={g.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-foreground">{g.name}</span>
                  <button onClick={() => archiveGoal(g.id)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Archive
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="focus-card">
        <div className="section-label mb-4">ACCOUNT</div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">demo@focusos.app</span>
          </div>
          <button onClick={() => setShowResetConfirm(true)} className="text-sm text-destructive hover:underline">
            Reset all data
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20" onClick={() => setShowResetConfirm(false)}>
          <div className="animate-modal-in w-full max-w-sm rounded-xl border border-border bg-card p-5 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-foreground">Reset all data? This will clear everything and reload the app with demo data.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground" style={{ borderRadius: 8 }}>Cancel</button>
              <button onClick={resetAll} className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90" style={{ borderRadius: 8 }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
