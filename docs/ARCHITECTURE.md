# HealthSync APP — System Architecture

## Executive Summary

HealthSync APP is a multi-agent prior authorization (PA) automation system that reduces PA processing time from days to minutes through intelligent agent orchestration. Built as a full-stack Next.js application with Elasticsearch for search/storage and Gemini AI for clinical analysis.

---

## High-Level Architecture

```
+---------------------------------------------------------------+
|                  Next.js 16 Full-Stack App                    |
+---------------------------------------------------------------+
|                                                               |
|  +---------------------------+   +-------------------------+  |
|  |   React Client Components |   | Server Components       |  |
|  |   - Dashboard (SWR poll)  |   | - SSR data fetching     |  |
|  |   - PA Details            |   | - Server Actions        |  |
|  |   - Forms                 |   | - API Routes            |  |
|  |   - Real-time (SSE)       |   |                         |  |
|  +---------------------------+   +-------------------------+  |
|                          |                                    |
|  +--------------------------------------------------------+  |
|  |              Agent Orchestration Layer                  |  |
|  |                                                        |  |
|  |   CoordinatorAgent                                     |  |
|  |     |-- ClinicalDataGatherer (ES queries + LLM)        |  |
|  |     |-- PolicyAnalyzer (ES queries + LLM)              |  |
|  |     +-- PA Packet Generator (LLM)                      |  |
|  +--------------------------------------------------------+  |
|                          |                                    |
|  +--------------------------------------------------------+  |
|  |         Services Layer (lib/services/*)                |  |
|  |   elasticsearch.ts  |  llm.ts  |  fhir.ts             |  |
|  +--------------------------------------------------------+  |
+---------------------------------------------------------------+
                           |
          +-------------------------------+
          |      External Services        |
          |  - Elasticsearch Cloud 9.3+   |
          |  - Google Gemini AI           |
          |  - HAPI FHIR Server (Docker)  |
          +-------------------------------+
```

---

## Technology Stack

| Layer        | Technology                        | Purpose                              |
|--------------|-----------------------------------|--------------------------------------|
| Framework    | Next.js 16 (App Router)           | Full-stack React framework           |
| Language     | TypeScript (strict mode)          | Type safety across entire stack      |
| Styling      | Tailwind CSS v4                   | Utility-first CSS                    |
| Animations   | Framer Motion                     | Page transitions, micro-interactions |
| Icons        | Lucide React                      | Consistent icon system               |
| Data Fetch   | SWR                               | Client-side polling/caching          |
| Forms        | React Hook Form + Zod             | Form state + validation              |
| Charts       | Recharts                          | Data visualization                   |
| Search/DB    | Elasticsearch 9.3+                | Document search, PA storage          |
| AI           | Google Gemini (Gemini 2.0 Flash)  | Clinical analysis, policy analysis   |
| Healthcare   | HAPI FHIR R4 Server              | FHIR-compliant patient data          |
| Real-time    | Server-Sent Events (SSE)          | Live PA status updates               |
| Deployment   | Vercel (frontend) + Docker (FHIR) | Hosting                              |

---

## Project Structure

