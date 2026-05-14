const BASE = '/api';
function getToken() { return localStorage.getItem('token') || ''; }
function authHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }; }
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...(options?.headers || {}) } });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Request failed' })); throw new Error(err.error || 'Request failed'); }
  return res.json();
}

export const api = {
  login: (email: string, password: string) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<any>('/auth/me'),
  getProjects: () => request<any[]>('/projects'),
  getProject: (id: number) => request<any>(`/projects/${id}`),
  createProject: (d: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(d) }),
  updateProject: (id: number, d: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteProject: (id: number) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
  getHypotheses: () => request<any[]>('/hypotheses'),
  getHypothesis: (id: number) => request<any>(`/hypotheses/${id}`),
  createHypothesis: (d: any) => request<any>('/hypotheses', { method: 'POST', body: JSON.stringify(d) }),
  updateHypothesis: (id: number, d: any) => request<any>(`/hypotheses/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteHypothesis: (id: number) => request<any>(`/hypotheses/${id}`, { method: 'DELETE' }),
  getExperiments: () => request<any[]>('/experiments'),
  getExperiment: (id: number) => request<any>(`/experiments/${id}`),
  createExperiment: (d: any) => request<any>('/experiments', { method: 'POST', body: JSON.stringify(d) }),
  updateExperiment: (id: number, d: any) => request<any>(`/experiments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteExperiment: (id: number) => request<any>(`/experiments/${id}`, { method: 'DELETE' }),
  getResults: () => request<any[]>('/results'),
  getResult: (id: number) => request<any>(`/results/${id}`),
  createResult: (d: any) => request<any>('/results', { method: 'POST', body: JSON.stringify(d) }),
  updateResult: (id: number, d: any) => request<any>(`/results/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteResult: (id: number) => request<any>(`/results/${id}`, { method: 'DELETE' }),
  getResearchers: () => request<any[]>('/researchers'),
  getResearcher: (id: number) => request<any>(`/researchers/${id}`),
  createResearcher: (d: any) => request<any>('/researchers', { method: 'POST', body: JSON.stringify(d) }),
  updateResearcher: (id: number, d: any) => request<any>(`/researchers/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteResearcher: (id: number) => request<any>(`/researchers/${id}`, { method: 'DELETE' }),
  getPublications: () => request<any[]>('/publications'),
  getPublication: (id: number) => request<any>(`/publications/${id}`),
  createPublication: (d: any) => request<any>('/publications', { method: 'POST', body: JSON.stringify(d) }),
  updatePublication: (id: number, d: any) => request<any>(`/publications/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deletePublication: (id: number) => request<any>(`/publications/${id}`, { method: 'DELETE' }),
  generateHypothesis: (d: any) => request<any>('/ai/generate-hypothesis', { method: 'POST', body: JSON.stringify(d) }),
  designExperiment: (d: any) => request<any>('/ai/design-experiment', { method: 'POST', body: JSON.stringify(d) }),
  analyzeResults: (d: any) => request<any>('/ai/analyze-results', { method: 'POST', body: JSON.stringify(d) }),
  discoveryReport: (d: any) => request<any>('/ai/discovery-report', { method: 'POST', body: JSON.stringify(d) }),
  // apply3 AI tools
  literatureGapFinder: (d: any) => request<any>('/ai/literature-gap-finder', { method: 'POST', body: JSON.stringify(d) }),
  predictExperimentOutcome: (d: any) => request<any>('/ai/predict-experiment-outcome', { method: 'POST', body: JSON.stringify(d) }),
  replicationRiskScorer: (d: any) => request<any>('/ai/replication-risk-scorer', { method: 'POST', body: JSON.stringify(d) }),
  noveltyAssessor: (d: any) => request<any>('/ai/novelty-assessor', { method: 'POST', body: JSON.stringify(d) }),
  methodsCritic: (d: any) => request<any>('/ai/methods-critic', { method: 'POST', body: JSON.stringify(d) }),
  // utility
  getActivity: (params?: { action?: string; entity_type?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.action) sp.set('action', params.action);
    if (params?.entity_type) sp.set('entity_type', params.entity_type);
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return request<any[]>(`/activity${qs ? `?${qs}` : ''}`);
  },
  search: (params: { q: string; entity?: string; status?: string; domain?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    sp.set('q', params.q || '');
    if (params.entity) sp.set('entity', params.entity);
    if (params.status) sp.set('status', params.status);
    if (params.domain) sp.set('domain', params.domain);
    if (params.limit) sp.set('limit', String(params.limit));
    return request<any>(`/search?${sp.toString()}`);
  },
  // sample-data (Dev Tools / Admin)
  insertSampleData: (entity: string) => request<{ inserted: number; entity: string }>(`/admin/sample-data/${entity}`, { method: 'POST' }),
  // dashboard
  getDashboardStats: () => request<{ counts: Record<string, number>; recent_activity: any[] }>('/dashboard/stats'),
  exportProjectsCsvUrl: () => '/api/exports/projects.csv',
  exportPublicationsCsvUrl: () => '/api/exports/publications.csv',
  // helper that downloads CSV with auth header, since attribute-based <a> can't carry bearer
  downloadCsv: async (path: string, filename: string) => {
    const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  },
};
