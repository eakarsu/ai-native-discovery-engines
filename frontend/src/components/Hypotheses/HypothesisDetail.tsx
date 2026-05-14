import { useState } from 'react';
import { X, Edit2, Trash2, Sparkles, FlaskConical } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

interface Props { hypothesis: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }
export default function HypothesisDetail({ hypothesis: h, onClose, onRefresh, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const handleDelete = async () => { if (!confirm('Delete hypothesis?')) return; setDeleting(true); try { await api.deleteHypothesis(h.id); onRefresh(); } catch (e: any) { alert(e.message); setDeleting(false); } };
  const runAI = async () => { setAiLoading(true); setAiContent(''); try { const { result } = await api.designExperiment({ hypothesis: h.statement, domain: h.domain }); setAiContent(result); } catch (e: any) { setAiContent('AI failed: ' + e.message); } finally { setAiLoading(false); } };
  const statusColor = (s: string) => ({ proposed: 'bg-gray-100 text-gray-600', testing: 'bg-blue-100 text-blue-800', validated: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-1/2 bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center"><FlaskConical className="w-5 h-5 text-violet-600" /></div><div><h2 className="font-bold text-gray-900 text-sm">Hypothesis #{h.id}</h2><p className="text-xs text-gray-500">{h.project_name}</p></div></div>
          <div className="flex gap-1"><button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={handleDelete} disabled={deleting} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-indigo-50 rounded-lg p-4"><p className="text-sm text-indigo-900 leading-relaxed">{h.statement}</p></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Confidence</div><div className="text-xl font-bold text-gray-900">{Math.round(h.confidence_score * 100)}%</div></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Status</div><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(h.status)}`}>{h.status}</span></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Source</div><div className="text-sm font-semibold capitalize">{h.generated_by}</div></div>
          </div>
          {h.supporting_evidence && <div className="bg-green-50 rounded-lg p-4"><div className="text-xs font-semibold text-green-700 mb-1 uppercase">Supporting Evidence</div><p className="text-sm text-green-800">{h.supporting_evidence}</p></div>}
          {h.contradicting_evidence && <div className="bg-red-50 rounded-lg p-4"><div className="text-xs font-semibold text-red-700 mb-1 uppercase">Contradicting Evidence</div><p className="text-sm text-red-800">{h.contradicting_evidence}</p></div>}
          <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm"><Sparkles className="w-4 h-4" />{aiLoading ? 'Designing...' : 'AI Design Experiment'}</button>
          {(aiLoading || aiContent) && <AIResponse content={aiContent} title="Experiment Design" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
