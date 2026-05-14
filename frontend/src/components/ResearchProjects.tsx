type ProjectStatus = 'running' | 'completed' | 'paused'

interface Project {
  id: number
  name: string
  domain: string
  iteration: string
  status: ProjectStatus
  hypothesis: string
  lastUpdated: string
  experimentsRun: number
  breakthrough: string
}

const projects: Project[] = [
  {
    id: 1,
    name: 'Cancer Immunotherapy Optimization',
    domain: 'Oncology / Immunology',
    iteration: 'Iteration 3/5',
    status: 'running',
    hypothesis: 'PD-1 checkpoint blockade combined with CAR-T cells targeting HER2 antigen may achieve 40% higher remission rates in triple-negative breast cancer by leveraging synergistic immune activation pathways.',
    lastUpdated: '12 min ago',
    experimentsRun: 18,
    breakthrough: '~2 iterations',
  },
  {
    id: 2,
    name: 'CRISPR Gene Editing Efficiency',
    domain: 'Genomics / Gene Therapy',
    iteration: 'Iteration 5/5',
    status: 'completed',
    hypothesis: 'Modified Cas9 with enhanced nuclear localization signals and optimized guide RNA secondary structures achieves 94% on-target editing with off-target events reduced below 0.01%.',
    lastUpdated: '3 days ago',
    experimentsRun: 31,
    breakthrough: 'Achieved',
  },
  {
    id: 3,
    name: 'Protein Folding Prediction',
    domain: 'Structural Biology',
    iteration: 'Iteration 2/5',
    status: 'paused',
    hypothesis: 'Integrating evolutionary co-variation data with molecular dynamics simulations predicts intrinsically disordered protein regions with TM-score exceeding 0.87 for neurodegenerative disease targets.',
    lastUpdated: '2 days ago',
    experimentsRun: 9,
    breakthrough: '~3 iterations',
  },
  {
    id: 4,
    name: 'Novel Antibiotics Discovery',
    domain: 'Microbiology / Pharmacology',
    iteration: 'Iteration 1/5',
    status: 'running',
    hypothesis: 'Synthetic peptides derived from deep-sea extremophile bacteria disrupt gram-negative outer membrane integrity without triggering resistance mechanisms due to their unique amphipathic helical structure.',
    lastUpdated: '4 hr ago',
    experimentsRun: 5,
    breakthrough: '~4 iterations',
  },
]

const statusConfig: Record<ProjectStatus, { label: string; dot: string; badge: string }> = {
  running: { label: 'Running', dot: 'bg-blue-400', badge: 'bg-blue-900/50 text-blue-300' },
  completed: { label: 'Completed', dot: 'bg-green-400', badge: 'bg-green-900/50 text-green-300' },
  paused: { label: 'Paused', dot: 'bg-yellow-400', badge: 'bg-yellow-900/50 text-yellow-300' },
}

export default function ResearchProjects() {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Active Research Projects</h2>
      <div className="grid grid-cols-2 gap-5">
        {projects.map((p) => {
          const cfg = statusConfig[p.status]
          return (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-700/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-semibold text-white text-sm leading-snug">{p.name}</h3>
                  <p className="text-xs text-indigo-400 mt-0.5">{p.domain}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${p.status === 'running' ? 'animate-pulse' : ''}`}></span>
                  {cfg.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-400 bg-gray-800 px-2.5 py-1 rounded-lg">{p.iteration}</span>
                <span className="text-xs text-gray-500">{p.experimentsRun} experiments run</span>
                <span className="text-xs text-gray-500">Breakthrough: {p.breakthrough}</span>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
                <div className="text-xs text-gray-400 font-medium mb-1">Current Hypothesis</div>
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{p.hypothesis}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Updated {p.lastUpdated}</span>
                <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View Details →</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
