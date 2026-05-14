import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Beaker,
  FlaskConical,
  Microscope,
  BookOpen,
  BarChart2,
  Sparkles,
  Database,
  Activity as ActivityIcon,
  TrendingUp,
  Award,
  ArrowRight,
} from 'lucide-react';
import { api } from '../api';

type Stats = {
  counts: Record<string, number>;
  recent_activity: any[];
};

const KPI_DEFS: { key: string; label: string; icon: any; tone: string }[] = [
  { key: 'projects', label: 'Research Projects', icon: Beaker, tone: 'bg-indigo-100 text-indigo-700' },
  { key: 'active_hypotheses', label: 'Active Hypotheses', icon: FlaskConical, tone: 'bg-violet-100 text-violet-700' },
  { key: 'experiments', label: 'Experiments', icon: Microscope, tone: 'bg-sky-100 text-sky-700' },
  { key: 'publications', label: 'Publications', icon: BookOpen, tone: 'bg-rose-100 text-rose-700' },
  { key: 'breakthroughs', label: 'Breakthroughs', icon: Award, tone: 'bg-amber-100 text-amber-700' },
  { key: 'recent_results', label: 'Recent Results', icon: TrendingUp, tone: 'bg-emerald-100 text-emerald-700' },
];

const QUICK_ACTIONS = [
  { to: '/ai-center', label: 'AI Center', desc: 'Hypothesis generation, methods critic, novelty scoring', icon: Sparkles, tone: 'bg-violet-50 hover:bg-violet-100 border-violet-200' },
  { to: '/projects', label: 'Research Projects', desc: 'Manage active R&D programs and lead researchers', icon: Beaker, tone: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
  { to: '/hypotheses', label: 'Hypotheses', desc: 'Track confidence scores and contradicting evidence', icon: FlaskConical, tone: 'bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-200' },
  { to: '/experiments', label: 'Experiments', desc: 'Designs, methodologies and run status', icon: Microscope, tone: 'bg-sky-50 hover:bg-sky-100 border-sky-200' },
  { to: '/sample-data', label: 'Sample Data', desc: 'Seed domain-realistic R&D rows for demos', icon: Database, tone: 'bg-orange-50 hover:bg-orange-100 border-orange-200' },
];

const SPOTLIGHT_JOURNALS = ['Nature', 'Cell', 'Science', 'The Lancet Digital Health', 'NEJM', 'Joule'];
const SPOTLIGHT_RESEARCHERS = [
  { name: 'Jennifer Doudna', inst: 'UC Berkeley' },
  { name: 'Demis Hassabis', inst: 'Google DeepMind' },
  { name: 'David Baker', inst: 'Univ. of Washington' },
  { name: 'Carolyn Bertozzi', inst: 'Stanford' },
  { name: 'Katalin Karikó', inst: 'BioNTech / Penn' },
  { name: 'Svante Pääbo', inst: 'MPI EVA' },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.getDashboardStats();
        if (alive) setStats(data);
      } catch (e: any) {
        if (alive) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const counts = stats?.counts || {};
  const activity = stats?.recent_activity || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lab Dashboard</h2>
            <p className="text-gray-500 text-sm">DiscoverAI overview — discovery loop status, recent activity, and quick actions for the bench.</p>
          </div>
        </div>
        <div className="hidden md:flex flex-wrap gap-1.5 max-w-md justify-end">
          {SPOTLIGHT_JOURNALS.map(j => (
            <span key={j} className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-2.5 py-1">{j}</span>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {KPI_DEFS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{loading ? '—' : (counts[key] ?? 0)}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon, tone }) => (
            <Link key={to} to={to} className={`block rounded-xl border p-4 transition-colors ${tone}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-gray-700" />
                <div className="font-semibold text-gray-900">{label}</div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{desc}</p>
              <div className="text-xs text-gray-700 font-medium flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <Link to="/activity" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>
          </div>
          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Loading activity…</div>
          ) : activity.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No activity yet. Try an AI tool from the AI Center to populate the audit log.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activity.map((it: any) => (
                <li key={it.id} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{it.action}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {it.user_email || 'system'}
                      {it.entity_type ? ` · ${it.entity_type}${it.entity_id ? ` #${it.entity_id}` : ''}` : ''}
                    </div>
                    {it.details && <div className="text-xs text-gray-500 mt-0.5 truncate" title={it.details}>{it.details}</div>}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">{it.created_at ? new Date(it.created_at).toLocaleString() : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Researcher spotlight + journal feel */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Researcher Spotlight</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {SPOTLIGHT_RESEARCHERS.map(r => (
              <li key={r.name} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.inst}</div>
                </div>
                <Link to="/researchers" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Profile</Link>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Indexed venues: Nature · Cell · Science · NEJM · Joule · The Lancet Digital Health
          </div>
        </div>
      </div>
    </div>
  );
}
