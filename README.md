# HealthSync APP — Multi-Agent Prior Authorization Automation

A multi-agent prior authorization (PA) automation system that reduces PA processing time from **days to minutes** through intelligent agent orchestration.

Built with **Next.js 16**, **TypeScript**, **Elasticsearch** (ES|QL + Search), and **Gemini AI** (Google).

---

## Quick Start (2 minutes)

```bash
git clone https://github.com/yatinkalra22/health-sync-app.git
cd health-sync-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app runs fully in **demo mode** with no configuration needed.

Click a **Quick Demo Scenario** on the dashboard, then click **Run AI Agents** to see the 5-agent pipeline in action.

---

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, agent workflow, data flow, Elasticsearch indices |
| [Tech Stack](docs/TECH-STACK.md) | Full dependency list with versions and purpose |
| [Setup Guide](docs/SETUP-GUIDE.md) | Step-by-step setup for Elasticsearch, Gemini AI, and FHIR |
| [Testing & Demo](docs/TESTING-AND-DEMO.md) | Mock mode vs production mode, demo walkthrough, API testing |

---

## What It Does

Prior authorization is healthcare's biggest administrative bottleneck — costing **$150B annually** in the US. HealthSync APP automates the entire PA workflow using 5 specialized AI agents:

1. **Coordinator Agent** — Orchestrates the full PA pipeline, manages state, and writes audit logs for every PHI access
2. **Clinical Data Gatherer** — Queries FHIR patient data from Elasticsearch using **ES|QL** aggregations across conditions, medications, procedures, and observations
3. **Policy Analyzer** — Searches payer policy documents using **ES|QL stats** and hybrid search to match coverage criteria
4. **Documentation Assembler** — Generates structured PA packets with medical necessity narratives
5. **Compliance Validator** — Validates CMS timeline compliance (72h expedited / 7-day standard), documentation completeness, and flags cases for human review

When a clinician submits a PA request, the agents run in sequence, and the result is either auto-approved or escalated to a human reviewer (HITL) with full reasoning visible.

---

## Elasticsearch Integration

HealthSync uses Elasticsearch as both its data layer and analytics engine:

- **ES|QL Queries** — ClinicalDataGatherer uses `FROM ... | WHERE ... | STATS` to aggregate patient clinical profiles across indices. PolicyAnalyzer uses ES|QL for payer policy statistics.
- **Search** — Hybrid keyword + term search on payer policies (`bool` queries with `must`/`should` clauses)
- **ES|QL Analytics** — The analytics dashboard is powered by ES|QL queries (`STATS COUNT(*) BY status`, `AVG(compliance_score)`, etc.)
- **8 Indices** — patients, conditions, medications, procedures, observations, pa-requests, policies, audit-logs
- **Audit Logging** — Every agent action and PHI access is logged to `healthsync-audit-logs` with timestamps, duration, and compliance metadata

---

## Running Modes

### Demo Mode (Default — No Setup Required)

When Elasticsearch and Gemini API keys are not configured, the app runs in demo mode with realistic sample PA requests covering different statuses. Agents use simulated processing that mirrors the real pipeline.

```bash
npm run dev
# That's it — open http://localhost:3000
```

### Production Mode (Elasticsearch + Gemini AI)

For live Elasticsearch queries and AI-generated narratives:

```bash
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)
npm run setup:es          # Create 8 Elasticsearch indices
npm run setup:policies    # Seed sample payer policies
npm run dev
```

### With FHIR Server (Optional)

The FHIR server is only needed if you want to load real FHIR patient data. The app works fully without it.

```bash
# Requires Docker Desktop to be running
docker compose up -d

# Wait ~2 minutes for initialization, then verify
curl http://localhost:8080/fhir/metadata

