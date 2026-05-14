# DiscoverAI — Audit Note

This project is part of the `extras/` sub-products and was promoted to top-level review during apply pass 3.

**Stack:** Express + Postgres backend (`discovery_db`) on port 3002, Vite + React + TypeScript frontend on 5173, Tailwind, JWT, OpenRouter AI (`anthropic/claude-haiku-4.5`).

**Login:** `admin@demo.com / demo123`

## Existing AI surface (pre-apply3)

`backend/routes/ai.js` already shipped with 4 AI endpoints, all behind JWT and using a shared `callAI()` helper:

- `POST /api/ai/generate-hypothesis`
- `POST /api/ai/design-experiment`
- `POST /api/ai/analyze-results`
- `POST /api/ai/discovery-report`

Frontend exposes these via `frontend/src/components/AICenter.tsx` (`/ai-center` route).

## Feature add (8 features)

Added in the apply-pass-3 feature-add round. Full per-feature detail in:
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/feature_add_ai-native-discovery-engines.md`.

### 5 new AI features (BE endpoint + FE tile in `/ai-center`)

| Endpoint | Tile in AI Center | What it does |
|---|---|---|
| `POST /api/ai/literature-gap-finder` | "Literature Gap Finder" | Maps knowns + open questions + high-leverage gaps for a project domain or focus area |
| `POST /api/ai/predict-experiment-outcome` | "Predict Experiment Outcome" | Forecasts likely outcome, effect size, failure modes and decision rule before an experiment runs |
| `POST /api/ai/replication-risk-scorer` | "Replication Risk Scorer" | 0-10 risk score with risk factors, robustness indicators, replication plan, statistical critique |
| `POST /api/ai/novelty-assessor` | "Novelty Assessor" | 0-10 novelty score for a draft abstract, prior-art mapping, framing suggestions |
| `POST /api/ai/methods-critic` | "Methods Critic" | Peer-review critique of a methods section: reproducibility, statistics, controls, ethics, score |

All five route through the existing `callAI()` helper, raise a structured 503 when `OPENROUTER_API_KEY` is missing, validate required fields where applicable, and write to `activity_log` via a best-effort `logActivity()` helper.

### 3 new utility features

| Surface | Endpoint(s) | FE page |
|---|---|---|
| CSV export of main entities | `GET /api/exports/projects.csv`, `GET /api/exports/publications.csv` | `/exports` (bearer-aware Blob download) |
| Search + filter UI | `GET /api/search?q=&entity=&status=&domain=&limit=` (cross-entity ILIKE) | `/search` (per-entity tables) |
| Audit log / activity feed | `GET /api/activity?action=&entity_type=&limit=`, `POST /api/activity` (new `activity_log` table) | `/activity` (filterable table) |

### Schema changes

- Added `activity_log` table to `backend/db/schema.sql` (with `idx_activity_log_created_at` desc index).
- Existing tables untouched. `start.sh` re-runs `schema.sql` so the new table is created on every boot (matches the project's existing pattern of destructive boot migrations).

### Files written / modified

**New (6):**
- `backend/routes/activity.js`
- `backend/routes/exports.js`
- `backend/routes/search.js`
- `frontend/src/components/ActivityPage.tsx`
- `frontend/src/components/SearchPage.tsx`
- `frontend/src/components/ExportsPage.tsx`

**Modified (7):**
- `backend/server.js` (3 new `app.use`)
- `backend/routes/ai.js` (5 endpoints + 503 plumbing + `logActivity`)
- `backend/db/schema.sql` (+ activity_log)
- `frontend/src/App.tsx` (3 routes)
- `frontend/src/api.ts` (8 client methods + downloader)
- `frontend/src/components/Layout.tsx` (Utilities nav section)
- `frontend/src/components/AICenter.tsx` (5 tool tiles + 5 dispatch branches)

### Validation

- `node --check` PASS for every backend file touched.
- `tsc --noEmit` PASS for the entire frontend.
- Smoke test: `start.sh` came up in ~2 s; `POST /api/auth/login` returned 200 with a valid JWT; `/api/search`, `/api/exports/projects.csv`, `/api/activity`, and one new AI endpoint all responded correctly under that bearer token; field-validation 400 confirmed.
- 0 `npm install` runs, 0 new external dependencies.

## Sample data buttons

Added a developer-facing **Sample Data** page (`/sample-data`, sidebar section "Admin / Dev Tools") that one-click-seeds domain-realistic R&D rows for each main schema entity (excluding `users` and `activity_log`).

**Backend (new file `backend/routes/sample_data.js`):**
- `POST /api/admin/sample-data/:entity` — JWT-protected, inserts 5-10 realistic rows, returns `{inserted: N, entity}`.
- `GET  /api/admin/sample-data` — listing of available entities and their row counts.
- Mounted via one new line in `server.js`: `app.use('/api/admin', require('./routes/sample_data'));`
- Domain content: LaH10 superconductors, CRISPR-Cas13 diagnostics, solid-state Li batteries, AlphaFold-style folding, neural speech decoding, fusion plasma RL on TCV, hypothalamus scRNA-seq, MOF DAC. Real journal names (Nature, Cell, Science, The Lancet Digital Health, Joule). Real-sounding researchers (Doudna, Hassabis, Arnold, Kariko, Bertozzi, LeCun, Charpentier, Baker, Fei-Fei Li, Paabo).
- Child entities (`hypotheses`, `experiments`, `results`, `publications`) resolve parent FK ids at runtime via a `pickIds(table, n)` helper and return a structured 400 if the parent table is empty.

**Frontend:**
- New page `frontend/src/pages/SampleDataPage.tsx` with one card+button per entity, matching the existing `ExportsPage` styling. Inline success toast and per-card session counter.
- New route `/sample-data` in `App.tsx`. New "Admin / Dev Tools" sidebar section in `Layout.tsx` (orange accent, distinct from indigo/violet/emerald sections).
- New `api.insertSampleData(entity)` client method in `api.ts`.

**Per-entity row counts:** projects 8, researchers 10, hypotheses 7, experiments 7, results 6, publications 7.

**Validation:** `node --check` PASS on `server.js` and `sample_data.js`; `tsc --noEmit` PASS for the whole frontend; smoke test on port 3002 (login `admin@demo.com / demo123`) hit all 6 entity endpoints, verified DB row deltas, then deleted the inserted rows. 0 `npm install`, 0 new deps. All 128 pre-existing features untouched.

Full per-step detail: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_ai-native-discovery-engines.md`.

