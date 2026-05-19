import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp } from 'lucide-react';

type Point = { date: string; count: number };
type Series = { query: string; total: number; points: Point[] };
type Resp = {
  days: number;
  generated_at: string;
  series: Series[];
  leaderboard: { query: string; total: number }[];
  stats: { total_queries: number; unique_queries: number; avg_per_day: number; top_query: string };
};

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#ec4899'];

export default function QueryFrequencyChart() {
  const [data, setData] = useState<Resp | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/custom-views/query-frequency?days=${days}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  const maxCount = data ? Math.max(...data.series.flatMap(s => s.points.map(p => p.count))) : 1;
  const numPoints = data?.series[0]?.points.length || 0;
  const chartW = 800;
  const chartH = 280;
  const padX = 40, padY = 20;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4" data-testid="qf-chart">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Query Frequency Chart</h2>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">VIZ</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Days:</label>
          <select value={days} onChange={e => setDays(parseInt(e.target.value, 10))} className="text-sm border border-gray-300 rounded px-2 py-1">
            <option value={7}>7</option>
            <option value={14}>14</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
          </select>
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading && !data && <div className="text-sm text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total queries" value={data.stats.total_queries.toLocaleString()} icon={<TrendingUp className="w-4 h-4 text-indigo-600" />} />
            <Stat label="Unique queries" value={data.stats.unique_queries} />
            <Stat label="Avg / day" value={data.stats.avg_per_day} />
            <Stat label="Top query" value={data.stats.top_query} small />
          </div>

          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-72 bg-gray-50 rounded">
              {[0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1={padX} x2={chartW - padX} y1={chartH - padY - (chartH - 2 * padY) * f} y2={chartH - padY - (chartH - 2 * padY) * f}
                  stroke="#e5e7eb" strokeDasharray="3 3" />
              ))}
              {data.series.map((s, si) => {
                const path = s.points.map((p, i) => {
                  const x = padX + (i / Math.max(1, numPoints - 1)) * (chartW - 2 * padX);
                  const y = chartH - padY - (p.count / maxCount) * (chartH - 2 * padY);
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ');
                return <path key={s.query} d={path} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth={2} />;
              })}
              <text x={padX} y={12} className="text-[10px] fill-gray-500">queries / day (max {maxCount})</text>
            </svg>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.series.map((s, si) => (
              <div key={s.query} className="flex items-center gap-2 text-xs text-gray-700">
                <span className="w-3 h-3 rounded" style={{ background: COLORS[si % COLORS.length] }} />
                <span className="truncate" title={s.query}>{s.query}</span>
                <span className="ml-auto text-gray-500">{s.total}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm font-semibold text-gray-800 mb-2">Leaderboard</div>
            <div className="space-y-1">
              {data.leaderboard.map((l, i) => (
                <div key={l.query} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{i + 1}. {l.query}</span>
                  <span className="text-gray-500">{l.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon, small }: { label: string; value: any; icon?: React.ReactNode; small?: boolean }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 flex items-center gap-1">{icon}{label}</div>
      <div className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-xl'}`}>{value}</div>
    </div>
  );
}
