import { useState, useEffect } from 'react';
import { Plus, Search, User } from 'lucide-react';
import { api } from '../../api';
import ResearcherDetail from './ResearcherDetail';
import ResearcherForm from './ResearcherForm';

export default function ResearchersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getResearchers()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.institution?.toLowerCase().includes(search.toLowerCase()) || r.specialization?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Researchers</h2><p className="text-gray-500 text-sm mt-1">{items.length} researchers</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm"><Plus className="w-4 h-4" /> New Researcher</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, institution, specialization..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Researcher','Institution','Specialization','H-Index','Projects','Publications'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-blue-600" /></div><div><div className="font-medium text-gray-900 text-sm">{r.name}</div><div className="text-xs text-gray-500">{r.email}</div></div></div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.institution}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.specialization}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-700">{r.h_index}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{r.active_projects}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{r.publications_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <ResearcherDetail researcher={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <ResearcherForm researcher={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
