import { useEffect, useState } from 'react';
import { Globe, RefreshCcw, Download, ExternalLink } from 'lucide-react';

type Provider = { id: string; label: string; available: boolean; cost_per_call_usd: number; notes: string };
type WebResult = { rank: number; url: string; title: string; snippet: string; published_date: string; score: number; raw_content_tokens: number };
type CrawlResp = { crawl_id: number; provider: string; query: string; source: string; latency_ms: number; cost_usd: number; results: WebResult[] };
type HistRow = { id: number; provider: string; query: string; results_count: number; created_at: string; ingested_corpus_slug: string | null; cost_usd: number };
type Corpus = { slug: string; name: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'failed' }))).error || 'Request failed');
  return res.json();
}

export default function WebCrawl() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [provider, setProvider] = useState('tavily');
  const [query, setQuery] = useState('CRISPR base editor off-target rate 2025');
  const [freshness, setFreshness] = useState(180);
  const [domains, setDomains] = useState('');
  const [resp, setResp] = useState<CrawlResp | null>(null);
  const [history, setHistory] = useState<HistRow[]>([]);
  const [ingestCorpus, setIngestCorpus] = useState('');
  const [selectedRanks, setSelectedRanks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadProviders() { try { setProviders(await api<Provider[]>('/web-crawl/providers')); } catch {} }
  async function loadHistory() { try { setHistory(await api<HistRow[]>('/web-crawl/history')); } catch {} }
  async function loadCorpora() { try { setCorpora(await api<Corpus[]>('/corpus-index/corpora')); } catch {} }
  useEffect(() => { loadProviders(); loadHistory(); loadCorpora(); }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResp(null); setSelectedRanks(new Set());
    try {
      const r = await api<CrawlResp>('/web-crawl/search', {
        method: 'POST',
        body: JSON.stringify({ provider, query, freshness_days: freshness || null, domain_filter: domains || null })
      });
      setResp(r); await loadHistory();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function ingest() {
    if (!resp || !ingestCorpus) return;
    setLoading(true); setError('');
    try {
      const ranks = selectedRanks.size ? Array.from(selectedRanks) : null;
      const r = await api<any>('/web-crawl/ingest', { method: 'POST', body: JSON.stringify({ crawl_id: resp.crawl_id, corpus_slug: ingestCorpus, result_ranks: ranks }) });
      alert(`Ingested ${r.ingested_count} documents into ${r.corpus_slug}`);
      await loadHistory(); await loadCorpora();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function toggleRank(rank: number) {
    const s = new Set(selectedRanks);
    s.has(rank) ? s.delete(rank) : s.add(rank);
    setSelectedRanks(s);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Globe className="w-6 h-6 text-indigo-600" />Live Web Crawl</h1>
        <p className="text-slate-500 text-sm">Search Tavily / Exa / Brave / You.com, then promote results into a curated corpus.</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          <form onSubmit={search} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Provider</label>
              <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
                {providers.map(p => <option key={p.id} value={p.id}>{p.label} {p.available ? '· LIVE' : '· mock'}</option>)}
              </select>
              {providers.find(p => p.id === provider) && <div className="text-xs text-slate-500 mt-1">{providers.find(p => p.id === provider)?.notes}</div>}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Query</label>
              <textarea value={query} onChange={e => setQuery(e.target.value)} rows={3} className="w-full border border-slate-300 rounded p-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Freshness (days)</label>
                <input type="number" value={freshness} onChange={e => setFreshness(parseInt(e.target.value || '0'))} className="w-full border border-slate-300 rounded p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Domain filter</label>
                <input value={domains} onChange={e => setDomains(e.target.value)} placeholder="nature.com,arxiv.org" className="w-full border border-slate-300 rounded p-2 text-sm" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded text-sm flex items-center justify-center gap-1">{loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Search the web</button>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs">{error}</div>}
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Recent Crawls</h2>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto text-xs">
              {history.map(h => (
                <div key={h.id} className="border border-slate-200 rounded p-2">
                  <div className="font-medium text-slate-800 truncate">{h.query}</div>
                  <div className="flex gap-2 text-slate-500 mt-0.5">
                    <span className="font-mono">{h.provider}</span>
                    <span>{h.results_count} results</span>
                    <span>${h.cost_usd || 0}</span>
                    {h.ingested_corpus_slug && <span className="text-emerald-600">→ {h.ingested_corpus_slug}</span>}
                  </div>
                </div>
              ))}
              {history.length === 0 && <div className="text-slate-400">No crawls yet.</div>}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          {!resp && <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">Run a search to see results.</div>}
          {resp && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                <span>provider: <b className="text-slate-800 font-mono">{resp.provider}</b></span>
                <span>source: <b className={resp.source === 'live' ? 'text-emerald-600' : 'text-amber-600'}>{resp.source}</b></span>
                <span>latency: <b className="text-slate-800">{resp.latency_ms}ms</b></span>
                <span>cost: <b className="text-slate-800">${resp.cost_usd}</b></span>
              </div>

              <div className="flex gap-2 mb-3">
                <select value={ingestCorpus} onChange={e => setIngestCorpus(e.target.value)} className="flex-1 border border-slate-300 rounded p-2 text-xs">
                  <option value="">Select corpus to ingest into…</option>
                  {corpora.map(c => <option key={c.slug} value={c.slug}>{c.slug}</option>)}
                </select>
                <button onClick={ingest} disabled={!ingestCorpus || loading} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded text-xs flex items-center gap-1"><Download className="w-3 h-3" />Ingest {selectedRanks.size > 0 ? `(${selectedRanks.size} selected)` : 'all'}</button>
              </div>

              <div className="space-y-2">
                {resp.results.map(r => (
                  <div key={r.rank} className={`border rounded p-3 text-sm ${selectedRanks.has(r.rank) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedRanks.has(r.rank)} onChange={() => toggleRank(r.rank)} className="mt-1" />
                      <div className="text-xs font-bold text-indigo-400 min-w-[1.5rem]">{r.rank}</div>
                      <div className="flex-1">
                        <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:text-indigo-600 inline-flex items-center gap-1">{r.title}<ExternalLink className="w-3 h-3" /></a>
                        <div className="text-xs text-slate-500 mt-0.5">{r.url} · {r.published_date || 'no date'} · score {r.score} · {r.raw_content_tokens} tokens</div>
                        <div className="text-xs text-slate-600 mt-1">{r.snippet}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
