import { useEffect, useState } from 'react';
import { Network, Loader2 } from 'lucide-react';

type Node = { id: string; label: string; type: string; size: number; weight: number; x: number; y: number; color: string };
type Edge = { id: string; source: string; target: string; weight: number; relation: string };
type GraphData = {
  focus: string;
  stats: { node_count: number; edge_count: number; cluster_count: number; density: number };
  legend: { type: string; color: string }[];
  nodes: Node[];
  edges: Edge[];
};

export default function KnowledgeGraphView() {
  const [data, setData] = useState<GraphData | null>(null);
  const [focus, setFocus] = useState('discovery');
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-views/knowledge-graph?focus=${encodeURIComponent(focus)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const json = await res.json();
      setData(json);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const nodeById = (id: string) => data?.nodes.find(n => n.id === id);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Knowledge Graph</h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={focus}
            onChange={e => setFocus(e.target.value)}
            placeholder="focus concept"
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
          <button onClick={load} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refocus'}
          </button>
        </div>
      </div>
      <div className="p-4">
        {data && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="text-xs text-indigo-700">Nodes</div>
                <div className="text-xl font-bold text-indigo-900">{data.stats.node_count}</div>
              </div>
              <div className="bg-violet-50 p-3 rounded-lg">
                <div className="text-xs text-violet-700">Edges</div>
                <div className="text-xl font-bold text-violet-900">{data.stats.edge_count}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <div className="text-xs text-emerald-700">Clusters</div>
                <div className="text-xl font-bold text-emerald-900">{data.stats.cluster_count}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="text-xs text-amber-700">Density</div>
                <div className="text-xl font-bold text-amber-900">{data.stats.density}</div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
              <svg viewBox="0 0 800 600" className="w-full h-[480px]">
                {data.edges.map(e => {
                  const s = nodeById(e.source); const t = nodeById(e.target);
                  if (!s || !t) return null;
                  const active = hovered && (hovered === e.source || hovered === e.target);
                  return (
                    <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke={active ? '#6366f1' : '#cbd5e1'}
                      strokeWidth={active ? 2 : 1}
                      opacity={active ? 0.9 : 0.5} />
                  );
                })}
                {data.nodes.map(n => (
                  <g key={n.id} onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                    <circle cx={n.x} cy={n.y} r={n.size} fill={n.color} opacity={hovered === n.id ? 1 : 0.85} stroke="#fff" strokeWidth={2} />
                    <text x={n.x} y={n.y + n.size + 12} textAnchor="middle" fontSize="11" fill="#334155">{n.label}</text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {data.legend.map(l => (
                <div key={l.type} className="flex items-center gap-1.5 text-xs text-gray-700">
                  <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  <span className="capitalize">{l.type}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
