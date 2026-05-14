import { useState, useEffect } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import { api } from '../../api';
import PublicationDetail from './PublicationDetail';
import PublicationForm from './PublicationForm';

export default function PublicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getPublications()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.journal?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => ({ draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-800', under_review: 'bg-yellow-100 text-yellow-800', accepted: 'bg-green-100 text-green-800', published: 'bg-emerald-100 text-emerald-800' }[s] || 'bg-gray-100');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Publications</h2><p className="text-gray-500 text-sm mt-1">{items.length} publications</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Publication</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or journal..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Title','Journal','Impact Factor','Status','Submitted'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><BookOpen className="w-4 h-4 text-amber-600" /></div><div><div className="font-medium text-gray-900 text-sm max-w-xs truncate">{p.title}</div><div className="text-xs text-gray-400">{p.project_name}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.journal}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-indigo-700">{p.impact_factor}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status?.replace('_',' ')}</span></td>
                  <td className="px-6 py-4 text-xs text-gray-500">{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <PublicationDetail publication={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <PublicationForm publication={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
