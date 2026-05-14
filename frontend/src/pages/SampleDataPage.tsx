import { useState } from 'react';
import { Database, Plus, Beaker, FlaskConical, Microscope, BarChart2, Users, BookOpen } from 'lucide-react';
import { api } from '../api';

type EntityDef = {
  entity: string;
  label: string;
  count: number;
  description: string;
  Icon: typeof Beaker;
};

const ENTITIES: EntityDef[] = [
  { entity: 'projects', label: 'Research Projects', count: 8, description: 'Real R&D programs (LaH10 superconductors, CRISPR-Cas13 diagnostics, fusion RL control, etc.).', Icon: Beaker },
  { entity: 'researchers', label: 'Researchers', count: 10, description: 'Notable scientists with realistic h-indices and institutions (UC Berkeley, DeepMind, Caltech, MPI).', Icon: Users },
  { entity: 'hypotheses', label: 'Hypotheses', count: 7, description: 'Domain-realistic statements with confidence scores and supporting/contradicting evidence. Requires existing projects.', Icon: FlaskConical },
  { entity: 'experiments', label: 'Experiments', count: 7, description: 'Concrete designs and methodologies (DAC pressure sweep, plasma RL test, scRNA-seq). Requires existing hypotheses.', Icon: Microscope },
  { entity: 'results', label: 'Results', count: 6, description: 'Outcomes with significance, breakthrough flags, and conclusions. Requires existing experiments.', Icon: BarChart2 },
  { entity: 'publications', label: 'Publications', count: 7, description: 'Realistic titles in Nature, Cell, Science, The Lancet, Joule. Requires existing projects.', Icon: BookOpen },
];

const ICON_BG: Record<string, string> = {
  projects: 'bg-indigo-100 text-indigo-600',
  researchers: 'bg-amber-100 text-amber-600',
  hypotheses: 'bg-violet-100 text-violet-600',
  experiments: 'bg-sky-100 text-sky-600',
  results: 'bg-emerald-100 text-emerald-600',
  publications: 'bg-rose-100 text-rose-600',
};

export default function SampleDataPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const run = async (def: EntityDef) => {
    setBusy(def.entity); setError(''); setSuccess('');
    try {
      const res = await api.insertSampleData(def.entity);
      setCounts((c) => ({ ...c, [def.entity]: (c[def.entity] || 0) + res.inserted }));
      setSuccess(`Inserted ${res.inserted} ${def.entity}`);
      setTimeout(() => setSuccess(''), 3500);
    } catch (e: any) {
      setError(e.message || 'Insert failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Database className="w-6 h-6 text-orange-600" /></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sample Data</h2>
            <p className="text-gray-500 text-sm">One-click seeding of domain-realistic R&amp;D rows for development and demos. Each button inserts 5-10 rows; child entities require their parents to exist.</p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-3 mb-4">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ENTITIES.map((def) => {
          const Icon = def.Icon;
          const inserted = counts[def.entity] || 0;
          return (
            <div key={def.entity} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ICON_BG[def.entity] || 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{def.label}</div>
                  <div className="text-xs text-gray-500">Inserts {def.count} rows</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4 flex-1">{def.description}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => run(def)}
                  disabled={busy === def.entity}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {busy === def.entity ? 'Inserting…' : `Add ${def.count} sample ${def.label.toLowerCase()}`}
                </button>
                {inserted > 0 && (
                  <span className="text-xs text-gray-500">+{inserted} inserted this session</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
