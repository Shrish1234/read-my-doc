import { useState, useEffect, useRef } from 'react';
import { useFocus } from '@/context/FocusContext';
import { StarRating } from './StarRating';
import { X, ExternalLink } from 'lucide-react';
import { computeFullPaceMetrics } from '@/lib/analytics';

const EXTENSION_ID = 'YOUR_EXTENSION_ID';

const CATEGORY_SITES: Record<string, string[]> = {
  Research: ['scholar.google.com', 'arxiv.org', 'jstor.org', 'researchgate.net', 'semanticscholar.org'],
  Development: ['github.com', 'gitlab.com', 'stackoverflow.com', 'codepen.io', 'replit.com'],
  Docs: ['developer.mozilla.org', 'docs.google.com', 'notion.so', 'confluence.atlassian.net', 'readthedocs.io'],
  Design: ['figma.com', 'dribbble.com', 'behance.net', 'canva.com', 'whimsical.com'],
  Data: ['kaggle.com', 'datasette.io', 'airtable.com', 'docs.google.com/spreadsheets'],
  Learning: ['coursera.org', 'udemy.com', 'youtube.com', 'edx.org', 'khanacademy.org'],
  Communication: ['slack.com', 'discord.com', 'mail.google.com', 'outlook.live.com', 'teams.microsoft.com'],
};

function resolveAllowedSites(categories: string[], customSites: string[]): string[] {
  const sites = new Set<string>();
  for (const cat of categories) {
    for (const site of (CATEGORY_SITES[cat] ?? [])) {
      sites.add(site);
    }
  }
  for (const site of customSites) {
    sites.add(site);
  }
  return Array.from(sites);
}