## AI feature samples

Added 2-3 click-to-prefill **sample buttons** on every AI tool in `AICenter.tsx` (the single page that hosts all 9 AI features at `/ai-center`). Each tool now exposes a `samples?: { label; values }[]` field; the renderer paints a pill row above the form and `applySample()` populates every field in one click — user can then hit "Generate" immediately.

**Coverage:** 9 tools × 3 samples = 27 prefill scenarios, all populated with real R&D content (Doudna / Hassabis / Baker / Bertozzi; LaH10 superconductors at 170 GPa; CRISPR-Cas13a SHERLOCK; AlphaFold diffusion on SAbDab / CASP15; mmen-Mg2(dobpdc) MOF DAC; Li6PS5Cl argyrodite solid-state cells; sotorasib CodeBreaK 100 NSCLC; LK-99; TCV tokamak RL; Cas13 lateral-flow clinical validation). Real journals: NEJM 2021, Nature 2023, Lancet, arXiv 2023.

**Files modified:** `frontend/src/components/AICenter.tsx` only. No deps added, no `npm install`. `tsc --noEmit` clean. Smoke test: backend on 3002 + Vite on 5173 booted clean, login JWT issued, Vite compiled `AICenter.tsx` to a 74 KB module with HTTP 200 and no warnings.

Full per-step detail: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_ai-native-discovery-engines.md`.

## Dashboard page

Added a domain-appropriate **Lab Dashboard** as the first sidebar item and the post-login landing route (`/dashboard`).

**Backend (new `backend/routes/dashboard.js`):**
- `GET /api/dashboard/stats` — JWT-protected, returns `{counts, recent_activity}`.
- `counts`: projects, active_hypotheses, hypotheses_total, experiments, experiments_running, publications, researchers, results, breakthroughs, recent_results.
- `recent_activity`: last 10 rows from `activity_log` (id, user_email, action, entity_type, entity_id, details, created_at), ordered desc. Empty array if table missing.
- Per-table `safeCount()` guard so a single failing table never 500s the whole endpoint.
- Mounted via one new line in `server.js`: `app.use('/api/dashboard', require('./routes/dashboard'));`

**Frontend:**
- New page `frontend/src/pages/Dashboard.tsx`. 6 KPI cards (Projects / Active Hypotheses / Experiments / Publications / Breakthroughs / Recent Results), 5 quick-action cards (AI Center, Research Projects, Hypotheses, Experiments, Sample Data), recent-activity list, Researcher Spotlight (Doudna, Hassabis, Baker, Bertozzi, Karikó, Pääbo) + journal pills (Nature, Cell, Science, NEJM, Joule, Lancet Digital Health).
- `Layout.tsx`: added `LayoutDashboard` icon import; prepended `{path:'/dashboard',label:'Dashboard'}` to `navItems` — now the **first** sidebar entry.
- `App.tsx`: added `/dashboard` route; changed default `/` redirect from `/projects` to `/dashboard` so post-login lands on the dashboard.
- `api.ts`: added `getDashboardStats()` client.

**Validation:** `node --check` PASS on `dashboard.js` and `server.js`; `tsc --noEmit` PASS for frontend (exit 0). Smoke test on port 3002 (login `admin@demo.com / demo123`): `/api/dashboard/stats` returned **200** with full counts (projects:15, active_hypotheses:10, experiments:15, publications:15, breakthroughs:3, …) and one activity row; same endpoint returned **401** without bearer. Backend killed, port confirmed clean.

**Constraints honored:** no existing AI feature, sample-prefill, or sample-data code touched. 0 `npm install`, 0 new deps.

Full per-step detail: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_ai-native-discovery-engines.md`.

## Backlog (not done in this pass)

- **NEEDS-PRODUCT-DECISION** — whether the activity log should also persist DB writes (e.g. project create/update/delete), not just AI tool calls. Currently AI-only.
- **NEEDS-PRODUCT-DECISION** — pagination on `/activity` and `/search` (currently capped per-entity).
- **TOO-RISKY** — refactoring `schema.sql` to be non-destructive on boot. Project-wide convention.
- Additional AI tools from the candidate list not implemented this pass: citation network insight, dataset-quality assessor, IP/patent landscape briefer, anomaly detector. Trivial to add following the same pattern.
