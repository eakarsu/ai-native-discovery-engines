import { useEffect, useState } from 'react';
import { Grid3x3, RefreshCw } from 'lucide-react';

type Resp = {
  generated_at: string;
  queries: string[];
  docs: { id: string; title: string }[];
  matrix: number[][];
  top_matches: { query: string; doc_id: string; doc_title: string; score: number }[];
  stats: { mean: number; max: number; min: number; cells: number };
  legend: { threshold: number; label: string; color: string }[];
};

function scoreColor(v: number) {
  // blue ramp 0..1
  if (v >= 0.8) return '#1d4ed8';
  if (v >= 0.6) return '#3b82f6';
  if (v >= 0.4) return '#60a5fa';
  if (v >= 0.2) return '#93c5fd';
  return '#dbeafe';
}

export default function RelevanceHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hover, setHover] = useState<{ q: string; d: string; v: number } | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/custom-views/relevance-heatmap', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4" data-testid="rh-heatmap">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Grid3x3 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Relevance Score Heatmap</h2>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">VIZ</span>
        </div>
        <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading && !data && <div className="text-sm text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Cells" value={data.stats.cells} />
            <Stat label="Mean" value={data.stats.mean} />
            <Stat label="Max" value={data.stats.max} />
            <Stat label="Min" value={data.stats.min} />
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-gray-500 w-44">query \ doc</th>
                  {data.docs.map(d => (
                    <th key={d.id} className="p-1 text-[10px] text-gray-600 font-medium" title={d.title}>
                      <div className="rotate-[-30deg] origin-bottom-left whitespace-nowrap pl-2 h-12">{d.id}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.queries.map((q, qi) => (
                  <tr key={q}>
                    <td className="p-1 text-gray-800 truncate max-w-[180px]" title={q}>{q}</td>
                    {data.matrix[qi].map((v, di) => (
                      <td key={di} className="p-0">
                        <div
                          className="w-9 h-9 border border-white cursor-pointer flex items-center justify-center text-[10px] font-medium"
                          style={{ background: scoreColor(v), color: v >= 0.6 ? 'white' : '#1e3a8a' }}
                          title={`${q} × ${data.docs[di].id}: ${v}`}
                          onMouseEnter={() => setHover({ q, d: data.docs[di].title, v })}
                          onMouseLeave={() => setHover(null)}
                        >
                          {v.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hover && (
            <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2">
              <span className="font-medium">{hover.q}</span> × <span className="italic">{hover.d}</span> = <span className="font-bold">{hover.v.toFixed(3)}</span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap text-xs">
            {data.legend.map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="w-4 h-4 rounded" style={{ background: l.color }} />
                <span className="text-gray-700">{l.label} (&ge; {l.threshold})</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm font-semibold text-gray-800 mb-2">Top match per query</div>
            <div className="grid md:grid-cols-2 gap-2">
              {data.top_matches.map(t => (
                <div key={t.query} className="text-sm flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-2 py-1">
                  <span className="text-gray-700 truncate">{t.query}</span>
                  <span className="text-gray-500 truncate">→ {t.doc_title}</span>
                  <span className="ml-2 font-semibold text-blue-700">{t.score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-bold text-gray-900 text-xl">{value}</div>
    </div>
  );
}
