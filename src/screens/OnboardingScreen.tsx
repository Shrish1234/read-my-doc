import { useState } from 'react';
import { useFocus, Goal } from '@/context/FocusContext';
import { X } from 'lucide-react';

const SPRINT_OPTIONS = [15, 30, 45, 60, 90];

const DEFAULT_SITES = [
  { label: 'Gmail', domain: 'mail.google.com', defaultOn: true },
  { label: 'Slack', domain: 'slack.com', defaultOn: true },
  { label: 'Instagram', domain: 'instagram.com', defaultOn: true },
  { label: 'Twitter/X', domain: 'x.com', defaultOn: true },
  { label: 'YouTube', domain: 'youtube.com', defaultOn: true },
  { label: 'Reddit', domain: 'reddit.com', defaultOn: true },
  { label: 'TikTok', domain: 'tiktok.com', defaultOn: true },
  { label: 'Facebook', domain: 'facebook.com', defaultOn: true },
  { label: 'LinkedIn', domain: 'linkedin.com', defaultOn: false },
];

interface GoalDraft {
  name: string;
  deadline: string;
  weeklyTargetHours: number;
  sprintDurationMinutes: number;
  allowedUrls: string[];
  urlInput: string;
  showUrls: boolean;
}

function emptyGoal(): GoalDraft {
  return { name: '', deadline: '', weeklyTargetHours: 8, sprintDurationMinutes: 45, allowedUrls: [], urlInput: '', showUrls: false };
}