```
healthsync-ai/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard (Server Component)
│   ├── layout.tsx                # Root layout + Sidebar
│   ├── loading.tsx               # Global loading skeleton
│   ├── error.tsx                 # Route error boundary
│   ├── global-error.tsx          # App-level error boundary
│   ├── not-found.tsx             # 404 page
│   ├── new/
│   │   └── page.tsx              # New PA request form
│   ├── pa/[id]/
│   │   ├── page.tsx              # PA detail page
│   │   ├── loading.tsx           # Detail loading skeleton
│   │   ├── error.tsx             # Detail error boundary
│   │   └── not-found.tsx         # PA not found
│   └── api/
│       ├── pa-requests/
│       │   ├── route.ts          # GET list, POST create
│       │   └── [id]/route.ts     # GET detail, PATCH update
│       ├── pa-updates/[id]/
│       │   └── route.ts          # SSE real-time stream
│       └── health/route.ts       # Health check
│
├── components/
│   ├── dashboard/
│   │   ├── PADashboard.tsx       # Main dashboard (client)
│   │   ├── PARequestCard.tsx     # PA card with status/confidence
│   │   └── MetricsSummary.tsx    # Metric cards grid
│   ├── pa-details/
│   │   ├── PADetailView.tsx      # Full PA detail layout
│   │   ├── PatientInfo.tsx       # Demographics panel
│   │   ├── ClinicalDataPanel.tsx # Tabbed clinical data
│   │   ├── PolicyAnalysisPanel.tsx # Policy + compliance
│   │   └── AgentTimeline.tsx     # Agent workflow timeline
│   ├── forms/
│   │   └── NewPAForm.tsx         # PA submission form
│   └── ui/
│       ├── Sidebar.tsx           # Responsive sidebar/drawer
│       ├── StatusBadge.tsx       # PA status badge
│       └── ConfidenceRing.tsx    # SVG confidence ring
│
├── lib/
│   ├── agents/
│   │   ├── BaseAgent.ts          # Abstract agent with LLM
│   │   ├── CoordinatorAgent.ts   # Orchestrator
│   │   ├── ClinicalDataGatherer.ts # Patient data agent
│   │   └── PolicyAnalyzer.ts     # Policy matching agent
│   ├── services/
│   │   ├── elasticsearch.ts      # ES client + CRUD ops
│   │   ├── llm.ts                # Google Gemini wrapper
│   │   └── fhir.ts               # FHIR server client
│   ├── types/
│   │   ├── pa.ts                 # PA request types
│   │   ├── agent.ts              # Agent/workflow types
│   │   └── fhir.ts               # FHIR resource types
│   ├── utils/
│   │   └── cn.ts                 # Tailwind class merge
│   └── demo-data.ts              # Mock data for demo mode
│
├── actions/
│   ├── pa-actions.ts             # Server actions for PA ops
│   └── agent-actions.ts          # Server actions for agents
│
├── hooks/
│   ├── usePARequests.ts          # SWR hook for PA list
│   ├── useRealTimeUpdates.ts     # SSE hook for live updates
│   └── useAgentStatus.ts         # Agent status hook
│
├── scripts/
│   ├── setup-elasticsearch.ts    # Create ES indices
│   ├── create-sample-policies.ts # Seed policy data
│   └── health-check.ts           # Verify all services
│
├── docker-compose.yml            # FHIR server + Postgres
├── .env.example                  # Environment variable keys
└── tsconfig.json                 # TypeScript config
```

---

## Agent Workflow

When a PA request is submitted, the **CoordinatorAgent** orchestrates this pipeline:

```
1. [ClinicalDataGatherer] --> Query ES for patient data
                              Generate clinical summary (Gemini)
                              Calculate complexity score

2. [PolicyAnalyzer]        --> Search matching policies in ES
                              Extract coverage criteria (Gemini)
                              Calculate coverage probability

3. [PA Packet Generator]   --> Generate medical necessity narrative (Gemini)
                              Assemble packet with clinical evidence

4. [Compliance Validator]  --> Run automated compliance checks
                              Determine if HITL review needed
                              Set final status
```

**Status Flow:** `submitted` -> `processing` -> `ready_for_review` | `hitl_required` -> `approved` | `denied`

---

## Data Flow

### Server Components (SSR)
- Dashboard page fetches PA list from Elasticsearch at request time
- PA detail page fetches single PA document server-side

### Client Components
- SWR polls `/api/pa-requests` every 5s for dashboard updates
- SSE stream at `/api/pa-updates/[id]` for real-time PA status
- Forms POST to `/api/pa-requests` then redirect

### Demo Mode
When Elasticsearch/Gemini credentials are not set, the app automatically falls back to `lib/demo-data.ts` with 6 pre-built PA requests showing various statuses.

---

## Elasticsearch Indices

| Index                      | Purpose                          |
|----------------------------|----------------------------------|
| `healthsync-patients`      | Patient demographics (FHIR)      |
| `healthsync-conditions`    | Patient conditions/diagnoses     |
| `healthsync-medications`   | Medication records               |
| `healthsync-procedures`    | Procedure history                |
| `healthsync-observations`  | Lab results, vitals              |
| `healthsync-pa-requests`   | PA request documents             |
| `healthsync-policies`      | Payer coverage policies          |
| `healthsync-audit-logs`    | HIPAA audit trail — every agent action and PHI access |
