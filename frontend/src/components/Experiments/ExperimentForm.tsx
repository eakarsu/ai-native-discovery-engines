import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

interface Props { experiment: any; onClose: () => void; onSave: () => void; }
export default function ExperimentForm({ experiment, onClose, onSave }: Props) {
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [form, setForm] = useState({ hypothesis_id: '', title: '', design: '', methodology: '', status: 'designed', started_at: '', completed_at: '', result_summary: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    api.getHypotheses().then(setHypotheses).catch(console.error);
    if (experiment) setForm({ hypothesis_id: experiment.hypothesis_id?.toString()||'', title: experiment.title||'', design: experiment.design||'', methodology: experiment.methodology||'', status: experiment.status||'designed', started_at: experiment.started_at ? new Date(experiment.started_at).toISOString().slice(0,16) : '', completed_at: experiment.completed_at ? new Date(experiment.completed_at).toISOString().slice(0,16) : '', result_summary: experiment.result_summary||'' });
  }, [experiment]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, hypothesis_id: parseInt(form.hypothesis_id) };
      if (experiment) await api.updateExperiment(experiment.id, payload); else await api.createExperiment(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="font-bold text-gray-900">{experiment ? 'Edit Experiment' : 'New Experiment'}</h2><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Hypothesis *</label><select required value={form.hypothesis_id} onChange={e => set('hypothesis_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">Select hypothesis</option>{hypotheses.map(h => <option key={h.id} value={h.id}>{h.statement?.slice(0,60)}...</option>)}</select></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Design</label><input value={form.design} onChange={e => set('design', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Methodology</label><textarea value={form.methodology} onChange={e => set('methodology', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">{['designed','running','completed','failed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Started At</label><input type="datetime-local" value={form.started_at} onChange={e => set('started_at', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          </div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{saving ? 'Saving...' : experiment ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}