export function OnboardingScreen() {
  const { dispatch } = useFocus();
  const [step, setStep] = useState<1 | 2>(1);
  const [goals, setGoals] = useState<GoalDraft[]>([emptyGoal()]);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [blocklist, setBlocklist] = useState<string[]>(DEFAULT_SITES.filter(s => s.defaultOn).map(s => s.domain));
  const [customDomain, setCustomDomain] = useState('');

  const updateGoal = (idx: number, patch: Partial<GoalDraft>) => {
    setGoals(prev => prev.map((g, i) => i === idx ? { ...g, ...patch } : g));
  };

  const canProceed = goals.some(g => g.name.trim() && g.deadline && g.weeklyTargetHours > 0);

  const handleNext = () => setStep(2);

  const handleFinish = () => {
    const finalGoals: Goal[] = goals.filter(g => g.name.trim()).map((g, i) => ({
      id: String(i + 1),
      name: g.name.trim(),
      deadline: g.deadline,
      weeklyTargetHours: g.weeklyTargetHours,
      sprintDurationMinutes: g.sprintDurationMinutes,
      allowedUrls: g.allowedUrls,
    }));

    dispatch({ type: 'SET_GOALS', payload: finalGoals });
    dispatch({ type: 'SET_BLOCKLIST', payload: blocklist });
    dispatch({ type: 'SET_CURRENT_GOAL', payload: finalGoals[0].id });
    dispatch({
      type: 'SET_DRIFT_SCORES',
      payload: finalGoals.map(g => ({
        goalId: g.id,
        goalName: g.name,
        deficit: g.weeklyTargetHours,
        daysToDeadline: Math.max(1, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000)),
        urgencyWeight: 0,
        score: 0,
        hoursCompletedThisWeek: 0,
        weeklyTarget: g.weeklyTargetHours,
      })),
    });
    dispatch({ type: 'SET_APP_STATE', payload: 'LOCKED' });
  };

  const toggleSite = (domain: string) => {
    setBlocklist(prev => prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]);
  };

  const addCustomDomain = () => {
    const d = customDomain.trim().toLowerCase();
    if (d && !blocklist.includes(d)) {
      setBlocklist(prev => [...prev, d]);
    }
    setCustomDomain('');
  };

  return (
    <div className="animate-fade-in mx-auto max-w-[640px] px-5 py-10">
      {step === 1 ? (
        <div className="animate-fade-in">
          <h1 className="text-center text-[28px] font-semibold text-foreground">
            What are you building toward?
          </h1>
          <p className="mt-2 text-center text-[15px] text-muted-foreground">
            Define up to 3 goals. These are the only things that matter.
          </p>

          <div className="mt-8 space-y-4">
            {goals.map((goal, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-5">
                {expandedIdx === idx ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={goal.name}
                      onChange={e => updateGoal(idx, { name: e.target.value })}
                      placeholder="e.g., Ship Career OS MVP"
                      className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                    <div>
                      <span className="text-[13px] text-muted-foreground">Deadline</span>
                      <input
                        type="date"
                        value={goal.deadline}
                        onChange={e => updateGoal(idx, { deadline: e.target.value })}
                        className="mt-1 w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <span className="text-[13px] text-muted-foreground">Hours per week</span>
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          onClick={() => updateGoal(idx, { weeklyTargetHours: Math.max(1, goal.weeklyTargetHours - 0.5) })}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20 transition-colors"
                        >−</button>
                        <span className="text-base font-medium text-foreground min-w-[80px] text-center">
                          {goal.weeklyTargetHours} hrs/week
                        </span>
                        <button
                          onClick={() => updateGoal(idx, { weeklyTargetHours: Math.min(20, goal.weeklyTargetHours + 0.5) })}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/20 transition-colors"
                        >+</button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[13px] text-muted-foreground">Sprint length</span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {SPRINT_OPTIONS.map(m => (
                          <button
                            key={m}
                            onClick={() => updateGoal(idx, { sprintDurationMinutes: m })}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              goal.sprintDurationMinutes === m
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                            }`}
                          >{m} min</button>
                        ))}
                      </div>
                    </div>
                    {!goal.showUrls ? (
                      <button
                        onClick={() => updateGoal(idx, { showUrls: true })}
                        className="text-sm text-primary hover:underline"
                      >+ Add allowed sites for this goal</button>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={goal.urlInput}
                          onChange={e => updateGoal(idx, { urlInput: e.target.value })}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && goal.urlInput.trim()) {
                              updateGoal(idx, {
                                allowedUrls: [...goal.allowedUrls, goal.urlInput.trim()],
                                urlInput: '',
                              });
                            }
                          }}
                          placeholder="Type URL and press Enter"
                          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {goal.allowedUrls.map((url, ui) => (
                            <span key={ui} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-foreground">
                              {url}
                              <button
                                onClick={() => updateGoal(idx, { allowedUrls: goal.allowedUrls.filter((_, i) => i !== ui) })}
                                className="text-muted-foreground hover:text-foreground"
                              ><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setExpandedIdx(idx)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-[15px] text-foreground">
                      {goal.name} · {goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} · {goal.weeklyTargetHours} hrs/week
                    </span>
                    <span className="text-muted-foreground text-sm">✎</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {goals.length < 3 && (
            <button
              onClick={() => {
                setGoals(prev => [...prev, emptyGoal()]);
                setExpandedIdx(goals.length);
              }}
              className="mt-4 w-full rounded-lg border border-border py-3 text-sm text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors"
            >
              + Add another goal
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="mt-8 w-full rounded-lg bg-primary py-3 text-base font-semibold text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <h1 className="text-center text-[28px] font-semibold text-foreground">
            What pulls you into reactive mode?
          </h1>
          <p className="mt-2 text-center text-[15px] text-muted-foreground">
            These sites will be blocked until your daily sprint is done.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {DEFAULT_SITES.map(site => (
              <button
                key={site.domain}
                onClick={() => toggleSite(site.domain)}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  blocklist.includes(site.domain)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >{site.label}</button>
            ))}
            {blocklist.filter(d => !DEFAULT_SITES.some(s => s.domain === d)).map(d => (
              <span key={d} className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {d}
                <button onClick={() => toggleSite(d)} className="hover:text-primary-foreground/70"><X size={14} /></button>
              </span>
            ))}
          </div>

          <input
            type="text"
            value={customDomain}
            onChange={e => setCustomDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomDomain()}
            placeholder="Add a site..."
            className="mt-4 w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />

          <button
            onClick={handleFinish}
            className="mt-8 w-full rounded-lg bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            style={{ height: 48 }}
          >
            Start Using FocusOS
          </button>
        </div>
      )}
    </div>
  );
}
