import { useState } from 'react';
import { useFocus, Goal } from '@/context/FocusContext';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const SPRINT_OPTIONS = [15, 30, 45, 60, 90];

const DEFAULT_SITES = [
  { label: 'Gmail', domain: 'mail.google.com' },
  { label: 'Slack', domain: 'slack.com' },
  { label: 'Instagram', domain: 'instagram.com' },
  { label: 'Twitter/X', domain: 'x.com' },
  { label: 'YouTube', domain: 'youtube.com' },
  { label: 'Reddit', domain: 'reddit.com' },
  { label: 'TikTok', domain: 'tiktok.com' },
  { label: 'Facebook', domain: 'facebook.com' },
  { label: 'LinkedIn', domain: 'linkedin.com' },
];

export function SettingsScreen() {
  const { state, dispatch } = useFocus();
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [editGoals, setEditGoals] = useState<Goal[]>([...state.goals]);
  const [customDomain, setCustomDomain] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    setEditGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  const saveGoal = (id: string) => {
    const updated = editGoals.find(g => g.id === id);
    if (updated) {
      const newGoals = state.goals.map(g => g.id === id ? updated : g);
      if (!state.goals.find(g => g.id === id)) {
        newGoals.push(updated);
      }
      dispatch({ type: 'SET_GOALS', payload: newGoals });
    }
    setExpandedGoal(null);
  };

  const deleteGoal = (id: string) => {
    const newGoals = state.goals.filter(g => g.id !== id);
    dispatch({ type: 'SET_GOALS', payload: newGoals });
    setEditGoals(prev => prev.filter(g => g.id !== id));
    setShowDeleteConfirm(null);
  };

  const addGoal = () => {
    const newGoal: Goal = {
      id: String(Date.now()),
      name: '',
      deadline: '',
      weeklyTargetHours: 4,
      sprintDurationMinutes: 30,
      allowedUrls: [],
    };
    setEditGoals(prev => [...prev, newGoal]);
    setExpandedGoal(newGoal.id);
  };

  const toggleSite = (domain: string) => {
    const newList = state.reactiveBlocklist.includes(domain)
      ? state.reactiveBlocklist.filter(d => d !== domain)
      : [...state.reactiveBlocklist, domain];
    dispatch({ type: 'SET_BLOCKLIST', payload: newList });
  };

  const exportData = () => {
    const data = JSON.stringify(state.sessions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'focusos-sprint-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    localStorage.removeItem('focusos-state');
    dispatch({ type: 'RESET_ALL' });
    setShowResetConfirm(false);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-[640px] px-5 py-10 space-y-10">
      {/* Goals */}
      <div>
        <div className="section-label mb-4">YOUR GOALS</div>
        <div className="space-y-3">
          {editGoals.map(goal => (
            <div key={goal.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-[15px] text-foreground">
                  {goal.name || 'New Goal'} · {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'} · {goal.weeklyTargetHours} hrs/week
                </span>
                {expandedGoal === goal.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {expandedGoal === goal.id && (
                <div className="border-t border-border p-4 space-y-4 animate-fade-in">
                  <input
                    type="text"
                    value={goal.name}
                    onChange={e => updateGoal(goal.id, { name: e.target.value })}
                    placeholder="Goal name"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none transition-colors"
                  />
                  <div>
                    <span className="text-[13px] text-muted-foreground">Deadline</span>
                    <input
                      type="date"
                      value={goal.deadline}
                      onChange={e => updateGoal(goal.id, { deadline: e.target.value })}
                      className="mt-1 w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <span className="text-[13px] text-muted-foreground">Hours per week</span>
                    <div className="mt-1 flex items-center gap-3">
                      <button onClick={() => updateGoal(goal.id, { weeklyTargetHours: Math.max(1, goal.weeklyTargetHours - 0.5) })} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20">−</button>
                      <span className="text-base text-foreground min-w-[80px] text-center">{goal.weeklyTargetHours} hrs/week</span>
                      <button onClick={() => updateGoal(goal.id, { weeklyTargetHours: Math.min(20, goal.weeklyTargetHours + 0.5) })} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20">+</button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[13px] text-muted-foreground">Sprint length</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {SPRINT_OPTIONS.map(m => (
                        <button key={m} onClick={() => updateGoal(goal.id, { sprintDurationMinutes: m })} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${goal.sprintDurationMinutes === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{m} min</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveGoal(goal.id)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">Save</button>
                    <button onClick={() => setShowDeleteConfirm(goal.id)} className="text-sm text-destructive hover:underline">Delete goal</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {editGoals.length < 3 && (
          <button onClick={addGoal} className="mt-3 w-full rounded-lg border border-border py-3 text-sm text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">+ Add goal</button>
        )}
      </div>

      {/* Blocked Sites */}
      <div>
        <div className="section-label mb-4">BLOCKED SITES</div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SITES.map(site => (
            <button key={site.domain} onClick={() => toggleSite(site.domain)} className={`rounded-full px-3.5 py-2 text-sm transition-colors ${state.reactiveBlocklist.includes(site.domain) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{site.label}</button>
          ))}
          {state.reactiveBlocklist.filter(d => !DEFAULT_SITES.some(s => s.domain === d)).map(d => (
            <span key={d} className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-sm text-primary-foreground">
              {d}
              <button onClick={() => toggleSite(d)}><X size={14} /></button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={customDomain}
          onChange={e => setCustomDomain(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && customDomain.trim()) {
              toggleSite(customDomain.trim().toLowerCase());
              setCustomDomain('');
            }
          }}
          placeholder="Add a site..."
          className="mt-3 w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Emergency Unlocks */}
      <div>
        <div className="section-label mb-4">EMERGENCY UNLOCKS</div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground">Per week:</span>
          <button onClick={() => dispatch({ type: 'SET_EMERGENCY_LIMIT', payload: Math.max(1, state.emergencyLimitPerWeek - 1) })} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20">−</button>
          <span className="text-base text-foreground min-w-[24px] text-center">{state.emergencyLimitPerWeek}</span>
          <button onClick={() => dispatch({ type: 'SET_EMERGENCY_LIMIT', payload: Math.min(5, state.emergencyLimitPerWeek + 1) })} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20">+</button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Used this week: {state.emergencyUsedThisWeek} of {state.emergencyLimitPerWeek}
        </p>
      </div>

      {/* Data */}
      <div>
        <div className="section-label mb-4">YOUR DATA</div>
        <div className="space-y-3">
          <button onClick={exportData} className="w-full rounded-lg border border-border py-3 text-sm text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
            Export sprint history
          </button>
          <button onClick={() => setShowResetConfirm(true)} className="w-full text-sm text-destructive hover:underline">
            Reset everything
          </button>
        </div>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50" onClick={() => setShowDeleteConfirm(null)}>
          <div className="animate-modal-in w-full max-w-[360px] rounded-xl border border-border bg-card p-5 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] text-foreground">Delete this goal? This cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground">Cancel</button>
              <button onClick={() => deleteGoal(showDeleteConfirm)} className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:brightness-110">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50" onClick={() => setShowResetConfirm(false)}>
          <div className="animate-modal-in w-full max-w-[360px] rounded-xl border border-border bg-card p-5 mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-[15px] text-foreground">Reset all data? This will clear everything and return to onboarding.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted-foreground">Cancel</button>
              <button onClick={resetAll} className="flex-1 rounded-lg bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:brightness-110">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
