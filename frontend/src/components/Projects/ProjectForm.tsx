import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

interface Props { project: any; onClose: () => void; onSave: () => void; }
export default function ProjectForm({ project, onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: '', domain: 'oncology', goal: '', status: 'active', lead_researcher: '', start_date: '', iteration_count: '0', breakthrough_count: '0' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (project) setForm({ name: project.name||'', domain: project.domain||'oncology', goal: project.goal||'', status: project.status||'active', lead_researcher: project.lead_researcher||'', start_date: project.start_date||'', iteration_count: project.iteration_count?.toString()||'0', breakthrough_count: project.breakthrough_count?.toString()||'0' }); }, [project]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, iteration_count: parseInt(form.iteration_count), breakthrough_count: parseInt(form.breakthrough_count) };
      if (project) await api.updateProject(project.id, payload); else await api.createProject(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="font-bold text-gray-900">{project ? 'Edit Project' : 'New Project'}</h2><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label><input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Domain</label><select value={form.domain} onChange={e => set('domain', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">{['oncology','materials','protein_folding','antibiotic','neuroscience'].map(d => <option key={d} value={d}>{d.replace('_',' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">{['active','paused','completed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Lead Researcher</label><input value={form.lead_researcher} onChange={e => set('lead_researcher', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Iterations</label><input type="number" value={form.iteration_count} onChange={e => set('iteration_count', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Breakthroughs</label><input type="number" value={form.breakthrough_count} onChange={e => set('breakthrough_count', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Goal</label><textarea value={form.goal} onChange={e => set('goal', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
          </div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{saving ? 'Saving...' : project ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}
