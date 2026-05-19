import { useEffect, useState } from 'react';
import { Settings, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type Source = { id: string; label: string; enabled: boolean; type: string; schedule_cron: string; last_run: string | null; docs_indexed: number };
type Config = {
  sources: Source[];
  filters: { min_year: number; languages: string[]; deny_domains: string[]; allow_domains: string[] };
  rate_limits: { rpm: number; burst: number; concurrent: number };
  storage: { embed_on_ingest: boolean; chunk_tokens: number; overlap_tokens: number };
};

export default function SourceCrawlerConfigView() {
  const [config, setConfig] = useState<Config | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/custom-views/crawler-config', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const j = await res.json();
      setConfig(j.config); setSummary(j.summary);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleSource = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      sources: config.sources.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    });
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/custom-views/crawler-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify(config)
      });
      const j = await res.json();
      setSavedAt(j.saved_at);
      setWarnings(j.warnings || []);
      setSummary(j.summary);
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Source Crawler Config</h2>
        </div>
        <button onClick={save} disabled={saving || !config} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
      <div className="p-4">
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {config && (
          <>
            {summary && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-xs text-emerald-700">Enabled sources</div>
                  <div className="text-xl font-bold text-emerald-900">{summary.enabled_sources}/{summary.total_sources}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-xs text-indigo-700">Docs indexed</div>
                  <div className="text-xl font-bold text-indigo-900">{(summary.total_docs_indexed || 0).toLocaleString()}</div>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-xs text-amber-700">Rate limit (rpm)</div>
                  <div className="text-xl font-bold text-amber-900">{config.rate_limits.rpm}</div>
                </div>
              </div>
            )}

            {savedAt && (
              <div className="mb-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4" /> Saved at {new Date(savedAt).toLocaleTimeString()}
              </div>
            )}
            {warnings.length > 0 && (
              <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{w}</div>
                ))}
              </div>
            )}

            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Sources</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="py-2">Enabled</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Schedule</th>
                    <th className="py-2">Last run</th>
                    <th className="py-2 text-right">Indexed</th>
                  </tr>
                </thead>
                <tbody>
                  {config.sources.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2">
                        <input type="checkbox" checked={s.enabled} onChange={() => toggleSource(s.id)} />
                      </td>
                      <td className="py-2 font-medium text-gray-900">{s.label}</td>
                      <td className="py-2 text-gray-600 capitalize">{s.type}</td>
                      <td className="py-2 font-mono text-xs text-gray-700">{s.schedule_cron}</td>
                      <td className="py-2 text-xs text-gray-500">{s.last_run ? new Date(s.last_run).toLocaleString() : '—'}</td>
                      <td className="py-2 text-right text-gray-900">{s.docs_indexed.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Filters</div>
                <div className="space-y-2 text-sm">
                  <label className="block">
                    <span className="text-gray-700">Min year</span>
                    <input type="number" value={config.filters.min_year}
                      onChange={e => setConfig({ ...config, filters: { ...config.filters, min_year: Number(e.target.value) } })}
                      className="ml-2 px-2 py-1 border border-gray-300 rounded w-24" />
                  </label>
                  <div className="text-gray-700">Languages: <span className="font-mono">{config.filters.languages.join(', ')}</span></div>
                  <div className="text-gray-700">Deny: <span className="font-mono text-xs">{config.filters.deny_domains.join(', ') || '—'}</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Rate limits</div>
                <div className="space-y-2 text-sm">
                  <label className="block">
                    <span className="text-gray-700">RPM</span>
                    <input type="number" value={config.rate_limits.rpm}
                      onChange={e => setConfig({ ...config, rate_limits: { ...config.rate_limits, rpm: Number(e.target.value) } })}
                      className="ml-2 px-2 py-1 border border-gray-300 rounded w-24" />
                  </label>
                  <label className="block">
                    <span className="text-gray-700">Concurrent</span>
                    <input type="number" value={config.rate_limits.concurrent}
                      onChange={e => setConfig({ ...config, rate_limits: { ...config.rate_limits, concurrent: Number(e.target.value) } })}
                      className="ml-2 px-2 py-1 border border-gray-300 rounded w-24" />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
