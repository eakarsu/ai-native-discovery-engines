import { useState, useEffect } from 'react';
import { Plus, Search, Microscope } from 'lucide-react';
import { api } from '../../api';
import ExperimentDetail from './ExperimentDetail';
import ExperimentForm from './ExperimentForm';

export default function ExperimentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getExperiments()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()) || e.hypothesis_statement?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => ({ designed: 'bg-gray-100 text-gray-600', running: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Experiments</h2><p className="text-gray-500 text-sm mt-1">{items.length} experiments tracked</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Experiment</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search experiments..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Experiment','Hypothesis','Status','Started','Completed'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <tr key={e.id} onClick={() => setSelected(e)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"><Microscope className="w-4 h-4 text-teal-600" /></div><div><div className="font-medium text-gray-900 text-sm">{e.title}</div><div className="text-xs text-gray-400 max-w-xs truncate">{e.design}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{e.hypothesis_statement}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(e.status)}`}>{e.status}</span></td>
                  <td className="px-6 py-4 text-xs text-gray-500">{e.started_at ? new Date(e.started_at).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{e.completed_at ? new Date(e.completed_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <ExperimentDetail experiment={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <ExperimentForm experiment={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
