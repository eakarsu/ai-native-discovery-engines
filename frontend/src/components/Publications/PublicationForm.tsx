import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

interface Props { publication: any; onClose: () => void; onSave: () => void; }
export default function PublicationForm({ publication, onClose, onSave }: Props) {
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ project_id: '', title: '', journal: '', status: 'draft', impact_factor: '', submitted_at: '', accepted_at: '', authors: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error);
    if (publication) setForm({ project_id: publication.project_id?.toString()||'', title: publication.title||'', journal: publication.journal||'', status: publication.status||'draft', impact_factor: publication.impact_factor?.toString()||'', submitted_at: publication.submitted_at||'', accepted_at: publication.accepted_at||'', authors: publication.authors||'' });
  }, [publication]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, project_id: parseInt(form.project_id), impact_factor: parseFloat(form.impact_factor) };
      if (publication) await api.updatePublication(publication.id, payload); else await api.createPublication(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="font-bold text-gray-900">{publication ? 'Edit Publication' : 'New Publication'}</h2><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Project *</label><select required value={form.project_id} onChange={e => set('project_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">{['draft','submitted','under_review','accepted','published'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Journal</label><input value={form.journal} onChange={e => set('journal', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Impact Factor</label><input type="number" step="0.001" value={form.impact_factor} onChange={e => set('impact_factor', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Submitted At</label><input type="date" value={form.submitted_at} onChange={e => set('submitted_at', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Accepted At</label><input type="date" value={form.accepted_at} onChange={e => set('accepted_at', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Authors</label><input value={form.authors} onChange={e => set('authors', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Author A, Author B, et al." /></div>
          </div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{saving ? 'Saving...' : publication ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}
