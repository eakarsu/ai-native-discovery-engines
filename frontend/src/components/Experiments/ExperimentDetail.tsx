import { useState } from 'react';
import { X, Edit2, Trash2, Sparkles, Microscope } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

interface Props { experiment: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }
export default function ExperimentDetail({ experiment: e, onClose, onRefresh, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const handleDelete = async () => { if (!confirm('Delete experiment?')) return; setDeleting(true); try { await api.deleteExperiment(e.id); onRefresh(); } catch (err: any) { alert(err.message); setDeleting(false); } };
  const runAI = async () => { setAiLoading(true); setAiContent(''); try { const { result } = await api.designExperiment({ hypothesis: e.hypothesis_statement }); setAiContent(result); } catch (err: any) { setAiContent('AI failed: ' + err.message); } finally { setAiLoading(false); } };
  const statusColor = (s: string) => ({ designed: 'bg-gray-100 text-gray-600', running: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="w-1/2 bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center"><Microscope className="w-5 h-5 text-teal-600" /></div><div><h2 className="font-bold text-gray-900 text-sm">{e.title}</h2><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(e.status)}`}>{e.status}</span></div></div>
          <div className="flex gap-1"><button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={handleDelete} disabled={deleting} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-5">
          {e.hypothesis_statement && <div className="bg-indigo-50 rounded-lg p-4"><div className="text-xs font-semibold text-indigo-700 mb-1 uppercase">Testing Hypothesis</div><p className="text-sm text-indigo-800">{e.hypothesis_statement}</p></div>}
          {e.design && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs font-semibold text-gray-500 mb-1 uppercase">Design</div><p className="text-sm text-gray-700">{e.design}</p></div>}
          {e.methodology && <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs font-semibold text-gray-500 mb-1 uppercase">Methodology</div><p className="text-sm text-gray-700">{e.methodology}</p></div>}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {[['Started', e.started_at ? new Date(e.started_at).toLocaleDateString() : '—'], ['Completed', e.completed_at ? new Date(e.completed_at).toLocaleDateString() : '—']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900">{v}</span></div>
            ))}
          </div>
          {e.result_summary && <div className="bg-green-50 rounded-lg p-4"><div className="text-xs font-semibold text-green-700 mb-1 uppercase">Result Summary</div><p className="text-sm text-green-800">{e.result_summary}</p></div>}
          <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm"><Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Analyze Results'}</button>
          {(aiLoading || aiContent) && <AIResponse content={aiContent} title="Experiment Analysis" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
