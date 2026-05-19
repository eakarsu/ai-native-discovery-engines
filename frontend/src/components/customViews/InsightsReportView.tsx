import { useEffect, useState } from 'react';
import { FileText, Download, Loader2, Printer } from 'lucide-react';

type Section = { heading: string; body: string };
type Metric = { label: string; value: number; delta_pct: number };
type Report = {
  period: string;
  title: string;
  generated_at: string;
  sections: Section[];
  metrics: Metric[];
  printable_text: string;
  page_count_estimate: number;
};

export default function InsightsReportView() {
  const [report, setReport] = useState<Report | null>(null);
  const [period, setPeriod] = useState('Q2-2026');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-views/insights-report?period=${encodeURIComponent(period)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      setReport(await res.json());
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const downloadText = () => {
    if (!report) return;
    const blob = new Blob([report.printable_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `insights-report-${report.period}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => {
    if (!report) return;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    w.document.write(`
      <html><head><title>${report.title}</title>
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; color: #1f2937; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 14px; text-transform: uppercase; color: #4f46e5; margin-top: 24px; }
        .meta { color:#6b7280; font-size: 12px; margin-bottom: 24px; }
        .metric { display:inline-block; margin: 6px 12px 6px 0; padding:6px 10px; border:1px solid #e5e7eb; border-radius:8px; font-size:12px; }
        p { line-height: 1.5; font-size: 13px; }
      </style></head><body>
      <h1>${report.title}</h1>
      <div class="meta">Generated ${new Date(report.generated_at).toLocaleString()} · est. ${report.page_count_estimate} pages</div>
      ${report.sections.map(s => `<h2>${s.heading}</h2><p>${s.body}</p>`).join('')}
      <h2>Key Metrics</h2>
      ${report.metrics.map(m => `<div class="metric"><b>${m.label}</b>: ${m.value} (${m.delta_pct >= 0 ? '+' : ''}${m.delta_pct}%)</div>`).join('')}
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Insights Report</h2>
        </div>
        <div className="flex items-center gap-2">
          <input value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-28" />
          <button onClick={load} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
          </button>
          <button onClick={printPdf} disabled={!report} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
            <Printer className="w-4 h-4" /> PDF
          </button>
          <button onClick={downloadText} disabled={!report} className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1">
            <Download className="w-4 h-4" /> TXT
          </button>
        </div>
      </div>
      <div className="p-4">
        {report && (
          <>
            <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
            <div className="text-xs text-gray-500 mb-3">Generated {new Date(report.generated_at).toLocaleString()} · est. {report.page_count_estimate} pages</div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {report.metrics.map(m => (
                <div key={m.label} className="border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500">{m.label}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-lg font-bold text-gray-900">{m.value.toLocaleString()}</div>
                    <div className={`text-xs ${m.delta_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.delta_pct >= 0 ? '+' : ''}{m.delta_pct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {report.sections.map(s => (
                <div key={s.heading} className="border-l-4 border-indigo-500 pl-3">
                  <div className="text-xs font-semibold uppercase text-indigo-700">{s.heading}</div>
                  <div className="text-sm text-gray-800 leading-relaxed">{s.body}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
