import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProjectsPage from './components/Projects/ProjectsPage';
import HypothesesPage from './components/Hypotheses/HypothesesPage';
import ExperimentsPage from './components/Experiments/ExperimentsPage';
import ResultsPage from './components/Results/ResultsPage';
import ResearchersPage from './components/Researchers/ResearchersPage';
import PublicationsPage from './components/Publications/PublicationsPage';
import AICenter from './components/AICenter';
import ActivityPage from './components/ActivityPage';
import SearchPage from './components/SearchPage';
import ExportsPage from './components/ExportsPage';
import SampleDataPage from './pages/SampleDataPage';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/hypotheses" element={<HypothesesPage />} />
                <Route path="/experiments" element={<ExperimentsPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/researchers" element={<ResearchersPage />} />
                <Route path="/publications" element={<PublicationsPage />} />
                <Route path="/ai-center" element={<AICenter />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/exports" element={<ExportsPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
