import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api';

interface Props { researcher: any; onClose: () => void; onSave: () => void; }
export default function ResearcherForm({ researcher, onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: '', institution: '', specialization: '', h_index: '0', email: '', active_projects: '0', publications_count: '0', joined_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (researcher) setForm({ name: researcher.name||'', institution: researcher.institution||'', specialization: researcher.specialization||'', h_index: researcher.h_index?.toString()||'0', email: researcher.email||'', active_projects: researcher.active_projects?.toString()||'0', publications_count: researcher.publications_count?.toString()||'0', joined_date: researcher.joined_date||'' }); }, [researcher]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, h_index: parseInt(form.h_index), active_projects: parseInt(form.active_projects), publications_count: parseInt(form.publications_count) };
      if (researcher) await api.updateResearcher(researcher.id, payload); else await api.createResearcher(payload);
      onSave();
    } catch (err: any) { setError(err.message); setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200"><h2 className="font-bold text-gray-900">{researcher ? 'Edit Researcher' : 'New Researcher'}</h2><button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input required value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Institution</label><input value={form.institution} onChange={e => set('institution', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label><input value={form.specialization} onChange={e => set('specialization', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">H-Index</label><input type="number" value={form.h_index} onChange={e => set('h_index', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Active Projects</label><input type="number" value={form.active_projects} onChange={e => set('active_projects', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Publications Count</label><input type="number" value={form.publications_count} onChange={e => set('publications_count', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Joined Date</label><input type="date" value={form.joined_date} onChange={e => set('joined_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          </div>
          <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">{saving ? 'Saving...' : researcher ? 'Update' : 'Create'}</button></div>
        </form>
      </div>
    </div>
  );
}
