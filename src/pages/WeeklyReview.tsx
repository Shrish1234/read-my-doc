import { useMemo, useState } from 'react';
import { useFocus } from '@/context/FocusContext';
import { buildWeeklyReview } from '@/lib/analytics';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function WeeklyReviewPage() {
  const { state } = useFocus();
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);

  const weekStart = getWeekStart(new Date());

  const generateReview = () => {
    const review = buildWeeklyReview(
      state.goals, state.sessions, state.skills,
      state.riskSnapshots, weekStart
    );
    setGeneratedReview(review.memoText);
  };

  // Previous weeks reviews (computed)
  const previousWeeks = useMemo(() => {
    const weeks: { start: Date; review: ReturnType<typeof buildWeeklyReview> }[] = [];
    for (let i = 1; i <= 4; i++) {
      const ws = new Date(weekStart.getTime() - i * 7 * 86400000);
      const review = buildWeeklyReview(state.goals, state.sessions, state.skills, state.riskSnapshots, ws);
      if (review.totalSessions > 0) {
        weeks.push({ start: ws, review });
      }
    }
    return weeks;
  }, [state.goals, state.sessions, state.skills, state.riskSnapshots, weekStart]);

  return (
    <div className="animate-fade-in mx-auto max-w-content px-8 py-8 space-y-8">
      <h1 className="page-title">Weekly Review</h1>

      {/* Current Review */}
      <div className="focus-card">
        <div className="section-label mb-4">CURRENT WEEK</div>
        {generatedReview ? (
          <div>
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-line text-sm leading-relaxed">
              {generatedReview.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="section-header mt-4 mb-2">{line.replace('## ', '')}</h2>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold mt-3">{line.replace(/\*\*/g, '')}</p>;
                if (line.includes('**')) {
                  const parts = line.split(/\*\*/g);
                  return <p key={i} className="mt-1">{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                }
                return line.trim() ? <p key={i} className="mt-1">{line}</p> : <br key={i} />;
              })}
            </div>
            <button onClick={generateReview} className="mt-4 text-sm text-primary hover:underline">
              Regenerate
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">Generate your weekly review to see your progress summary.</p>
            <button
              onClick={generateReview}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              style={{ borderRadius: 8 }}
            >
              Generate Weekly Review
            </button>
          </div>
        )}
      </div>

      {/* Previous Reviews */}
      {previousWeeks.length > 0 && (
        <div className="focus-card">
          <button onClick={() => setShowPrevious(!showPrevious)} className="flex w-full items-center justify-between">
            <span className="section-label">PREVIOUS REVIEWS</span>
            <span className="text-sm text-muted-foreground">{showPrevious ? '▾' : '▸'}</span>
          </button>
          {showPrevious && (
            <div className="mt-4 space-y-4">
              {previousWeeks.map(({ start, review }) => (
                <div key={start.toISOString()} className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground">
                    Week of {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="mt-1 font-mono-calc text-sm text-muted-foreground">
                    {review.totalSessions} sessions · {review.totalHours} hrs · avg focus {review.averageFocusQuality}/5
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
