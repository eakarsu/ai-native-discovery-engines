import { useState } from 'react';
import { X, Edit2, Trash2, Sparkles, BarChart2 } from 'lucide-react';
import { api } from '../../api';
import AIResponse from '../AIResponse';

interface Props { result: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }
export default function ResultDetail({ result: r, onClose, onRefresh, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const handleDelete = async () => { if (!confirm('Delete result?')) return; setDeleting(true); try { await api.deleteResult(r.id); onRefresh(); } catch (e: any) { alert(e.message); setDeleting(false); } };
  const runAI = async () => { setAiLoading(true); setAiContent(''); try { const { result } = await api.analyzeResults({ result_data: r, hypothesis: r.experiment_title }); setAiContent(result); } catch (e: any) { setAiContent('AI failed: ' + e.message); } finally { setAiLoading(false); } };
  const outcomeColor = (o: string) => ({ positive: 'bg-green-100 text-green-800', negative: 'bg-red-100 text-red-800', inconclusive: 'bg-gray-100 text-gray-600', breakthrough: 'bg-yellow-100 text-yellow-800' }[o] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-96 bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center"><BarChart2 className="w-5 h-5 text-emerald-600" /></div><div><h2 className="font-bold text-gray-900 text-sm">Result #{r.id}</h2><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${outcomeColor(r.outcome)}`}>{r.outcome}</span></div></div>
          <div className="flex gap-1"><button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={handleDelete} disabled={deleting} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Significance</div><div className="text-xl font-bold text-gray-900">{r.significance_pct}%</div></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Breakthrough</div><div className={`text-sm font-bold ${r.breakthrough ? 'text-yellow-600' : 'text-gray-400'}`}>{r.breakthrough ? 'YES' : 'No'}</div></div>
          </div>
          {r.data_summary && <div className="bg-blue-50 rounded-lg p-4"><div className="text-xs font-semibold text-blue-700 mb-1 uppercase">Data Summary</div><p className="text-sm text-blue-800">{r.data_summary}</p></div>}
          {r.conclusion && <div className="bg-green-50 rounded-lg p-4"><div className="text-xs font-semibold text-green-700 mb-1 uppercase">Conclusion</div><p className="text-sm text-green-800">{r.conclusion}</p></div>}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {[['Experiment', r.experiment_title], ['Published', r.published ? `Yes (${r.published_at ? new Date(r.published_at).toLocaleDateString() : ''})` : 'No']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900">{v}</span></div>
            ))}
          </div>
          <button onClick={runAI} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm"><Sparkles className="w-4 h-4" />{aiLoading ? 'Analyzing...' : 'AI Analyze Results'}</button>
          {(aiLoading || aiContent) && <AIResponse content={aiContent} title="Result Analysis" isLoading={aiLoading} onRegenerate={runAI} />}
        </div>
      </div>
    </div>
  );
}
