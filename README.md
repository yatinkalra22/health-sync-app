# HealthSync AI

A multi-agent prior authorization (PA) automation system that reduces PA processing time from **2-7 days to 4-8 hours** through intelligent agent orchestration.

Built with **Next.js 16**, **TypeScript**, **Elasticsearch** (ES|QL + Search), and **Claude AI** (Anthropic).

---

## What It Does

Prior authorization is healthcare's biggest administrative bottleneck - costing **$150B annually** in the US. HealthSync AI automates the entire PA workflow using 5 specialized AI agents:

1. **Coordinator Agent** - Orchestrates the full PA pipeline, manages state, and writes audit logs for every PHI access
2. **Clinical Data Gatherer** - Queries FHIR patient data from Elasticsearch using **ES|QL** aggregations across conditions, medications, procedures, and observations
3. **Policy Analyzer** - Searches payer policy documents using **ES|QL stats** and hybrid search to match coverage criteria
4. **Documentation Assembler** - Generates structured PA packets with medical necessity narratives
5. **Compliance Validator** - Validates CMS timeline compliance (72h expedited / 7-day standard), documentation completeness, and flags cases for human review

When a clinician submits a PA request, the agents run in sequence, and the result is either auto-approved or escalated to a human reviewer (HITL) with full reasoning visible.

---

## Elasticsearch Integration

HealthSync uses Elasticsearch as both its data layer and analytics engine:

- **ES|QL Queries** - ClinicalDataGatherer uses `FROM ... | WHERE ... | STATS` to aggregate patient clinical profiles across indices. PolicyAnalyzer uses ES|QL for payer policy statistics.
- **Search** - Hybrid keyword + term search on payer policies (`bool` queries with `must`/`should` clauses)
- **ES|QL Analytics** - The analytics dashboard is powered by ES|QL queries (`STATS COUNT(*) BY status`, `AVG(compliance_score)`, etc.)
- **8 Indices** - patients, conditions, medications, procedures, observations, pa-requests, policies, audit-logs
- **Audit Logging** - Every agent action and PHI access is logged to `healthsync-audit-logs` with timestamps, duration, and compliance metadata

---

## Demo Mode

The app works **fully without any external services**. When Elasticsearch and Anthropic API keys are not configured, it runs in demo mode with 6 realistic sample PA requests covering different statuses (submitted, processing, ready for review, HITL required, approved, denied).

---

## Getting Started

### Prerequisites

