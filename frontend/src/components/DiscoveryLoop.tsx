type StepStatus = 'completed' | 'active' | 'pending'

interface Step {
  id: number
  name: string
  status: StepStatus
  summary: string
}

const steps: Step[] = [
  {
    id: 1,
    name: 'Hypothesis Generation',
    status: 'completed',
    summary: 'LLM synthesized 14 candidate hypotheses from literature. Top candidate: PD-1/CAR-T combination with predicted 40% efficacy improvement. Confidence: 78%.',
  },
  {
    id: 2,
    name: 'Experiment Design',
    status: 'completed',
    summary: 'Automated experimental protocol generated: 6-arm parallel study, n=48 per arm, in-silico pre-screening completed. Wet lab tasks queued for 3 validation runs.',
  },
  {
    id: 3,
    name: 'Results Analysis',
    status: 'active',
    summary: 'Processing batch results from in-vitro assays. 3/6 arms completed. Preliminary data shows 34–41% efficacy range. Statistical model updating...',
  },
  {
    id: 4,
    name: 'Next Iteration',
    status: 'pending',
    summary: 'Awaiting completion of results analysis. Will refine hypothesis priors and generate iteration 4 experimental parameters.',
  },
]

const iterations = [
  { n: 1, hypothesis: 'PD-1 blockade alone increases T-cell activation', experiment: 'In-vitro cytotoxicity assay, 24hr', outcome: 'Partial success — 18% improvement. Insufficient alone.' },
  { n: 2, hypothesis: 'CAR-T HER2 targeting in isolation', experiment: 'Xenograft mouse model, n=12', outcome: 'Success — 28% tumor reduction. Below threshold.' },
  { n: 3, hypothesis: 'Combined PD-1 + CAR-T synergy hypothesis', experiment: 'Multi-arm in-vitro + in-silico parallel study', outcome: 'In progress — preliminary 34–41% efficacy' },
]

const stepColors: Record<StepStatus, string> = {
  completed: 'bg-green-500 border-green-500',
  active: 'bg-blue-500 border-blue-500 animate-pulse',
  pending: 'bg-gray-700 border-gray-600',
}

const stepTextColors: Record<StepStatus, string> = {
  completed: 'text-green-400',
  active: 'text-blue-400',
  pending: 'text-gray-500',
}

const stepBgColors: Record<StepStatus, string> = {
  completed: 'bg-green-950/50 border-green-800/50',
  active: 'bg-blue-950/50 border-blue-800/50',
  pending: 'bg-gray-900 border-gray-800',
}

export default function DiscoveryLoop() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Discovery Loop Pipeline</h2>
        <p className="text-sm text-gray-400">Cancer Immunotherapy Optimization — Iteration 3/5</p>
      </div>

      {/* Pipeline steps */}
      <div className="flex items-stretch gap-3">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 gap-3">
            <div className={`flex-1 rounded-xl border p-5 ${stepBgColors[step.status]}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-6 h-6 rounded-full border-2 ${stepColors[step.status]} flex items-center justify-center`}>
                  {step.status === 'completed' && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {step.status === 'active' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={`text-sm font-semibold ${stepTextColors[step.status]}`}>{step.name}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{step.summary}</p>
            </div>
            {idx < steps.length - 1 && (
              <div className="text-gray-600 text-xl">›</div>
            )}
          </div>
        ))}
      </div>

      {/* Iteration history */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-white text-sm">Iteration History</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 w-8">Iter.</th>
              <th className="text-left px-6 py-3">Hypothesis</th>
              <th className="text-left px-6 py-3">Experiment</th>
              <th className="text-left px-6 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {iterations.map((it) => (
              <tr key={it.n} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-3.5 text-indigo-400 font-bold">{it.n}</td>
                <td className="px-6 py-3.5 text-gray-300 text-xs leading-relaxed">{it.hypothesis}</td>
                <td className="px-6 py-3.5 text-gray-400 text-xs">{it.experiment}</td>
                <td className="px-6 py-3.5 text-gray-300 text-xs">{it.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