interface SessionTimerModalProps {
  goalId: string;
  skillId: string | null;
  durationMinutes: number;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'setup' | 'timer' | 'reflection';

export function SessionTimerModal({ goalId: initGoalId, skillId: initSkillId, durationMinutes: initDuration, onClose, onComplete }: SessionTimerModalProps) {
  const { state, dispatch } = useFocus();
  const [step, setStep] = useState<Step>('setup');

  // Setup
  const [selectedGoalId, setSelectedGoalId] = useState(initGoalId);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(initSkillId);
  const [duration, setDuration] = useState(initDuration);

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const endTimeRef = useRef<number>(0);
  const startTimeRef = useRef<string>('');

  // Focus mode
  const [focusModeStatus, setFocusModeStatus] = useState<'active' | 'unavailable' | null>(null);
  const [resolvedSites, setResolvedSites] = useState<string[]>([]);

  // Reflection
  const [movedForward, setMovedForward] = useState('');
  const [hesitation, setHesitation] = useState('');
  const [nextStart, setNextStart] = useState('');
  const [focusQuality, setFocusQuality] = useState(0);
  const [difficulty, setDifficulty] = useState(0);

  const selectedGoal = state.goals.find(g => g.id === selectedGoalId);
  const goalSkills = state.skills.filter(sk => sk.goalId === selectedGoalId);

  const startTimer = () => {
    const totalMs = duration * 60 * 1000;
    const endTime = new Date(Date.now() + totalMs);
    endTimeRef.current = endTime.getTime();
    startTimeRef.current = new Date().toISOString();
    setSecondsRemaining(duration * 60);
    setStep('timer');

    // Resolve allowed sites from goal
    const allowed = selectedGoal?.allowed_sites ?? { categories: [], customSites: [] };
    const sites = resolveAllowedSites(allowed.categories, allowed.customSites);
    setResolvedSites(sites);

    // Try to activate browser extension focus mode
    try {
      if (window.chrome?.runtime) {
        window.chrome.runtime.sendMessage(EXTENSION_ID, {
          type: 'FOCUS_MODE_START',
          allowedSites: sites,
          sessionEndsAt: endTime.toISOString(),
        }, (response) => {
          if (window.chrome?.runtime?.lastError) {
            setFocusModeStatus('unavailable');
          } else {
            setFocusModeStatus('active');
          }
        });
      } else {
        setFocusModeStatus('unavailable');
      }
    } catch {
      setFocusModeStatus('unavailable');
    }
  };

  useEffect(() => {
    if (step !== 'timer') return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setStep('reflection');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const endEarly = () => {
    setStep('reflection');
  };

  const sendFocusModeEnd = () => {
    try {
      window.chrome?.runtime?.sendMessage(EXTENSION_ID, { type: 'FOCUS_MODE_END' });
    } catch { /* extension not available */ }
  };

  const saveReflection = () => {
    const actualDuration = Math.round((Date.now() - new Date(startTimeRef.current).getTime()) / 60000);
    const session = {
      id: `s${Date.now()}`,
      goalId: selectedGoalId,
      skillId: selectedSkillId,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      durationMinutes: Math.min(actualDuration, duration),
      focusQuality: focusQuality || null,
      difficulty: difficulty || null,
      movedForward,
      hesitation,
      nextStart,
    };
    dispatch({ type: 'ADD_SESSION', payload: session });

    // Compute and store risk snapshot
    if (selectedGoal) {
      const updatedSessions = [...state.sessions, session];
      const metrics = computeFullPaceMetrics(selectedGoal, updatedSessions);
      dispatch({
        type: 'ADD_RISK_SNAPSHOT',
        payload: {
          id: `rs${Date.now()}`,
          goalId: selectedGoalId,
          date: new Date().toISOString().split('T')[0],
          currentWeeklyPace: metrics.currentWeeklyPaceHours,
          requiredWeeklyPace: metrics.requiredWeeklyPace,
          paceGap: metrics.paceGap,
          projectedHours: metrics.projectedHoursByDeadline,
          completionProbability: metrics.completionProbability,
          trajectoryBand: metrics.trajectoryBand,
        },
      });
    }

    // End focus mode before closing
    sendFocusModeEnd();

    onComplete();
  };

  const totalSeconds = duration * 60;
  const elapsed = totalSeconds - secondsRemaining;
  const progressPct = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20" onClick={step === 'setup' ? onClose : undefined}>
      <div className="animate-modal-in w-full max-w-lg rounded-xl border border-border bg-card p-6 mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-header">
            {step === 'setup' ? 'Start Session' : step === 'timer' ? 'Focus Session' : 'Reflection'}
          </h2>
          {step !== 'timer' && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          )}
        </div>

        {step === 'setup' && (
          <div className="space-y-5">
            <div>
              <label className="section-label">Goal</label>
              <select
                value={selectedGoalId}
                onChange={e => { setSelectedGoalId(e.target.value); setSelectedSkillId(null); }}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {state.goals.filter(g => !g.archived).map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {goalSkills.length > 0 && (
              <div>
                <label className="section-label">Skill</label>
                <select
                  value={selectedSkillId ?? ''}
                  onChange={e => setSelectedSkillId(e.target.value || null)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">No specific skill</option>
                  {goalSkills.map(sk => (
                    <option key={sk.id} value={sk.id}>{sk.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="section-label">Duration</label>
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => setDuration(Math.max(5, duration - 5))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/30">−</button>
                <span className="font-mono-calc min-w-[60px] text-center text-foreground">{duration} min</span>
                <button onClick={() => setDuration(Math.min(120, duration + 5))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-foreground/30">+</button>
              </div>
            </div>

            <button onClick={startTimer} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity" style={{ borderRadius: 8 }}>
              Start Session
            </button>
          </div>
        )}

        {step === 'timer' && (
          <div className="text-center">
            <div className="timer-digits">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="mx-auto mt-3 h-[3px] w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progressPct}%`, transition: 'width 1s linear' }} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {selectedGoal?.name}{selectedSkillId ? ` → ${goalSkills.find(s => s.id === selectedSkillId)?.name}` : ''}
            </p>

            {/* Focus mode badge */}
            {focusModeStatus === 'active' && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                🔒 Focus mode active · {resolvedSites.length} sites allowed
              </div>
            )}
            {focusModeStatus === 'unavailable' && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
                ⚠ Install the FocusOS extension to block distractions
              </div>
            )}

            {/* Allowed sites links */}
            {resolvedSites.length > 0 && (
              <div className="mt-5 text-left">
                <p className="text-xs font-medium text-muted-foreground mb-2">ALLOWED SITES</p>
                <div className="flex flex-wrap gap-2">
                  {resolvedSites.map(site => (
                    <a
                      key={site}
                      href={`https://${site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-accent px-2 py-1 text-xs text-foreground hover:border-primary/40 transition-colors"
                    >
                      {site}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button onClick={endEarly} className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors">
              End early
            </button>
          </div>
        )}

        {step === 'reflection' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">What moved forward?</label>
              <textarea value={movedForward} onChange={e => setMovedForward(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="What progress did you make?" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Where did you hesitate?</label>
              <textarea value={hesitation} onChange={e => setHesitation(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="What slowed you down?" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Next starting point?</label>
              <textarea value={nextStart} onChange={e => setNextStart(e.target.value)} rows={2} className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Where will you pick up next time?" />
            </div>
            <div className="flex gap-8">
              <div>
                <label className="text-sm font-medium text-foreground">Focus quality</label>
                <div className="mt-1"><StarRating value={focusQuality} onChange={setFocusQuality} /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Difficulty</label>
                <div className="mt-1"><StarRating value={difficulty} onChange={setDifficulty} /></div>
              </div>
            </div>
            <button
              onClick={saveReflection}
              disabled={!movedForward.trim()}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ borderRadius: 8 }}
            >
              Save Reflection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
