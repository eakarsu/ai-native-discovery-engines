import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

interface Props { result: any; onClose: () => void; onSave: () => void; }
export default function ResultForm({ result, onClose, onSave }: Props) {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [form, setForm] = useState({ experiment_id: '', outcome: 'positive', significance_pct: '95', breakthrough: false, data_summary: '', conclusion: '', published: false, published_at: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    api.getExperiments().then(setExperiments).catch(console.error);
    if (result) setForm({ experiment_id: result.experiment_id?.toString()||'', outcome: result.outcome||'positive', significance_pct: result.significance_pct?.toString()||'95', breakthrough: result.breakthrough||false, data_summary: result.data_summary||'', conclusion: result.conclusion||'', published: result.published||false, published_at: result.published_at ? new Date(result.published_at).toISOString().slice(0,16) : '' });
  }, [result]);
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, experiment_id: parseInt(form.experiment_id), significance_pct: parseFloat(form.significance_pct) };
      if (result) await api.updateResult(result.id, payload); else await api.createResult(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="font-bold text-gray-900">{result ? 'Edit Result' : 'New Result'}</h2><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Experiment *</label><select required value={form.experiment_id} onChange={e => set('experiment_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">Select experiment</option>{experiments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label><select value={form.outcome} onChange={e => set('outcome', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">{['positive','negative','inconclusive','breakthrough'].map(o => <option key={o} value={o}>{o}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Significance %</label><input type="number" step="0.1" min="0" max="100" value={form.significance_pct} onChange={e => set('significance_pct', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="flex items-center gap-2 pt-4"><input type="checkbox" id="bt" checked={form.breakthrough} onChange={e => set('breakthrough', e.target.checked)} className="w-4 h-4 accent-indigo-600" /><label htmlFor="bt" className="text-sm font-medium text-gray-700">Breakthrough</label></div>
            <div className="flex items-center gap-2 pt-4"><input type="checkbox" id="pub" checked={form.published} onChange={e => set('published', e.target.checked)} className="w-4 h-4 accent-indigo-600" /><label htmlFor="pub" className="text-sm font-medium text-gray-700">Published</label></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Data Summary</label><textarea value={form.data_summary} onChange={e => set('data_summary', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Conclusion</label><textarea value={form.conclusion} onChange={e => set('conclusion', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
          </div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{saving ? 'Saving...' : result ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}
