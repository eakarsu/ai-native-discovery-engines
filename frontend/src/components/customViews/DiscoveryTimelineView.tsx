import { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';

type Event = { id: string; date: string; lane: string; title: string; impact_score: number; citations: number; summary: string };
type Spark = { month: string; events: number; cumulative_impact: number };
type Data = {
  months: number;
  lanes: string[];
  events: Event[];
  sparkline: Spark[];
  stats: { total_events: number; avg_impact: number; top_lane: string };
};

const LANE_COLORS: Record<string, string> = {
  paper: '#0ea5e9', patent: '#f59e0b', experiment: '#10b981', release: '#a855f7', partnership: '#ef4444'
};

export default function DiscoveryTimelineView() {
  const [data, setData] = useState<Data | null>(null);
  const [months, setMonths] = useState(24);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-views/discovery-timeline?months=${months}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      setData(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const maxSpark = data ? Math.max(...data.sparkline.map(s => s.events)) || 1 : 1;
  const maxImpact = data ? Math.max(...data.events.map(e => e.impact_score)) || 100 : 100;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Discovery Timeline</h2>
        </div>
        <div className="flex items-center gap-2">
          <select value={months} onChange={e => setMonths(Number(e.target.value))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
            <option value={36}>36 months</option>
          </select>
          <button onClick={load} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reload'}
          </button>
        </div>
      </div>
      <div className="p-4">
        {data && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="text-xs text-indigo-700">Total events</div>
                <div className="text-xl font-bold text-indigo-900">{data.stats.total_events}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <div className="text-xs text-emerald-700">Avg impact</div>
                <div className="text-xl font-bold text-emerald-900">{data.stats.avg_impact}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="text-xs text-amber-700">Top lane</div>
                <div className="text-xl font-bold text-amber-900 capitalize">{data.stats.top_lane}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Activity sparkline</div>
              <svg viewBox={`0 0 ${data.sparkline.length * 22} 80`} className="w-full h-20">
                {data.sparkline.map((s, i) => {
                  const h = (s.events / maxSpark) * 70;
                  return (
                    <g key={s.month}>
                      <rect x={i * 22 + 3} y={80 - h} width={16} height={h} fill="#6366f1" opacity={0.8} rx={2} />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Events</div>
            <div className="space-y-2 max-h-[360px] overflow-auto">
              {data.events.map(e => {
                const w = (e.impact_score / maxImpact) * 100;
                return (
                  <div key={e.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full text-white capitalize"
                          style={{ background: LANE_COLORS[e.lane] || '#64748b' }}>{e.lane}</span>
                        <span className="text-xs text-gray-500">{e.date}</span>
                        <span className="text-sm font-medium text-gray-900">{e.title}</span>
                      </div>
                      <div className="text-xs text-gray-600">impact <span className="font-semibold text-gray-900">{e.impact_score}</span> · cites {e.citations}</div>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${w}%`, background: LANE_COLORS[e.lane] || '#64748b' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3 mt-3">
              {data.lanes.map(l => (
                <div key={l} className="flex items-center gap-1.5 text-xs text-gray-700">
                  <span className="w-3 h-3 rounded-full" style={{ background: LANE_COLORS[l] || '#64748b' }} />
                  <span className="capitalize">{l}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
