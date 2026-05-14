import { useState } from 'react'

const hypotheses = [
  {
    id: 1,
    project: 'Cancer Immunotherapy Optimization',
    title: 'PD-1 + CAR-T synergistic combination achieves 40% remission improvement in TNBC',
    confidence: 78,
    supportingEvidence: [
      'Kim et al. (2024) showed PD-1 blockade increased T-cell trafficking by 3.2x in solid tumors',
      'HER2 CAR-T cells demonstrated complete response in 28% of xenograft models independently',
      'In-silico pathway analysis confirms mechanistic synergy via IL-2 amplification loop',
      'Phase I safety data from analogous combination shows favorable tolerability profile',
      'Biomarker correlation study: high TIL density predicts 2.1x better response to combination',
    ],
    contradictingEvidence: [
      'Risk of cytokine release syndrome increases 40% with dual-agent approach per Smith et al.',
      'Two prior combination trials showed no statistically significant benefit over monotherapy',
    ],
    iteration: 3,
    generatedAt: '2026-05-05 06:30',
  },
  {
    id: 2,
    project: 'Novel Antibiotics Discovery',
    title: 'Deep-sea extremophile peptides disrupt gram-negative outer membranes without triggering resistance',
    confidence: 52,
    supportingEvidence: [
      'Initial screening: 3 of 12 candidate peptides showed MIC below 2 µg/mL against K. pneumoniae',
      'Structural analysis confirms amphipathic helix geometry distinct from known antibiotic classes',
      'No cross-resistance detected with 14 characterized resistance genes in silico screening',
    ],
    contradictingEvidence: [
      'Cytotoxicity assays show 2 of 3 lead peptides have HC50 within 4x of MIC — narrow therapeutic index',
      'In-vivo bioavailability predicted at 12% — significant formulation challenge',
      'One analog from similar class showed rapid resistance induction in clinical setting (Patel 2023)',
    ],
    iteration: 1,
    generatedAt: '2026-05-05 02:15',
  },
]

export default function HypothesisViewer() {
  const [selected, setSelected] = useState(hypotheses[0])
  const [running, setRunning] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => setRunning(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-white">Hypothesis Viewer</h2>
        <select
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          onChange={(e) => setSelected(hypotheses[parseInt(e.target.value)])}
        >
          {hypotheses.map((h, i) => (
            <option key={h.id} value={i}>{h.project}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 mr-6">
            <div className="text-xs text-indigo-400 font-medium mb-1">Iteration {selected.iteration} — Generated {selected.generatedAt}</div>
            <h3 className="text-base font-semibold text-white leading-snug">{selected.title}</h3>
          </div>
          <div className="text-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={selected.confidence >= 70 ? '#6366f1' : selected.confidence >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${selected.confidence} ${100 - selected.confidence}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-white">{selected.confidence}%</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">Confidence</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded flex items-center justify-center">
                <span className="text-green-400 text-xs">+</span>
              </div>
              <span className="text-sm font-medium text-green-400">Supporting Evidence</span>
            </div>
            <ul className="space-y-2">
              {selected.supportingEvidence.map((e, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300 bg-green-950/30 border border-green-900/40 rounded-lg p-2.5 leading-relaxed">
                  <span className="text-green-500 mt-0.5 shrink-0">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded flex items-center justify-center">
                <span className="text-red-400 text-xs">-</span>
              </div>
              <span className="text-sm font-medium text-red-400">Contradicting Evidence</span>
            </div>
            <ul className="space-y-2">
              {selected.contradictingEvidence.map((e, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300 bg-red-950/30 border border-red-900/40 rounded-lg p-2.5 leading-relaxed">
                  <span className="text-red-500 mt-0.5 shrink-0">•</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={handleRun}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
            running
              ? 'bg-indigo-700 text-indigo-200 animate-pulse cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          disabled={running}
        >
          {running ? 'Queuing Experiment...' : 'Run Experiment'}
        </button>
      </div>
    </div>
  )
}
