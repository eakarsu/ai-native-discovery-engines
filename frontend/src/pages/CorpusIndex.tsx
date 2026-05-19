import { useEffect, useState } from 'react';
import { Database, RefreshCcw, Activity, BookOpen } from 'lucide-react';

type Corpus = {
  id: number; slug: string; name: string; domain: string; source_url: string;
  license: string; doc_count: number; last_crawled_at: string;
  embedding_model: string; dim: number; notes: string;
  embedded_docs?: number; recent_docs?: number;
};
type Document = { id: number; title: string; abstract: string; authors: string; venue: string; year: number; url: string; doi: string; citation_count: number; has_embedding: boolean };
type HealthSummary = { corpus: string; total_docs_in_index: number; total_docs_external: number; coverage_pct: number; embedded_pct: number; new_in_last_7_days: number; year_range: string; embedding_model: string; narrative?: string; llm_used?: boolean };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'failed' }))).error || 'Request failed');
  return res.json();
}

export default function CorpusIndex() {
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [docs, setDocs] = useState<Document[]>([]);
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadCorpora() {
    try { setCorpora(await api<Corpus[]>('/corpus-index/corpora')); } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { loadCorpora(); }, []);

  async function pick(slug: string) {
    setSelected(slug); setHealth(null);
    try { setDocs(await api<Document[]>(`/corpus-index/corpora/${slug}/documents?limit=20`)); }
    catch (e: any) { setError(e.message); }
  }

  async function refresh(slug: string) {
    setLoading(true); setError('');
    try { const r = await api<any>(`/corpus-index/corpora/${slug}/refresh-embeddings`, { method: 'POST' }); alert(`Re-embedded ${r.documents_re_embedded} docs (~$${r.estimated_cost_usd})`); await loadCorpora(); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function runHealth(slug: string) {
    setLoading(true); setError('');
    try { setHealth(await api<HealthSummary>('/corpus-index/health-summary', { method: 'POST', body: JSON.stringify({ corpus_slug: slug }) })); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Database className="w-6 h-6 text-indigo-600" />Corpus Index</h1>
        <p className="text-slate-500 text-sm">Manage scientific corpora (arXiv, PubMed, bioRxiv, OpenAlex, S2ORC). Refresh embeddings and view live health.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" />Corpora ({corpora.length})</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {corpora.map(c => (
              <button key={c.id} onClick={() => pick(c.slug)} className={`w-full text-left p-3 rounded-lg border transition ${selected === c.slug ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.dim}d</div>
                </div>
                <div className="text-xs text-slate-500 mt-1">{c.domain} · {(c.doc_count / 1e6).toFixed(2)}M docs · model: <span className="font-mono">{c.embedding_model}</span></div>
                <div className="text-xs text-slate-400 mt-1">embedded: {c.embedded_docs || 0} · new (30d): {c.recent_docs || 0}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-4">
          {selected && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">{selected}</h2>
                <div className="flex gap-2">
                  <button onClick={() => refresh(selected)} disabled={loading} className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"><RefreshCcw className={`w-3 h-3 ${loading && 'animate-spin'}`} />Refresh Embeddings</button>
                  <button onClick={() => runHealth(selected)} disabled={loading} className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"><Activity className="w-3 h-3" />Health Summary</button>
                </div>
              </div>
              {health && (
                <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div><div className="text-slate-500">Coverage</div><div className="font-bold text-slate-800">{health.coverage_pct ?? 'n/a'}%</div></div>
                    <div><div className="text-slate-500">Embedded</div><div className="font-bold text-slate-800">{health.embedded_pct}%</div></div>
                    <div><div className="text-slate-500">New (7d)</div><div className="font-bold text-slate-800">{health.new_in_last_7_days}</div></div>
                  </div>
                  <div className="text-slate-600">Year range: {health.year_range}</div>
                  {health.narrative && <div className="mt-2 p-2 bg-white rounded border border-slate-200 whitespace-pre-wrap text-slate-700 leading-relaxed">{health.narrative}</div>}
                </div>
              )}
            </div>
          )}

          {docs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Top Documents ({docs.length})</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {docs.map(d => (
                  <div key={d.id} className="p-3 border border-slate-200 rounded text-sm">
                    <div className="font-semibold text-slate-900">{d.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{d.authors} · {d.venue} · {d.year} · {d.citation_count} citations {d.has_embedding && <span className="text-emerald-600">· embedded</span>}</div>
                    {d.abstract && <div className="text-xs text-slate-600 mt-1 line-clamp-2">{d.abstract}</div>}
                    {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">{d.url}</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!selected && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">Select a corpus to inspect documents and health.</div>}
        </div>
      </div>
    </div>
  );
}
