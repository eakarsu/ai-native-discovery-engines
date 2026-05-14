import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function ActivityPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = await api.getActivity({ action: actionFilter || undefined, entity_type: entityFilter || undefined, limit: 200 });
      setItems(data || []);
    } catch (e: any) { setError(e.message || 'Failed to load activity'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><ActivityIcon className="w-6 h-6 text-indigo-600" /></div>
            <h2 className="text-2xl font-bold text-gray-900">Activity Feed</h2>
          </div>
          <p className="text-gray-500 text-sm">Audit log of recent AI tool usage and key user actions</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Action contains</label>
          <input value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="e.g. ai.novelty-assessor" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entity type</label>
          <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All</option>
            <option value="project">project</option>
            <option value="experiment">experiment</option>
            <option value="result">result</option>
            <option value="abstract">abstract</option>
            <option value="methods">methods</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={load} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm">Apply Filters</button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading activity...</div> : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No activity yet. Run an AI tool to populate the log.</div>
        ) : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['When', 'User', 'Action', 'Entity', 'Entity ID', 'Details'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it: any) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(it.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{it.user_email || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{it.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{it.entity_type || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{it.entity_id ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate" title={it.details || ''}>{it.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
