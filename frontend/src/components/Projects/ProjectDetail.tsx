import { useState } from 'react';
import { X, Edit2, Trash2, Sparkles, Beaker } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

interface Props { project: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }
export default function ProjectDetail({ project: p, onClose, onRefresh, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const handleDelete = async () => { if (!confirm('Delete project?')) return; setDeleting(true); try { await api.deleteProject(p.id); onRefresh(); } catch (e: any) { alert(e.message); setDeleting(false); } };
  const runAI = async () => { setAiLoading(true); setAiContent(''); try { const { result } = await api.discoveryReport({ project_id: p.id }); setAiContent(result); } catch (e: any) { setAiContent('AI failed: ' + e.message); } finally { setAiLoading(false); } };
  const statusColor = (s: string) => ({ active: 'bg-green-100 text-green-800', paused: 'bg-yellow-100 text-yellow-800', completed: 'bg-blue-100 text-blue-800' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-1/2 bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center"><Beaker className="w-5 h-5 text-indigo-600" /></div><div><h2 className="font-bold text-gray-900">{p.name}</h2><p className="text-xs text-gray-500 capitalize">{p.domain?.replace('_',' ')}</p></div></div>
          <div className="flex gap-1"><button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={handleDelete} disabled={deleting} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Iterations</div><div className="text-xl font-bold text-gray-900">{p.iteration_count}</div></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Breakthroughs</div><div className="text-xl font-bold text-yellow-600">{p.breakthrough_count}</div></div>
          </div>
          {p.goal && <div className="bg-blue-50 rounded-lg p-4"><div className="text-xs font-semibold text-blue-700 mb-1 uppercase">Research Goal</div><p className="text-sm text-blue-800">{p.goal}</p></div>}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {[['Lead Researcher', p.lead_researcher], ['Start Date', p.start_date ? new Date(p.start_date).toLocaleDateString() : '—']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900">{v || '—'}</span></div>
            ))}
          </div>
          <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"><Sparkles className="w-4 h-4" />{aiLoading ? 'Generating...' : 'AI Discovery Report'}</button>
          {(aiLoading || aiContent) && <AIResponse content={aiContent} title="Discovery Report" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