- **Node.js** v20+ ([download](https://nodejs.org/))
- **npm** v10+ (comes with Node.js)
- **Docker** (optional, only for FHIR server) ([download](https://www.docker.com/products/docker-desktop))

### 1. Install Dependencies

```bash
git clone <your-repo-url>
cd health-sync-app
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

```bash
# Elasticsearch (leave empty for demo mode)
ELASTICSEARCH_CLOUD_ID=
ELASTICSEARCH_API_KEY=

# Anthropic Claude AI (leave empty for demo mode)
ANTHROPIC_API_KEY=

# FHIR Server (optional, only if running Docker)
FHIR_SERVER_URL=http://localhost:8080/fhir

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Required? | Where to Get It |
|----------|-----------|-----------------|
| `ELASTICSEARCH_CLOUD_ID` | No (demo mode) | [Elastic Cloud](https://cloud.elastic.co/) > Deployment > Cloud ID |
| `ELASTICSEARCH_API_KEY` | No (demo mode) | Elastic Cloud > Stack Management > API Keys |
| `ANTHROPIC_API_KEY` | No (demo mode) | [Anthropic Console](https://console.anthropic.com/) > API Keys |
| `FHIR_SERVER_URL` | No | Only needed if running the FHIR Docker container |
| `NEXT_PUBLIC_APP_URL` | No | Defaults to `http://localhost:3000` |

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you'll see the PA Dashboard with demo data.

### 4. Production Build

```bash
npm run build
npm start
```

---

## Docker - FHIR Server (Optional)

The `docker-compose.yml` runs a **HAPI FHIR R4 server** backed by PostgreSQL. This is only needed for local development if you want to work with real FHIR patient data. The app works fully without it.

```bash
# Start FHIR server + database
docker-compose up -d

# Wait ~2 minutes for it to initialize, then verify
curl http://localhost:8080/fhir/metadata
```

**What it provides:**
- **HAPI FHIR Server** on port `8080` - Industry-standard FHIR R4 compliant server
- **PostgreSQL 14** database - Persists FHIR data in a Docker volume

**Docker credentials** use environment variables with defaults (`admin/admin`). For production, set these in your environment:

```bash
FHIR_DB_NAME=hapi
FHIR_DB_USER=admin
FHIR_DB_PASSWORD=admin
```

**Loading test patient data** (optional):

Use [Synthea](https://github.com/synthetichealth/synthea) to generate synthetic FHIR patient bundles, then load them into the FHIR server and index into Elasticsearch:

```bash
# 1. Generate synthetic patients (requires Java)
java -jar synthea-with-dependencies.jar -p 10

# 2. Load bundles into the FHIR server
npm run load:fhir-data -- ./output/fhir

# 3. Index FHIR data into Elasticsearch (requires ES credentials)
npm run index:fhir
```

To stop:

```bash
docker-compose down        # Stop containers (data persists)
docker-compose down -v     # Stop and delete data volume
```

---

## Project Structure

```
health-sync-app/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (Server Component)
│   ├── layout.tsx                # Root layout with sidebar
│   ├── new/page.tsx              # New PA submission form
│   ├── analytics/page.tsx        # Analytics dashboard with Recharts
│   ├── audit/page.tsx            # HIPAA audit log viewer
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
│   ├── dashboard/                # PADashboard, PARequestCard, MetricsSummary
│   ├── pa-details/               # PADetailView, PatientInfo, ClinicalDataPanel,
│   │                               PolicyAnalysisPanel, PAPacketPanel, AgentTimeline
│   ├── analytics/                # AnalyticsDashboard (Recharts charts)
│   ├── audit/                    # AuditLogViewer (HIPAA audit trail)
│   ├── forms/                    # NewPAForm
│   └── ui/                       # Sidebar, StatusBadge, ConfidenceRing
│
├── lib/
│   ├── agents/                   # AI agent implementations
│   │   ├── BaseAgent.ts          # Abstract base with LLM integration
│   │   ├── CoordinatorAgent.ts   # Workflow orchestrator + audit logging
│   │   ├── ClinicalDataGatherer.ts  # ES|QL patient profile queries
│   │   ├── PolicyAnalyzer.ts     # ES|QL policy stats + hybrid search
│   │   ├── DocumentationAssembler.ts
│   │   └── ComplianceValidator.ts
│   ├── services/                 # External service clients
│   │   ├── elasticsearch.ts      # ES client + ES|QL helper + audit logging
│   │   ├── fhir.ts               # FHIR server client
│   │   └── llm.ts                # Anthropic Claude wrapper
│   ├── types/                    # TypeScript types (pa.ts, fhir.ts, agent.ts)
│   ├── constants.ts              # All config constants (indices, statuses, etc.)
│   ├── demo-data.ts              # 6 sample PA requests for demo mode
│   └── utils/cn.ts               # Tailwind class merge utility
│
├── actions/                      # Server Actions
│   ├── pa-actions.ts             # Create, approve, deny PA requests
│   └── agent-actions.ts          # Trigger agent processing
│
├── hooks/                        # React hooks
│   ├── usePARequests.ts          # SWR-based PA data fetching
│   ├── useRealTimeUpdates.ts     # SSE hook for live updates
│   └── useAgentStatus.ts         # Agent execution status hook
│
├── scripts/                      # Setup scripts (excluded from build)
│   ├── setup-elasticsearch.ts    # Create ES indices (8 indices)
│   ├── create-sample-policies.ts # Seed payer policies
│   ├── load-fhir-data.ts         # Load Synthea FHIR bundles
│   ├── index-fhir-to-elasticsearch.ts  # Index FHIR → ES
│   └── health-check.ts           # Verify service connections
│
├── docs/                         # Project documentation
├── docker-compose.yml            # FHIR server + PostgreSQL
├── next.config.ts                # Security headers, React Compiler
├── .env.example                  # Environment variable template
└── .env                          # Environment variables
```

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
| `npm run health-check` | Check connectivity to Elasticsearch and FHIR server |
| `npm run load:fhir-data -- <path>` | Load Synthea FHIR bundles into the FHIR server |
| `npm run index:fhir` | Index FHIR server data into Elasticsearch |

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
| `GET` | `/api/health` | Health check |

All mutation endpoints use **Zod validation**. Status values are validated against: `submitted`, `processing`, `ready_for_review`, `hitl_required`, `approved`, `denied`, `failed`.

---

## Key Features

- **Multi-Agent Pipeline** - 5 specialized agents process PA requests end-to-end
- **ES|QL Integration** - Agents use ES|QL for cross-index patient profiling and policy analytics
- **Analytics Dashboard** - Recharts-powered visualizations: status distribution, payer breakdown, processing timeline, agent performance
- **Audit Log Viewer** - HIPAA-compliant audit trail UI with PHI access filtering, ES|QL queries per event, and expandable detail rows
- **Audit Logging** - Every agent action and PHI access logged to Elasticsearch with timestamps, duration, and compliance metadata
- **Demo Mode** - Works fully without any external services configured
- **Real-Time Updates** - SSE streaming + SWR polling for live status changes
- **HITL Workflow** - Approve/deny buttons with denial reason input for human review
- **PA Packet Generation** - Medical necessity narrative, supporting evidence, policy compliance
- **CMS Compliance** - Timeline validation (72h expedited / 7-day standard deadlines)
- **Clinical Data Viewer** - Tabbed view of conditions, medications, procedures, observations
- **Policy Analysis** - Coverage probability scoring, criteria matching, gap identification
- **ES|QL Query Inspector** - Expandable panels showing the actual ES|QL queries each agent executes
- **Agent Timeline** - Visual step-by-step execution tracking with timestamps
- **Responsive Design** - Mobile drawer sidebar, adaptive layouts for phone/tablet/desktop
- **Security Headers** - HSTS, X-Frame-Options, CSP, Referrer-Policy via `next.config.ts`
- **Input Validation** - Zod schemas on all API routes, `crypto.randomUUID()` for IDs
- **Error Boundaries** - Route-level and global error handling with retry

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
| AI / LLM | Anthropic Claude (via `@anthropic-ai/sdk`) |
| Healthcare | HAPI FHIR R4 Server (Docker) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Elasticsearch Setup (Optional)

If you want to use real Elasticsearch instead of demo mode:

1. **Create a deployment** at [Elastic Cloud](https://cloud.elastic.co/) (14-day free trial)
2. Copy your **Cloud ID** and create an **API Key**
3. Add them to `.env.local`
4. Run index setup:

```bash
npm run setup:es          # Creates 8 indices (patients, conditions, medications, etc.)
npm run setup:policies    # Seeds sample payer policies
npm run health-check      # Verify connection
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, agent workflow, data flow |
| [Tech Stack](docs/TECH-STACK.md) | Full dependency list and infrastructure |
| [Setup Guide](docs/SETUP-GUIDE.md) | Detailed setup, configuration, troubleshooting |

---

## Deployment

The app is optimized for **Vercel** deployment:

```bash
npm i -g vercel
vercel
```

Set environment variables in the Vercel dashboard. The app will work in demo mode if no credentials are provided.

---

## License

MIT
