import { useEffect, useState } from 'react';
import { Bot, Play, RefreshCcw, ChevronRight } from 'lucide-react';

type SessionRow = { id: number; goal: string; status: string; iterations_planned: number; iterations_done: number; proposed_hypothesis: string; novelty_score: number; groundedness_score: number; total_tokens: number; total_cost_usd: number; created_at: string; completed_at: string; project_name: string };
type StepRow = { id: number; session_id: number; step_number: number; step_type: string; input: string; output: string; tokens_used: number; duration_ms: number };
type Project = { id: number; name: string; domain: string };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'failed' }))).error || 'Request failed');
  return res.json();
}

export default function DiscoveryAgent() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goal, setGoal] = useState('Identify novel allosteric inhibitor scaffolds for KRAS G12D with sub-nanomolar potency.');
  const [projectId, setProjectId] = useState<string>('');
  const [iterations, setIterations] = useState(3);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [active, setActive] = useState<{ session: SessionRow; steps: StepRow[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadSessions() { try { setSessions(await api<SessionRow[]>('/discovery-agent/sessions')); } catch {} }
  async function loadProjects() { try { setProjects(await api<Project[]>('/projects')); } catch {} }
  useEffect(() => { loadSessions(); loadProjects(); }, []);

  async function startSession() {
    setLoading(true); setError('');
    try {
      const r = await api<any>('/discovery-agent/sessions', {
        method: 'POST',
        body: JSON.stringify({ goal, project_id: projectId ? parseInt(projectId) : null, iterations_planned: iterations, auto_run: true })
      });
      setActiveId(r.session.id);
      await loadSessions();
      await open(r.session.id);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function open(id: number) {
    setActiveId(id);
    try { setActive(await api<any>(`/discovery-agent/sessions/${id}`)); } catch (e: any) { setError(e.message); }
  }

  function groupSteps(steps: StepRow[]) {
    const byIter: Record<number, StepRow[]> = {};
    for (const s of steps) { (byIter[s.step_number] = byIter[s.step_number] || []).push(s); }
    return byIter;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bot className="w-6 h-6 text-violet-600" />Discovery Agent</h1>
        <p className="text-slate-500 text-sm">Closed-loop search → read → propose hypothesis → critique → next-query, with novelty and groundedness scoring.</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Play className="w-4 h-4" />Start a session</h2>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={4} className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="Research goal" />
            <div className="grid grid-cols-2 gap-2">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="border border-slate-300 rounded p-2 text-xs">
                <option value="">(no project)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min={1} max={6} value={iterations} onChange={e => setIterations(parseInt(e.target.value || '3'))} className="border border-slate-300 rounded p-2 text-xs" />
            </div>
            <button onClick={startSession} disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2 rounded text-sm flex items-center justify-center gap-1">{loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Run loop</button>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded text-xs">{error}</div>}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Sessions ({sessions.length})</h2>
            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {sessions.map(s => (
                <button key={s.id} onClick={() => open(s.id)} className={`w-full text-left p-2 rounded border text-xs ${activeId === s.id ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="font-medium text-slate-800 line-clamp-2">{s.goal}</div>
                  <div className="flex gap-2 text-slate-500 mt-1">
                    <span className={s.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}>{s.status}</span>
                    <span>{s.iterations_done}/{s.iterations_planned} iter</span>
                    {s.novelty_score && <span>nov: {s.novelty_score}</span>}
                    {s.groundedness_score && <span>ground: {s.groundedness_score}</span>}
                  </div>
                </button>
              ))}
              {sessions.length === 0 && <div className="text-xs text-slate-400">No sessions yet.</div>}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          {!active && <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">Start or select a session to see iteration trace.</div>}
          {active && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase">Goal</div>
                  <div className="text-sm font-semibold text-slate-900">{active.session.goal}</div>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  {active.session.novelty_score != null && <div>novelty: <b className="text-violet-700">{active.session.novelty_score}</b></div>}
                  {active.session.groundedness_score != null && <div>grounded: <b className="text-emerald-700">{active.session.groundedness_score}</b></div>}
                  {active.session.total_tokens && <div>tokens: {active.session.total_tokens}</div>}
                  {active.session.total_cost_usd && <div>~${active.session.total_cost_usd}</div>}
                </div>
              </div>

              {active.session.proposed_hypothesis && (
                <div className="bg-violet-50 border border-violet-200 rounded p-3 mb-4">
                  <div className="text-xs text-violet-700 uppercase font-semibold mb-1">Final Hypothesis</div>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap">{active.session.proposed_hypothesis}</div>
                </div>
              )}

              <div className="space-y-3">
                {Object.entries(groupSteps(active.steps)).map(([iter, steps]) => (
                  <div key={iter} className="border border-slate-200 rounded">
                    <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-xs font-semibold text-slate-700">Iteration {iter}</div>
                    <div className="p-3 space-y-2">
                      {steps.map(s => (
                        <div key={s.id} className="text-xs">
                          <div className="flex items-center gap-1 text-slate-600 font-mono uppercase mb-0.5"><ChevronRight className="w-3 h-3" />{s.step_type}{s.duration_ms ? ` (${s.duration_ms}ms)` : ''}{s.tokens_used ? ` · ${s.tokens_used}t` : ''}</div>
                          <div className="bg-slate-50 rounded p-2 text-slate-700 whitespace-pre-wrap break-words">{(s.output || '').slice(0, 1200)}{s.output && s.output.length > 1200 ? '…' : ''}</div>
                        </div>
                      ))}
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
