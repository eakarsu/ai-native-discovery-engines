import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { api } from '../api';

export default function ExportsPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const exports = [
    { id: 'projects', label: 'Projects', description: 'All research projects with domain, lead researcher, iterations and breakthroughs.', path: '/exports/projects.csv', filename: 'projects.csv' },
    { id: 'publications', label: 'Publications', description: 'All publications with journal, status, impact factor and authors.', path: '/exports/publications.csv', filename: 'publications.csv' },
  ];

  const run = async (e: typeof exports[0]) => {
    setBusy(e.id); setError(''); setSuccess('');
    try {
      await api.downloadCsv(e.path, e.filename);
      setSuccess(`${e.filename} downloaded`);
    } catch (err: any) { setError(err.message || 'Download failed'); }
    finally { setBusy(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><FileSpreadsheet className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Exports</h2>
            <p className="text-gray-500 text-sm">Download core entities as CSV files</p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map(e => (
          <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center"><Download className="w-5 h-5 text-emerald-600" /></div>
              <div className="font-semibold text-gray-900">{e.label}</div>
            </div>
            <p className="text-sm text-gray-500 mb-4">{e.description}</p>
            <button onClick={() => run(e)} disabled={busy === e.id} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> {busy === e.id ? 'Downloading…' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
