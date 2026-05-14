import { useState, useEffect } from 'react';
import { Plus, Search, BarChart2, Zap } from 'lucide-react';
import { api } from '../../api';
import ResultDetail from './ResultDetail';
import ResultForm from './ResultForm';

export default function ResultsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getResults()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(r => r.experiment_title?.toLowerCase().includes(search.toLowerCase()) || r.outcome?.toLowerCase().includes(search.toLowerCase()));
  const outcomeColor = (o: string) => ({ positive: 'bg-green-100 text-green-800', negative: 'bg-red-100 text-red-800', inconclusive: 'bg-gray-100 text-gray-600', breakthrough: 'bg-yellow-100 text-yellow-800' }[o] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Results</h2><p className="text-gray-500 text-sm mt-1">{items.length} results recorded</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Result</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search results..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Experiment','Outcome','Significance','Breakthrough','Published'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><BarChart2 className="w-4 h-4 text-emerald-600" /></div><p className="text-sm text-gray-900">{r.experiment_title}</p></div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${outcomeColor(r.outcome)}`}>{r.outcome}</span></td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{r.significance_pct}%</td>
                  <td className="px-6 py-4">{r.breakthrough ? <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full"><Zap className="w-3 h-3" />Yes</span> : <span className="text-xs text-gray-400">No</span>}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${r.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{r.published ? 'Published' : 'Unpublished'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <ResultDetail result={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <ResultForm result={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
