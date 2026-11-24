import { useMemo } from 'react';
import { scoreLayout } from '../lib/layoutScore';

const TONE = { ok: 'text-success', info: 'text-slate', warn: 'text-accent', error: 'text-danger' };

export default function LayoutScorePanel({ room, furniture }) {
  const r = useMemo(() => scoreLayout(room, furniture), [room, furniture]);
  const color = r.score == null ? 'text-slate' : r.score >= 75 ? 'text-success' : r.score >= 50 ? 'text-accent' : 'text-danger';
  return (
    <section className="border border-line bg-white p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-sm uppercase tracking-wide text-slate">Livability score</h3>
        <span className={`font-mono text-3xl ${color}`}>{r.score ?? '—'}<span className="text-sm text-slate">/100 · {r.grade}</span></span>
      </div>
      {r.score != null && r.metrics.walkablePct != null && (
        <p className="mt-1 font-mono text-xs text-slate">Walkable {r.metrics.walkablePct}% · Floor used {r.metrics.fillPct}%</p>
      )}
      <ul className="mt-3 space-y-1 text-sm">
        {r.issues.map((i, n) => <li key={n} className={TONE[i.severity]}>• {i.message}</li>)}
      </ul>
    </section>
  );
}
