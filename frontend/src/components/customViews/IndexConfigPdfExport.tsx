import { useEffect, useState } from 'react';
import { FileDown, Printer, RefreshCw } from 'lucide-react';

type Resp = {
  config: any;
  title: string;
  generated_at: string;
  printable_text: string;
  page_count_estimate: number;
  summary: { embedding_dim: number; total_chunks: number; hybrid_ratio: string };
};

export default function IndexConfigPdfExport() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/custom-views/index-config', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
    } catch (e: any) { setError(e.message || 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const downloadText = () => {
    if (!data) return;
    const blob = new Blob([data.printable_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'index-config.txt';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    if (!data) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const safe = data.printable_text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    win.document.write(`<!doctype html><html><head><title>${data.title}</title>
      <style>body{font-family:ui-monospace,Menlo,monospace;font-size:12px;padding:32px;white-space:pre-wrap;color:#111}</style>
      </head><body>${safe}</body></html>`);
    win.document.close();
    setTimeout(() => { try { win.print(); } catch {} }, 200);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4" data-testid="ic-pdf">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <FileDown className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Index Config — PDF Export</h2>
          <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">NON-VIZ</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button onClick={downloadText} disabled={!data} className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">
            <FileDown className="w-3.5 h-3.5" />Download .txt
          </button>
          <button onClick={printPdf} disabled={!data} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" />Export PDF
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {loading && !data && <div className="text-sm text-gray-500">Loading…</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Index" value={data.config.index_name} small />
            <Stat label="Embedding dim" value={data.summary.embedding_dim} />
            <Stat label="Docs indexed" value={data.summary.total_chunks.toLocaleString()} />
            <Stat label="Hybrid ratio" value={data.summary.hybrid_ratio} small />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Section title="Vector Store">
              <KV k="engine" v={data.config.vector_store.engine} />
              <KV k="m" v={data.config.vector_store.m} />
              <KV k="ef_construction" v={data.config.vector_store.ef_construction} />
              <KV k="ef_search" v={data.config.vector_store.ef_search} />
            </Section>
            <Section title="Chunking">
              <KV k="strategy" v={data.config.chunking.strategy} />
              <KV k="target tokens" v={data.config.chunking.target_tokens} />
              <KV k="overlap" v={data.config.chunking.overlap_tokens} />
              <KV k="min tokens" v={data.config.chunking.min_tokens} />
            </Section>
            <Section title="Hybrid">
              <KV k="bm25_weight" v={data.config.hybrid.bm25_weight} />
              <KV k="dense_weight" v={data.config.hybrid.dense_weight} />
              <KV k="rerank_top_k" v={data.config.hybrid.rerank_top_k} />
            </Section>
            <Section title="Storage / Refresh">
              <KV k="backend" v={data.config.storage.backend} />
              <KV k="shards" v={data.config.storage.shards} />
              <KV k="cron" v={data.config.refresh.schedule_cron} />
              <KV k="last refresh" v={data.config.refresh.last_refresh} />
            </Section>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-800 mb-2">Printable preview ({data.page_count_estimate} pages)</div>
            <pre className="bg-gray-900 text-emerald-300 text-[11px] p-3 rounded overflow-auto max-h-72 whitespace-pre-wrap">{data.printable_text}</pre>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: any; small?: boolean }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-xl'}`}>{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{k}</span>
      <span className="font-mono text-gray-900">{String(v)}</span>
    </div>
  );
}
