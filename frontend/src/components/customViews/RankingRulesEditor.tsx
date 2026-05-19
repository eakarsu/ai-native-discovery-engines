import { useEffect, useState } from 'react';
import { Settings2, Plus, Trash2, Save, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

type Rule = {
  id: string;
  name: string;
  field: string;
  op: string;
  value: any;
  weight: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

type Resp = {
  rules: Rule[];
  count: number;
  enabled_count: number;
  valid_fields: string[];
  valid_ops: string[];
  generated_at: string;
};

const empty = (): Partial<Rule> => ({ name: '', field: 'pub_year', op: 'gte', value: '', weight: 1.0, enabled: true });

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` };
}

export default function RankingRulesEditor() {
  const [data, setData] = useState<Resp | null>(null);
  const [editing, setEditing] = useState<Record<string, Partial<Rule>>>({});
  const [newRule, setNewRule] = useState<Partial<Rule>>(empty());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/custom-views/ranking-rules', { headers: authHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json: Resp = await r.json();
      setData(json); setEditing({});
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const update = (id: string, patch: Partial<Rule>) => setEditing(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const save = async (rule: Rule) => {
    const patch = editing[rule.id]; if (!patch) return;
    setError('');
    try {
      const body: any = { ...patch };
      if (body.weight !== undefined) body.weight = Number(body.weight);
      const r = await fetch(`/api/custom-views/ranking-rules/${rule.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `HTTP ${r.status}`); }
      flash('Saved');
      await load();
    } catch (e: any) { setError(e.message || 'Save failed'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    setError('');
    try {
      const r = await fetch(`/api/custom-views/ranking-rules/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      flash('Deleted');
      await load();
    } catch (e: any) { setError(e.message || 'Delete failed'); }
  };

  const toggle = async (rule: Rule) => {
    try {
      const r = await fetch(`/api/custom-views/ranking-rules/${rule.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ enabled: !rule.enabled }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
    } catch (e: any) { setError(e.message || 'Toggle failed'); }
  };

  const create = async () => {
    setError('');
    try {
      const body: any = { ...newRule };
      body.weight = Number(body.weight);
      const r = await fetch('/api/custom-views/ranking-rules', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `HTTP ${r.status}`); }
      flash('Created');
      setNewRule(empty());
      await load();
    } catch (e: any) { setError(e.message || 'Create failed'); }
  };

  const merged = (r: Rule): Rule => ({ ...r, ...(editing[r.id] || {}) } as Rule);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4" data-testid="rr-editor">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Ranking Rules Editor</h2>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-700">NON-VIZ</span>
        </div>
        <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {msg && <div className="p-2 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{msg}</div>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Rules" value={data.count} />
            <Stat label="Enabled" value={data.enabled_count} />
            <Stat label="Disabled" value={data.count - data.enabled_count} />
          </div>

          {/* Create */}
          <div className="border border-dashed border-orange-300 bg-orange-50 rounded-lg p-3">
            <div className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-1"><Plus className="w-4 h-4" />New rule</div>
            <div className="grid md:grid-cols-6 gap-2">
              <input data-testid="new-name" placeholder="Name" value={newRule.name || ''} onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                className="text-sm px-2 py-1.5 border border-gray-300 rounded md:col-span-2" />
              <select value={newRule.field} onChange={e => setNewRule({ ...newRule, field: e.target.value })} className="text-sm px-2 py-1.5 border border-gray-300 rounded">
                {data.valid_fields.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={newRule.op} onChange={e => setNewRule({ ...newRule, op: e.target.value })} className="text-sm px-2 py-1.5 border border-gray-300 rounded">
                {data.valid_ops.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <input placeholder="value" value={String(newRule.value ?? '')} onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                className="text-sm px-2 py-1.5 border border-gray-300 rounded" />
              <input type="number" step="0.1" placeholder="weight" value={String(newRule.weight ?? '')} onChange={e => setNewRule({ ...newRule, weight: Number(e.target.value) })}
                className="text-sm px-2 py-1.5 border border-gray-300 rounded" />
            </div>
            <div className="mt-2 flex justify-end">
              <button onClick={create} data-testid="create-rule" className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700">
                <Plus className="w-3.5 h-3.5" />Create
              </button>
            </div>
          </div>

          {/* Existing rules */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Field</th>
                  <th className="py-2 px-2">Op</th>
                  <th className="py-2 px-2">Value</th>
                  <th className="py-2 px-2">Weight</th>
                  <th className="py-2 px-2">On</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.rules.map(r => {
                  const m = merged(r);
                  const dirty = !!editing[r.id];
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-1.5 px-2">
                        <input value={m.name || ''} onChange={e => update(r.id, { name: e.target.value })}
                          className="w-44 px-2 py-1 border border-gray-200 rounded text-sm" />
                      </td>
                      <td className="py-1.5 px-2">
                        <select value={m.field} onChange={e => update(r.id, { field: e.target.value })} className="text-sm px-1.5 py-1 border border-gray-200 rounded">
                          {data.valid_fields.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <select value={m.op} onChange={e => update(r.id, { op: e.target.value })} className="text-sm px-1.5 py-1 border border-gray-200 rounded">
                          {data.valid_ops.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={String(m.value ?? '')} onChange={e => update(r.id, { value: e.target.value })}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-sm" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input type="number" step="0.1" value={String(m.weight ?? '')} onChange={e => update(r.id, { weight: Number(e.target.value) })}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-sm" />
                      </td>
                      <td className="py-1.5 px-2">
                        <button onClick={() => toggle(r)} className="text-gray-600 hover:text-orange-600">
                          {r.enabled ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                        </button>
                      </td>
                      <td className="py-1.5 px-2 flex gap-1">
                        <button onClick={() => save(r)} disabled={!dirty}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40">
                          <Save className="w-3 h-3" />Save
                        </button>
                        <button onClick={() => remove(r.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                          <Trash2 className="w-3 h-3" />Del
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {data.rules.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500 text-sm">No rules yet — create one above.</td></tr>
                )}
              </tbody>
            </table>
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
