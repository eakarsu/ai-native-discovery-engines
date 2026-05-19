import { useEffect, useState } from 'react';
import { Trophy, Play, GitCompare, RefreshCcw } from 'lucide-react';

type Benchmark = { id: number; slug: string; name: string; suite: string; domain: string; num_queries: number; num_docs: number; primary_metric: string; run_count: number; best_ndcg: number | null };
type Run = { id: number; benchmark_id: number; benchmark_slug: string; benchmark_name: string; retriever: string; embedding_model: string; reranker_model: string; ndcg_at_10: number; recall_at_100: number; mrr: number; map_score: number; latency_p50_ms: number; latency_p95_ms: number; cost_per_1k_usd: number; ran_at: string; notes: string };

const RETRIEVERS = ['BM25', 'dense', 'hybrid-rrf', 'colbert-late-interaction', 'splade-v3'];
const EMB = ['', 'voyage-3-large', 'openai-text-embedding-3-large', 'BAAI/bge-large-en-v1.5', 'BAAI/bge-m3', 'cohere-embed-english-v3.0', 'jina-embeddings-v3', 'nvidia/nv-embed-v2'];
const RER = ['', 'cohere-rerank-3', 'voyage-rerank-2', 'BAAI/bge-reranker-v2-m3', 'jina-reranker-v2', 'monoT5-3b'];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'failed' }))).error || 'Request failed');
  return res.json();
}

export default function BenchmarkEval() {
  const [bench, setBench] = useState<Benchmark[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [config, setConfig] = useState({ benchmark_slug: 'beir-scifact', retriever: 'hybrid-rrf', embedding_model: 'voyage-3-large', reranker_model: 'cohere-rerank-3', alpha: 0.5 });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [compare, setCompare] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      setBench(await api<Benchmark[]>('/benchmark-eval/benchmarks'));
      setRuns(await api<Run[]>('/benchmark-eval/runs'));
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setLoading(true); setError('');
    try { await api<any>('/benchmark-eval/run', { method: 'POST', body: JSON.stringify(config) }); await load(); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function compareSelected() {
    if (selected.size < 2) return;
    setLoading(true); setError(''); setCompare(null);
    try { setCompare(await api<any>('/benchmark-eval/compare', { method: 'POST', body: JSON.stringify({ run_ids: Array.from(selected) }) })); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function toggleRun(id: number) {
    const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" />Benchmark Evaluation</h1>
        <p className="text-slate-500 text-sm">BEIR, MTEB, SciDocs, LoTTE. Run new configurations and compare nDCG@10 / Recall@100 / latency / cost.</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Play className="w-4 h-4" />Run a new configuration</h2>
            <div className="space-y-2">
              <select value={config.benchmark_slug} onChange={e => setConfig({ ...config, benchmark_slug: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-sm">
                {bench.map(b => <option key={b.slug} value={b.slug}>{b.name} ({b.num_queries.toLocaleString()} queries, {b.suite})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={config.retriever} onChange={e => setConfig({ ...config, retriever: e.target.value })} className="border border-slate-300 rounded p-2 text-xs">
                  {RETRIEVERS.map(r => <option key={r}>{r}</option>)}
                </select>
                <input type="number" step={0.05} value={config.alpha} onChange={e => setConfig({ ...config, alpha: parseFloat(e.target.value) })} className="border border-slate-300 rounded p-2 text-xs" placeholder="alpha" />
              </div>
              <select value={config.embedding_model} onChange={e => setConfig({ ...config, embedding_model: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-xs">
                {EMB.map(m => <option key={m} value={m}>{m || '(no embedding)'}</option>)}
              </select>
              <select value={config.reranker_model} onChange={e => setConfig({ ...config, reranker_model: e.target.value })} className="w-full border border-slate-300 rounded p-2 text-xs">
                {RER.map(m => <option key={m} value={m}>{m || '(no reranker)'}</option>)}
              </select>
              <button onClick={run} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2 rounded text-sm flex items-center justify-center gap-1">{loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Run benchmark</button>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs">{error}</div>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Benchmarks ({bench.length})</h2>
            <div className="space-y-1 max-h-[280px] overflow-y-auto text-xs">
              {bench.map(b => (
                <div key={b.id} className="border border-slate-200 rounded p-2">
                  <div className="font-medium text-slate-800">{b.name}</div>
                  <div className="text-slate-500 mt-0.5">{b.suite} · {b.domain} · {b.num_queries} q / {b.num_docs.toLocaleString()} docs · {b.run_count} runs {b.best_ndcg && <span className="text-emerald-600 ml-1">best nDCG: {Number(b.best_ndcg).toFixed(3)}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Runs ({runs.length})</h2>
              <button onClick={compareSelected} disabled={selected.size < 2 || loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1"><GitCompare className="w-3 h-3" />Compare ({selected.size})</button>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-slate-500 border-b border-slate-200 sticky top-0 bg-white">
                  <tr><th className="py-2 pr-2"></th><th>Benchmark</th><th>Retriever</th><th>Embedding</th><th>Reranker</th><th>nDCG@10</th><th>R@100</th><th>p95</th><th>$/1k</th></tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-1.5 pr-2"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleRun(r.id)} /></td>
                      <td className="font-mono text-slate-700">{r.benchmark_slug}</td>
                      <td className="text-slate-700">{r.retriever}</td>
                      <td className="text-slate-700 font-mono text-[10px]">{r.embedding_model || '—'}</td>
                      <td className="text-slate-700 font-mono text-[10px]">{r.reranker_model || '—'}</td>
                      <td className="font-bold text-emerald-700">{Number(r.ndcg_at_10).toFixed(4)}</td>
                      <td className="text-slate-700">{Number(r.recall_at_100).toFixed(3)}</td>
                      <td className="text-slate-700">{r.latency_p95_ms}ms</td>
                      <td className="text-slate-700">${Number(r.cost_per_1k_usd).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {compare && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Comparison</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                <div className="bg-slate-50 rounded p-2"><div className="text-slate-500">Best nDCG</div><div className="font-bold text-emerald-700 text-base">{compare.stats.best_run.ndcg}</div><div className="text-slate-500">{compare.stats.best_run.retriever}</div></div>
                <div className="bg-slate-50 rounded p-2"><div className="text-slate-500">Worst nDCG</div><div className="font-bold text-red-700 text-base">{compare.stats.worst_run.ndcg}</div><div className="text-slate-500">{compare.stats.worst_run.retriever}</div></div>
                <div className="bg-slate-50 rounded p-2"><div className="text-slate-500">Spread</div><div className="font-bold text-slate-800 text-base">{compare.stats.ndcg_spread}</div></div>
                <div className="bg-slate-50 rounded p-2"><div className="text-slate-500">Avg p95</div><div className="font-bold text-slate-800 text-base">{compare.stats.avg_latency_p95}ms</div></div>
              </div>
              {compare.narrative && <div className="bg-indigo-50 border border-indigo-100 rounded p-3 text-xs text-slate-700 whitespace-pre-wrap">{compare.narrative}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