# Load synthetic patient data (requires Java for Synthea)
npm run load:fhir-data
npm run index:fhir
```

To stop the FHIR server:

```bash
docker compose down        # Stop containers (data persists)
docker compose down -v     # Stop and delete all data
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required? | Description |
|----------|-----------|-------------|
| `ELASTICSEARCH_CLOUD_ID` | No | [Elastic Cloud](https://cloud.elastic.co/) > Deployment > Cloud ID. Leave empty for demo mode. |
| `ELASTICSEARCH_API_KEY` | No | Elastic Cloud > Stack Management > API Keys. Leave empty for demo mode. |
| `GEMINI_API_KEY` | No | [Google AI Studio](https://aistudio.google.com/apikey) > API Keys. Leave empty — agents fall back to generated text. |
| `FHIR_SERVER_URL` | No | Only needed if running the FHIR Docker container. Defaults to `http://localhost:8080/fhir`. |
| `NEXT_PUBLIC_APP_URL` | No | Defaults to `http://localhost:3000`. |

**All variables are optional.** The app gracefully falls back to demo mode for any unconfigured service.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup:es` | Create Elasticsearch indices (requires ES credentials) |
| `npm run setup:policies` | Seed sample payer policies into Elasticsearch |
| `npm run health-check` | Check connectivity to all services |
| `npm run load:fhir-data` | Load FHIR bundles into the FHIR server |
| `npm run index:fhir` | Index FHIR server data into Elasticsearch |

---

## Project Structure

```
health-sync-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (Server Component)
│   ├── layout.tsx                # Root layout with sidebar
│   ├── new/page.tsx              # New PA submission form
│   ├── analytics/page.tsx        # Analytics dashboard (Recharts)
│   ├── audit/page.tsx            # HIPAA audit log viewer
│   ├── agents/page.tsx           # Agent monitor
│   ├── pa/[id]/page.tsx          # PA detail view
│   ├── error.tsx                 # Error boundary
│   ├── global-error.tsx          # Global error boundary
│   ├── not-found.tsx             # 404 page
│   ├── loading.tsx               # Loading state
│   └── api/
│       ├── pa-requests/          # GET, POST PA requests
│       ├── pa-requests/[id]/     # GET, PATCH individual PA
│       ├── pa-updates/[id]/      # SSE real-time updates
│       ├── agents/execute/       # POST trigger agent processing
│       ├── analytics/            # GET PA analytics (ES|QL powered)
│       └── health/               # Health check endpoint
│
├── components/
│   ├── dashboard/                # PADashboard, PARequestCard, MetricsSummary,
│   │                               ImpactHeroBanner, QuickDemoScenarios
│   ├── pa-details/               # PADetailView, PatientInfo, ClinicalDataPanel,
│   │                               PolicyAnalysisPanel, PAPacketPanel, AgentTimeline
│   ├── analytics/                # AnalyticsDashboard (Recharts charts)
│   ├── agents/                   # AgentMonitor
│   ├── audit/                    # AuditLogViewer (HIPAA audit trail)
│   ├── forms/                    # NewPAForm
│   └── ui/                       # Sidebar, StatusBadge, ConfidenceRing
│
├── lib/
│   ├── agents/                   # AI agent implementations
│   │   ├── BaseAgent.ts          # Abstract base with LLM + graceful fallback
│   │   ├── CoordinatorAgent.ts   # Workflow orchestrator + audit logging
│   │   ├── ClinicalDataGatherer.ts  # ES|QL patient profile queries
│   │   ├── PolicyAnalyzer.ts     # ES|QL policy stats + hybrid search
│   │   ├── DocumentationAssembler.ts
│   │   └── ComplianceValidator.ts
│   ├── services/
│   │   ├── elasticsearch.ts      # ES client + ES|QL helper + audit logging
│   │   ├── fhir.ts               # FHIR server client
│   │   └── llm.ts                # Google Gemini wrapper
│   ├── types/                    # TypeScript types (pa.ts, fhir.ts, agent.ts)
│   ├── constants.ts              # All config (indices, statuses, payers, etc.)
│   └── utils/cn.ts               # Tailwind class merge utility
│
├── actions/
│   └── pa-actions.ts             # Server Actions: create, approve, deny, process PA
│
├── mock/                         # Demo mode data and simulation
│   ├── data/                     # Sample PA requests, scenarios, analytics
│   ├── agents/                   # Demo agent runner (simulated pipeline)
│   ├── policies/                 # Sample payer policies
│   └── store/                    # In-memory demo store
│
├── hooks/                        # React hooks (usePARequests, useRealTimeUpdates)
├── scripts/                      # Setup and data loading scripts
├── docker-compose.yml            # FHIR server + PostgreSQL
├── .env.example                  # Environment variable template
└── .env                          # Your environment variables (gitignored)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pa-requests` | List PA requests (query: `?status=processing&limit=50`) |
| `POST` | `/api/pa-requests` | Create a new PA request |
| `GET` | `/api/pa-requests/:id` | Get PA request details |
| `PATCH` | `/api/pa-requests/:id` | Update PA request (status, notes) |
| `POST` | `/api/agents/execute` | Trigger agent processing for a PA |
| `GET` | `/api/pa-updates/:id` | SSE stream for real-time PA status updates |
| `GET` | `/api/analytics` | PA workflow analytics (ES|QL powered) |
| `GET` | `/api/health` | Health check (ES, Gemini, FHIR status) |

All mutation endpoints use **Zod validation**. Status values: `submitted`, `processing`, `ready_for_review`, `hitl_required`, `approved`, `denied`, `failed`.

---

## Key Features

- **Multi-Agent Pipeline** — 5 specialized agents process PA requests end-to-end
- **ES|QL Integration** — Agents use ES|QL for cross-index patient profiling and policy analytics
- **Graceful Degradation** — Works without Elasticsearch, Gemini, or FHIR; each service falls back independently
- **Analytics Dashboard** — Recharts visualizations: status distribution, payer breakdown, processing timeline, agent performance
- **Audit Log Viewer** — HIPAA-compliant audit trail with PHI access filtering and ES|QL queries per event
- **Demo Mode** — Full functionality without any external services
- **Real-Time Updates** — SSE streaming + SWR polling for live status changes
- **HITL Workflow** — Approve/deny buttons with denial reason input for human review
- **Retry on Failure** — Failed PAs show a retry button to re-run the agent pipeline
- **PA Packet Generation** — Medical necessity narrative, supporting evidence, policy compliance
- **CMS Compliance** — Timeline validation (72h expedited / 7-day standard deadlines)
- **Error Boundaries** — Route-level and global error handling with retry and navigation
- **Responsive Design** — Mobile drawer sidebar, adaptive layouts
- **Security Headers** — HSTS, X-Frame-Options, CSP, Referrer-Policy

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Data Fetching | SWR (polling) + SSE (streaming) |
| Validation | Zod |
| Search & Storage | Elasticsearch 9.3+ (ES|QL, Search, Audit Logs) |
| AI / LLM | Google Gemini (via `@google/generative-ai`) |
| Healthcare | HAPI FHIR R4 Server (Docker) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Troubleshooting

### App won't start
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Elasticsearch connection fails
```bash
# Verify credentials
npm run health-check

# Check your .env has correct ELASTICSEARCH_CLOUD_ID and ELASTICSEARCH_API_KEY
# The app will fall back to demo mode if ES is unavailable
```

### Agents fail with "index_not_found_exception"
```bash
# Create the required Elasticsearch indices
npm run setup:es
npm run setup:policies
```

### Agents fail with API errors
The Gemini API key may be invalid or have quota issues. Agents will automatically fall back to generated text — the pipeline still completes successfully. Get a free API key at https://aistudio.google.com/apikey.

### Docker / FHIR issues
```bash
docker compose down && docker compose up -d
docker logs healthsync-fhir     # Check for errors
# FHIR server takes ~2 minutes to initialize on first start
```

### "Rendered more hooks" error
Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+R) or restart the dev server.

---

## Deployment

The app is optimized for **Vercel** deployment:

```bash
npm i -g vercel
vercel
```

Set environment variables in the Vercel dashboard. The app works in demo mode if no credentials are provided.

---

## License

MIT
