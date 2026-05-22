import { useEffect, useState } from 'react';

export default function QueryDriftMonitor() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/query-drift-monitor')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Query Drift Monitor</h2>
      <p className="text-gray-600 mb-6">Detect retrieval quality drift across corpora, sessions, and ranking rules.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {data && Object.entries(data.summary).map(([key, value]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs uppercase text-gray-500">{key.replaceAll('_', ' ')}</div>
            <div className="text-2xl font-bold">{String(value)}</div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg">
        {(data?.drifts || []).map((item: any) => (
          <div key={item.query} className="p-4 border-b border-gray-100">
            <div className="font-semibold">{item.query}</div>
            <div className="text-sm text-gray-600">{item.corpus} - delta {item.delta} - {item.cause}</div>
            <div className="text-sm text-indigo-700 mt-1">{item.action}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
