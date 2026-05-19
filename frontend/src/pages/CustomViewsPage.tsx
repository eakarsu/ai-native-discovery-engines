import { useState } from 'react';
import { Compass, BarChart3, Grid3x3, FileDown, Settings2 } from 'lucide-react';
import QueryFrequencyChart from '../components/CustomViews/QueryFrequencyChart';
import RelevanceHeatmap from '../components/CustomViews/RelevanceHeatmap';
import IndexConfigPdfExport from '../components/CustomViews/IndexConfigPdfExport';
import RankingRulesEditor from '../components/CustomViews/RankingRulesEditor';

type TabId = 'qf' | 'heatmap' | 'pdf' | 'rules';

const TABS: { id: TabId; label: string; icon: any; type: 'viz' | 'non-viz' }[] = [
  { id: 'qf',      label: 'Query Frequency',    icon: BarChart3, type: 'viz' },
  { id: 'heatmap', label: 'Relevance Heatmap',  icon: Grid3x3,   type: 'viz' },
  { id: 'pdf',     label: 'Index Config PDF',   icon: FileDown,  type: 'non-viz' },
  { id: 'rules',   label: 'Ranking Rules',      icon: Settings2, type: 'non-viz' },
];

export default function CustomViewsPage() {
  const [tab, setTab] = useState<TabId>('qf');

  return (
    <div className="p-6 space-y-4" data-testid="discovery-views-page">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Compass className="w-7 h-7" />
          <div>
            <h1 className="text-2xl font-bold">Discovery Views</h1>
            <p className="text-indigo-100 text-sm mt-1">
              AI-native search &amp; discovery — 2 visualizations + 2 operational tools
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2 flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`ml-1 text-[10px] uppercase px-1.5 py-0.5 rounded ${active ? 'bg-indigo-500' : 'bg-gray-200 text-gray-600'}`}>
                {t.type}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'qf' && <QueryFrequencyChart />}
      {tab === 'heatmap' && <RelevanceHeatmap />}
      {tab === 'pdf' && <IndexConfigPdfExport />}
      {tab === 'rules' && <RankingRulesEditor />}
    </div>
  );
}
