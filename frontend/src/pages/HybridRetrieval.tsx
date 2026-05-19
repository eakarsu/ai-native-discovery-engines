import { useEffect, useState } from 'react';
import { Search, RefreshCcw, FileText, Layers } from 'lucide-react';

type SearchResult = {
  rank: number; document_id: number; title: string; abstract_snippet: string;
  authors: string; venue: string; year: number; url: string; doi: string;
  corpus: string; citation_count: number;
  bm25_score: number; dense_score: number; fused_score: number | null; rerank_score: number | null;
};
type SearchResp = { query_id: number; latency_ms: number; total_candidates: number; rerank_applied: boolean; results: SearchResult[] };
type Corpus = { slug: string; name: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'failed' }))).error || 'Request failed');
  return res.json();
}

const RETRIEVERS = ['hybrid', 'bm25', 'dense'];
const RERANKERS = ['', 'cohere-rerank-3', 'voyage-rerank-2', 'BAAI/bge-reranker-v2-m3', 'jina-reranker-v2'];

export default function HybridRetrieval() {
  const [query, setQuery] = useState('retrieval-augmented generation hallucination grounding');
  const [retriever, setRetriever] = useState('hybrid');
  const [reranker, setReranker] = useState('');
  const [corpusSlug, setCorpusSlug] = useState('');
  const [topK, setTopK] = useState(10);
  const [resp, setResp] = useState<SearchResp | null>(null);
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ablation, setAblation] = useState<any>(null);

  useEffect(() => { api<Corpus[]>('/corpus-index/corpora').then(setCorpora).catch(() => {}); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResp(null); setAblation(null);
    try {
      const r = await api<SearchResp>('/hybrid-retrieval/search', {
        method: 'POST',
        body: JSON.stringify({ query, retriever, reranker_model: reranker || null, corpus_slug: corpusSlug || null, top_k: topK })
      });
      setResp(r);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function ablate() {
    setLoading(true); setError(''); setAblation(null);
    try {
      const r = await api<any>('/hybrid-retrieval/ablate', { method: 'POST', body: JSON.stringify({ query, corpus_slug: corpusSlug || null, top_k: 5 }) });
      setAblation(r);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Search className="w-6 h-6 text-indigo-600" />Hybrid Retrieval</h1>
        <p className="text-slate-500 text-sm">BM25 + dense embeddings + RRF fusion + LLM cross-encoder reranker. Real Okapi BM25 over the corpus.</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <textarea value={query} onChange={e => setQuery(e.target.value)} rows={2} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Search query" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Retriever</label>
            <select value={retriever} onChange={e => setRetriever(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
              {RETRIEVERS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Reranker</label>
            <select value={reranker} onChange={e => setReranker(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
              {RERANKERS.map(r => <option key={r} value={r}>{r || '(none)'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Corpus</label>
            <select value={corpusSlug} onChange={e => setCorpusSlug(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
              <option value="">(all corpora)</option>
              {corpora.map(c => <option key={c.slug} value={c.slug}>{c.slug}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Top K</label>
            <input type="number" min={1} max={50} value={topK} onChange={e => setTopK(parseInt(e.target.value || '10'))} className="w-full border border-slate-300 rounded p-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded text-sm flex items-center justify-center gap-1">{loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Search</button>
            <button type="button" onClick={ablate} disabled={loading} className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded text-sm flex items-center gap-1"><Layers className="w-3 h-3" />Ablate</button>
          </div>
        </div>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mb-4">{error}</div>}

      {resp && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
            <span>candidates: <b className="text-slate-800">{resp.total_candidates}</b></span>
            <span>latency: <b className="text-slate-800">{resp.latency_ms}ms</b></span>
            <span>rerank: <b className={resp.rerank_applied ? 'text-emerald-600' : 'text-slate-400'}>{resp.rerank_applied ? 'applied' : 'off'}</b></span>
            <span>query_id: <b className="text-slate-800">#{resp.query_id}</b></span>
          </div>
          <div className="space-y-2">
            {resp.results.map(r => (
              <div key={r.document_id} className="border border-slate-200 rounded p-3 text-sm hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className="text-2xl font-bold text-indigo-300 min-w-[2rem]">{r.rank}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-3 h-3 text-slate-400" />{r.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{r.authors} · {r.venue} · {r.year} · {r.citation_count} citations · <span className="font-mono">{r.corpus}</span></div>
                    {r.abstract_snippet && <div className="text-xs text-slate-600 mt-1">{r.abstract_snippet}...</div>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                      <span className="font-mono text-slate-700">BM25: {r.bm25_score}</span>
                      <span className="font-mono text-slate-700">dense: {r.dense_score}</span>
                      {r.fused_score != null && <span className="font-mono text-indigo-700">RRF: {r.fused_score}</span>}
                      {r.rerank_score != null && <span className="font-mono text-emerald-700">rerank: {r.rerank_score}</span>}
                      {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">→ source</a>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ablation && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Ablation — same query, three retrievers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {['bm25', 'dense', 'hybrid'].map(k => (
              <div key={k} className="border border-slate-200 rounded p-2">
                <div className="font-semibold text-slate-700 mb-1">{k}</div>
                <div className="text-slate-500 mb-1">latency: {ablation[k]?.latency_ms}ms</div>
                <ol className="list-decimal pl-4 space-y-0.5">
                  {ablation[k]?.results?.slice(0, 5).map((r: any) => <li key={r.document_id} className="text-slate-700 truncate">{r.title}</li>)}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
