import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FlaskConical, Beaker, Microscope, BarChart2, Users, BookOpen, Sparkles, LogOut, User, Search, Activity, Download, Database, LayoutDashboard, Globe, Quote, Trophy, Bot, Layers, Compass } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Research Projects', icon: Beaker },
  { path: '/hypotheses', label: 'Hypotheses', icon: FlaskConical },
  { path: '/experiments', label: 'Experiments', icon: Microscope },
  { path: '/results', label: 'Results', icon: BarChart2 },
  { path: '/researchers', label: 'Researchers', icon: Users },
  { path: '/publications', label: 'Publications', icon: BookOpen },
];
const aiItems = [{ path: '/ai-center', label: 'AI Center', icon: Sparkles }];
const discoveryViewItems = [
  { path: '/custom-views', label: 'Discovery Views', icon: Compass },
];
const retrievalItems = [
  { path: '/corpus-index', label: 'Corpus Index', icon: Database },
  { path: '/hybrid-retrieval', label: 'Hybrid Retrieval', icon: Layers },
  { path: '/citation-tracker', label: 'Citation Tracker', icon: Quote },
  { path: '/web-crawl', label: 'Live Web Crawl', icon: Globe },
  { path: '/benchmark-eval', label: 'Benchmark Eval', icon: Trophy },
  { path: '/discovery-agent', label: 'Discovery Agent', icon: Bot },
];
const utilityItems = [
  { path: '/search', label: 'Search & Filter', icon: Search },
  { path: '/activity', label: 'Activity Feed', icon: Activity },
  { path: '/exports', label: 'Data Exports', icon: Download },
];
const adminItems = [
  { path: '/sample-data', label: 'Sample Data', icon: Database },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
  const pageTitle = [...navItems, ...aiItems, ...discoveryViewItems, ...retrievalItems, ...utilityItems, ...adminItems].find(i => location.pathname.startsWith(i.path))?.label || 'DiscoverAI';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">DiscoverAI</div>
              <div className="text-gray-400 text-xs">Discovery Engine</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Features</div>
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">AI Tools</div>
          {aiItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">Discovery Views</div>
          {discoveryViewItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-fuchsia-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">Retrieval Engine</div>
          {retrievalItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">Utilities</div>
          {utilityItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 mt-4">Admin / Dev Tools</div>
          {adminItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${location.pathname.startsWith(path) ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-gray-300" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name || 'User'}</div>
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.name}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"><LogOut className="w-4 h-4" />Logout</button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
