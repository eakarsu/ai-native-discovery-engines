import { useState, useEffect } from 'react';
import { Plus, Search, FlaskConical, Bot } from 'lucide-react';
import { api } from '../../api';
import HypothesisDetail from './HypothesisDetail';
import HypothesisForm from './HypothesisForm';

export default function HypothesesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getHypotheses()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(h => h.statement?.toLowerCase().includes(search.toLowerCase()) || h.project_name?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => ({ proposed: 'bg-gray-100 text-gray-600', testing: 'bg-blue-100 text-blue-800', validated: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Hypotheses</h2><p className="text-gray-500 text-sm mt-1">{items.length} hypotheses tracked</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Hypothesis</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hypotheses..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Hypothesis','Project','Confidence','Source','Status'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(h => (
                <tr key={h.id} onClick={() => setSelected(h)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center"><FlaskConical className="w-4 h-4 text-violet-600" /></div><p className="text-sm text-gray-900 max-w-md truncate">{h.statement}</p></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{h.project_name}</td>
                  <td className="px-6 py-4"><span className="text-sm font-semibold text-gray-900">{Math.round(h.confidence_score * 100)}%</span></td>
                  <td className="px-6 py-4">{h.generated_by === 'ai' ? <span className="flex items-center gap-1 text-xs text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full"><Bot className="w-3 h-3" />AI</span> : <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Human</span>}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(h.status)}`}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <HypothesisDetail hypothesis={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <HypothesisForm hypothesis={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
