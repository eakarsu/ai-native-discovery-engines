import { useEffect, useState } from 'react';
import { Quote, Sparkles, RefreshCcw, AlertTriangle, CheckCircle } from 'lucide-react';

type Source = { index: number; id: number; title: string; authors: string; year: number; url: string; doi: string };
type Citation = { claim: string; document_id: number; source_index: number; support_score: number; contradicts: boolean };
type Answer = {
  answer_id: number; question: string; answer: string; generator_model: string;
  groundedness: number; hallucination_risk: number; num_claims: number; num_citations: number;
  sources: Source[]; citations: Citation[];
};
type AnswerLog = { id: number; question: string; groundedness: number; hallucination_risk: number; generator_model: string; created_at: string; num_citations: number };
type RecentQuery = { id: number; query_text: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'failed' }))).error || 'Request failed');
  return res.json();
}

export default function CitationTracker() {
  const [question, setQuestion] = useState('What is retrieval-augmented generation and how does it reduce hallucination?');
  const [queryId, setQueryId] = useState<string>('');
  const [generator, setGenerator] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [history, setHistory] = useState<AnswerLog[]>([]);
  const [queries, setQueries] = useState<RecentQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadHistory() { try { setHistory(await api<AnswerLog[]>('/citation-tracker/answers')); } catch { /* tolerate */ } }
  async function loadQueries() { try { setQueries(await api<RecentQuery[]>('/hybrid-retrieval/queries')); } catch { /* tolerate */ } }
  useEffect(() => { loadHistory(); loadQueries(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setAnswer(null);
    try {
      const r = await api<Answer>('/citation-tracker/answer', {
        method: 'POST',
        body: JSON.stringify({ question, query_id: queryId ? parseInt(queryId) : null, generator_model: generator || null })
      });
      setAnswer(r);
      await loadHistory();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Quote className="w-6 h-6 text-indigo-600" />Citation Tracker</h1>
        <p className="text-slate-500 text-sm">Generate evidence-grounded answers with per-claim citations, groundedness, and hallucination-risk scores.</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4">
            <label className="block text-xs text-slate-500 mb-1">Question</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} className="w-full border border-slate-300 rounded p-2 text-sm" />
            <label className="block text-xs text-slate-500 mb-1 mt-3">Retrieval Query (optional — pull top-10 docs from a prior search)</label>
            <select value={queryId} onChange={e => setQueryId(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
              <option value="">(none — use lexical fallback)</option>
              {queries.slice(0, 12).map(q => <option key={q.id} value={q.id}>#{q.id} — {q.query_text.slice(0, 70)}</option>)}
            </select>
            <label className="block text-xs text-slate-500 mb-1 mt-3">Generator model (optional)</label>
            <input value={generator} onChange={e => setGenerator(e.target.value)} placeholder="e.g. anthropic/claude-haiku-4.5" className="w-full border border-slate-300 rounded p-2 text-sm" />
            <button type="submit" disabled={loading} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded text-sm flex items-center justify-center gap-2">{loading && <RefreshCcw className="w-3 h-3 animate-spin" />}<Sparkles className="w-3 h-3" />Generate grounded answer</button>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs mt-3">{error}</div>}
          </form>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Recent Answers</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {history.map(h => (
                <div key={h.id} className="border border-slate-200 rounded p-2 text-xs">
                  <div className="text-slate-800 font-medium line-clamp-2">{h.question}</div>
                  <div className="flex gap-3 mt-1 text-slate-500">
                    <span>grounded: <b className="text-emerald-600">{h.groundedness}</b></span>
                    <span>hall-risk: <b className="text-amber-600">{h.hallucination_risk}</b></span>
                    <span>cites: {h.num_citations}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && <div className="text-xs text-slate-400">No answers yet.</div>}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          {!answer && <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">Submit a question to see a grounded answer.</div>}
          {answer && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-slate-500">Groundedness</div>
                  <div className={`text-2xl font-bold ${answer.groundedness >= 0.7 ? 'text-emerald-600' : answer.groundedness >= 0.4 ? 'text-amber-600' : 'text-red-600'}`}>{(answer.groundedness * 100).toFixed(0)}%</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500">Hallucination Risk</div>
                  <div className={`text-2xl font-bold ${answer.hallucination_risk <= 0.2 ? 'text-emerald-600' : answer.hallucination_risk <= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>{(answer.hallucination_risk * 100).toFixed(0)}%</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500">Claims / Cites</div>
                  <div className="text-2xl font-bold text-slate-800">{answer.num_claims}/{answer.num_citations}</div>
                </div>
              </div>

              <div className="bg-slate-50 rounded p-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{answer.answer}</div>

              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Sources</h3>
                <div className="space-y-1">
                  {answer.sources.map(s => (
                    <div key={s.index} className="text-xs text-slate-700"><b className="text-indigo-600">[{s.index}]</b> {s.title} — <span className="text-slate-500">{s.authors} ({s.year})</span> {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">link</a>}</div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Claim-level Support</h3>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {answer.citations.map((c, i) => (
                    <div key={i} className="text-xs border border-slate-200 rounded p-2">
                      <div className="text-slate-800 mb-1">{c.claim}</div>
                      <div className="flex items-center gap-2 text-slate-500">
                        {c.support_score >= 0.12 ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        <span>source [{c.source_index}]</span>
                        <span className="font-mono">support: {c.support_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
