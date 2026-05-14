import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { api } from '../api';

const ENTITY_OPTIONS = ['', 'projects', 'hypotheses', 'experiments', 'results', 'publications', 'researchers'];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('');
  const [status, setStatus] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

  const run = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true); setError(''); setResults(null);
    try {
      const data = await api.search({ q, entity: entity || undefined, status: status || undefined, domain: domain || undefined, limit: 50 });
      setResults(data);
    } catch (err: any) { setError(err.message || 'Search failed'); }
    finally { setLoading(false); }
  };

  const renderSection = (title: string, rows: any[], cols: string[]) => {
    if (!rows || rows.length === 0) return null;
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-800 capitalize">{title} <span className="text-gray-500 font-normal">({rows.length})</span></div>
        <table className="w-full">
          <thead><tr className="bg-white border-b border-gray-100">{cols.map(c => <th key={c} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                {cols.map(c => <td key={c} className="px-4 py-2 text-sm text-gray-700 max-w-md truncate" title={String(r[c] ?? '')}>{String(r[c] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><SearchIcon className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Search & Filter</h2>
            <p className="text-gray-500 text-sm">Cross-entity full-text search across the discovery engine</p>
          </div>
        </div>
      </div>

      <form onSubmit={run} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Query</label>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search projects, hypotheses, experiments…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entity</label>
          <select value={entity} onChange={e => setEntity(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            {ENTITY_OPTIONS.map(o => <option key={o} value={o}>{o || 'All'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <input value={status} onChange={e => setStatus(e.target.value)} placeholder="e.g. active" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Project domain</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. oncology" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <div className="md:col-span-5">
          <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm">{loading ? 'Searching…' : 'Search'}</button>
        </div>
      </form>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {results && (
        <div>
          {renderSection('projects', results.results?.projects || [], ['id', 'name', 'domain', 'status', 'lead_researcher'])}
          {renderSection('hypotheses', results.results?.hypotheses || [], ['id', 'project_id', 'statement', 'status', 'confidence_score'])}
          {renderSection('experiments', results.results?.experiments || [], ['id', 'hypothesis_id', 'title', 'status'])}
          {renderSection('results', results.results?.results || [], ['id', 'experiment_id', 'outcome', 'significance_pct', 'breakthrough'])}
          {renderSection('publications', results.results?.publications || [], ['id', 'project_id', 'title', 'journal', 'status', 'impact_factor'])}
          {renderSection('researchers', results.results?.researchers || [], ['id', 'name', 'institution', 'specialization', 'h_index'])}
          {Object.values(results.results || {}).every((arr: any) => !arr || arr.length === 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">No matches.</div>
          )}
        </div>
      )}
    </div>
  );
}
