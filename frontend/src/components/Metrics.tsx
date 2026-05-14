const stats = [
  { label: 'Experiments Run', value: '47', sub: '+12 this week', color: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-800/50' },
  { label: 'Avg Iterations to Breakthrough', value: '4.2', sub: '-0.8 vs baseline', color: 'text-green-400', bg: 'bg-green-950/40 border-green-800/50' },
  { label: 'Cache Hit Rate', value: '73%', sub: 'LLM prompt cache', color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800/50' },
  { label: 'Time Saved vs Manual', value: '340 hrs', sub: 'This quarter', color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-800/50' },
]

const iterationData = [
  { project: 'Cancer Immunotherapy', iter: 3, confidence: 78, experiments: 18 },
  { project: 'CRISPR Editing', iter: 5, confidence: 94, experiments: 31 },
  { project: 'Protein Folding', iter: 2, confidence: 61, experiments: 9 },
  { project: 'Novel Antibiotics', iter: 1, confidence: 52, experiments: 5 },
]

const weeklyActivity = [
  { day: 'Mon', experiments: 9 },
  { day: 'Tue', experiments: 14 },
  { day: 'Wed', experiments: 7 },
  { day: 'Thu', experiments: 11 },
  { day: 'Fri', experiments: 6 },
  { day: 'Sat', experiments: 3 },
  { day: 'Sun', experiments: 2 },
]

const maxExp = Math.max(...weeklyActivity.map((d) => d.experiments))

export default function Metrics() {
  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.bg}`}>
            <div className="text-xs text-gray-400 mb-2">{s.label}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Weekly experiment activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Experiment Activity</h3>
          <div className="flex items-end gap-3 h-36">
            {weeklyActivity.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500">{d.experiments}</span>
                <div
                  className="w-full bg-indigo-600 rounded-t-sm transition-all"
                  style={{ height: `${(d.experiments / maxExp) * 100}%` }}
                />
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project confidence tracker */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Hypothesis Confidence by Project</h3>
          <div className="space-y-3">
            {iterationData.map((p) => (
              <div key={p.project}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="truncate mr-2">{p.project}</span>
                  <span className="shrink-0">{p.confidence}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p.confidence >= 80 ? 'bg-green-500' : p.confidence >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                    style={{ width: `${p.confidence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Iteration breakdown table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Project Performance Breakdown</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3">Project</th>
              <th className="text-left px-6 py-3">Current Iteration</th>
              <th className="text-left px-6 py-3">Confidence</th>
              <th className="text-left px-6 py-3">Experiments Run</th>
              <th className="text-left px-6 py-3">Est. Compute Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {iterationData.map((p) => (
              <tr key={p.project} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-3.5 text-gray-200 font-medium">{p.project}</td>
                <td className="px-6 py-3.5 text-indigo-400">Iter. {p.iter}</td>
                <td className="px-6 py-3.5">
                  <span className={`font-semibold ${p.confidence >= 80 ? 'text-green-400' : p.confidence >= 60 ? 'text-indigo-400' : 'text-amber-400'}`}>
                    {p.confidence}%
                  </span>
                </td>
                <td className="px-6 py-3.5 text-gray-400">{p.experiments}</td>
                <td className="px-6 py-3.5 text-gray-400">{(p.experiments * 4.2).toFixed(0)} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
