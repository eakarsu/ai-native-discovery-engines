import { useState, useEffect } from 'react';
import { Plus, Search, Beaker, Zap } from 'lucide-react';
import { api } from '../../api';
import ProjectDetail from './ProjectDetail';
import ProjectForm from './ProjectForm';

export default function ProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = async () => { try { setItems(await api.getProjects()); } catch (e) { console.error(e); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.domain?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', paused: 'bg-yellow-100 text-yellow-800', completed: 'bg-blue-100 text-blue-800' }[s] || 'bg-gray-100 text-gray-600');
  const domainColor = (d: string) => ({ oncology: 'bg-red-100 text-red-700', materials: 'bg-purple-100 text-purple-700', protein_folding: 'bg-blue-100 text-blue-700', antibiotic: 'bg-orange-100 text-orange-700', neuroscience: 'bg-teal-100 text-teal-700' }[d] || 'bg-gray-100 text-gray-600');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-gray-900">Research Projects</h2><p className="text-gray-500 text-sm mt-1">{items.length} active research programs</p></div>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"><Plus className="w-4 h-4" /> New Project</button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or domain..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading projects...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">{['Project','Domain','Lead Researcher','Iterations','Breakthroughs','Status'].map(h => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Beaker className="w-4 h-4 text-indigo-600" /></div><div><div className="font-medium text-gray-900 text-sm">{p.name}</div><div className="text-xs text-gray-400 max-w-xs truncate">{p.goal}</div></div></div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${domainColor(p.domain)}`}>{p.domain?.replace('_',' ')}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.lead_researcher}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{p.iteration_count}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1">{p.breakthrough_count > 0 && <Zap className="w-4 h-4 text-yellow-500" />}<span className={`text-sm font-bold ${p.breakthrough_count > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>{p.breakthrough_count}</span></div></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && !showForm && <ProjectDetail project={selected} onClose={() => setSelected(null)} onRefresh={() => { load(); setSelected(null); }} onEdit={() => setShowForm(true)} />}
      {showForm && <ProjectForm project={showForm && selected ? selected : null} onClose={() => setShowForm(false)} onSave={() => { setShowForm(false); setSelected(null); load(); }} />}
    </div>
  );
}
