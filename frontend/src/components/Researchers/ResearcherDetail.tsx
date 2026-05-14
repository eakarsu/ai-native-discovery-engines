import { useState } from 'react';
import { X, Edit2, Trash2, User } from 'lucide-react';
import { api } from '../../api';

interface Props { researcher: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }
export default function ResearcherDetail({ researcher: r, onClose, onRefresh, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => { if (!confirm('Delete researcher?')) return; setDeleting(true); try { await api.deleteResearcher(r.id); onRefresh(); } catch (e: any) { alert(e.message); setDeleting(false); } };

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-96 bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div><div><h2 className="font-bold text-gray-900 text-sm">{r.name}</h2><p className="text-xs text-gray-500">{r.institution}</p></div></div>
          <div className="flex gap-1"><button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={handleDelete} disabled={deleting} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">H-Index</div><div className="text-2xl font-bold text-indigo-700">{r.h_index}</div></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Projects</div><div className="text-2xl font-bold text-gray-900">{r.active_projects}</div></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Publications</div><div className="text-2xl font-bold text-gray-900">{r.publications_count}</div></div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {[['Specialization', r.specialization], ['Email', r.email], ['Joined', r.joined_date ? new Date(r.joined_date).toLocaleDateString() : '—']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900">{v || '—'}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
