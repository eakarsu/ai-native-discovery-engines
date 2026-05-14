import { useState } from 'react';
import { X, Edit2, Trash2, BookOpen } from 'lucide-react';
import { api } from '../../api';

interface Props { publication: any; onClose: () => void; onRefresh: () => void; onEdit: () => void; }
export default function PublicationDetail({ publication: p, onClose, onRefresh, onEdit }: Props) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => { if (!confirm('Delete publication?')) return; setDeleting(true); try { await api.deletePublication(p.id); onRefresh(); } catch (e: any) { alert(e.message); setDeleting(false); } };
  const statusColor = (s: string) => ({ draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-800', under_review: 'bg-yellow-100 text-yellow-800', accepted: 'bg-green-100 text-green-800', published: 'bg-emerald-100 text-emerald-800' }[s] || 'bg-gray-100');

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-96 bg-white h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-amber-600" /></div><div><h2 className="font-bold text-gray-900 text-sm line-clamp-1">{p.title}</h2><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status?.replace('_',' ')}</span></div></div>
          <div className="flex gap-1"><button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button><button onClick={handleDelete} disabled={deleting} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button><button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Impact Factor</div><div className="text-xl font-bold text-indigo-700">{p.impact_factor}</div></div>
            <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-500 mb-1">Project</div><div className="text-xs font-medium text-gray-900 text-center">{p.project_name}</div></div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {[['Journal', p.journal], ['Authors', p.authors], ['Submitted', p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : '—'], ['Accepted', p.accepted_at ? new Date(p.accepted_at).toLocaleDateString() : '—']].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900 text-right max-w-[55%]">{v || '—'}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
