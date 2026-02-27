# Testing, Demo & Environment Guide

## Quick Reference

| Mode | Mock Mode | Production Mode |
|------|-----------|-----------------|
| **Data** | In-memory demo data (6 PA requests) | Elasticsearch (live) |
| **AI Agents** | Simulated pipeline | Gemini AI (Google API) |
| **FHIR** | Not used | Docker HAPI FHIR R4 |
| **Setup** | Zero config | ES + API keys required |
| **Toggle** | `NEXT_PUBLIC_MOCK_MODE=true` | `NEXT_PUBLIC_MOCK_MODE=false` |

---

## 1. Running in Mock Mode (Default)

Mock mode uses in-memory demo data — no external services needed. Perfect for development, demos, and testing UI flows.

### Start Mock Mode

```bash
# Copy env template (mock mode is the default)
cp .env.example .env.local

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app is now running at `http://localhost:3000` with:
- 6 pre-loaded PA requests across all statuses
- Simulated 5-agent processing pipeline
- Mock analytics and audit logs
- One-click demo scenarios on the dashboard

### What Happens in Mock Mode

- **Dashboard**: Shows 6 demo PA requests (submitted, processing, ready_for_review, hitl_required, approved, denied)
- **New PA Request**: Creates a PA and runs the simulated agent pipeline instantly
- **Quick Demo Scenarios**: Three one-click buttons for common PA types
- **Analytics**: Computed from mock data + static performance metrics
- **Audit Log**: Generated from demo PA execution logs
- **Agent Monitor**: Shows agent status from demo store

### Mock Data Location

All mock data lives in the `mock/` directory:

```
mock/
├── index.ts                    # Central re-exports
├── data/
│   ├── pa-requests.ts          # 6 sample PA requests with full clinical data
│   ├── demo-scenarios.ts       # Quick demo scenario definitions
│   └── analytics.ts            # Static analytics data (timeline, agent perf)
├── store/
│   └── demo-store.ts           # In-memory CRUD store (resets on restart)
├── agents/
│   └── demo-agent-runner.ts    # Simulated 5-agent pipeline
└── policies/
    └── sample-policies.ts      # 3 payer policies (Medicare, BCBS, Aetna)
```

### Mock Data Resets

The in-memory store resets on every server restart. This is intentional — it ensures a clean demo state each time.

---

## 2. Running in Production Mode

Production mode connects to real Elasticsearch, Gemini AI, and optionally a FHIR server.

### Prerequisites

- **Elasticsearch** cloud deployment (or self-hosted with ES|QL support)
- **Gemini API key** (for Google Gemini AI agent processing)
- **Docker** (optional, for FHIR server)

### Configure Environment

```bash
# .env.local
NEXT_PUBLIC_MOCK_MODE=false

# Elasticsearch (required)
ELASTICSEARCH_CLOUD_ID=your-cloud-id
ELASTICSEARCH_API_KEY=your-api-key

# Google Gemini AI (required for live agent processing)
GEMINI_API_KEY=your-gemini-api-key

# FHIR Server (optional)
FHIR_SERVER_URL=http://localhost:8080/fhir

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Setup Elasticsearch Indices

```bash
# Create all 8 indices with mappings
npm run setup:es

# Seed sample payer policies
npm run setup:policies

# Verify connections
npm run health-check
```

### Start Production Mode

```bash
npm run dev
# or for production
npm run build && npm run start
```

---

## 3. Docker Setup (FHIR Server)

Docker runs the HAPI FHIR R4 server + PostgreSQL. This is **only needed for production mode** when you want real clinical data via FHIR.

### When to Use Docker

- You want to load and query real FHIR patient data
- You're testing the FHIR integration pipeline
- You're loading Synthea-generated patient bundles

### Start Docker Services

```bash
# Start FHIR server + PostgreSQL
docker compose up -d

# Verify FHIR server is running
curl http://localhost:8080/fhir/metadata
```

### Load Clinical Data

```bash
# Load Synthea FHIR bundles (download from https://synthea.mitre.org/downloads)
npm run load:fhir-data -- /path/to/synthea/fhir

# Index FHIR data into Elasticsearch
npm run index:fhir
```

### Stop Docker Services

```bash
docker compose down          # Stop services (data persists)
docker compose down -v       # Stop services AND delete data
```

---

## 4. Mode Detection & Toggle

### How It Works

The app determines its mode using this priority:

1. `NEXT_PUBLIC_MOCK_MODE=true` → Always mock mode
2. `NEXT_PUBLIC_MOCK_MODE=false` → Always production mode
3. **Not set** → Auto-detect (mock if no Elasticsearch credentials)

### Sidebar Indicator

The sidebar shows the current mode with service connection status:
- **Mock Mode** (amber): In-memory demo data, no external services
- **Production Mode** (green): Connected to live services
- Service dots: ES (Elasticsearch), AI (Gemini), FHIR indicators

### API Endpoint

Check the current mode programmatically:

```bash
curl http://localhost:3000/api/mock-mode
```

Response:
```json
{
  "mock_mode": true,
  "reason": "NEXT_PUBLIC_MOCK_MODE=true",
  "services": {
    "elasticsearch": false,
    "ai": false,
    "fhir": true
  }
}
```

---

## 5. Creating a Demo

### Quick Demo (30 seconds)

1. Start the app in mock mode (default)
2. Open `http://localhost:3000`
3. Use the "Quick Demo Scenarios" cards on the dashboard:
   - **Expedited Knee Surgery**: Shows fast-track PA with full agent pipeline
   - **Missing Documentation**: Shows HITL (human-in-the-loop) workflow
   - **Quick Approval**: Shows straightforward approval flow
4. Click any scenario → auto-creates PA → redirects to detail view

### Full Demo Walkthrough

1. **Dashboard Overview**: Show the 6 pre-loaded PA requests across statuses
2. **PA Detail View**: Click "PA-7K3M9X2B" (Margaret Johnson) to show:
   - Patient demographics and clinical data
   - Policy analysis with coverage probability
   - Generated PA packet with medical necessity narrative
   - Compliance validation results
   - Agent execution timeline with ES|QL queries
3. **Submit New PA**: Go to `/new`, fill in the form, submit
4. **Agent Processing**: Watch the simulated agent pipeline run
5. **Analytics**: Show charts, approval rates, agent performance
6. **Audit Log**: Show HIPAA-compliant audit trail

### Demo with Live Services

For demos with real data, set `NEXT_PUBLIC_MOCK_MODE=false` and ensure Elasticsearch + Gemini API are configured. The agents will make real LLM calls and query actual data.

---

## 6. Testing

### Development Testing

```bash
# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Build verification
npm run build
```

### API Testing (Mock Mode)

```bash
# List all PA requests
curl http://localhost:3000/api/pa-requests

# Get single PA request
curl http://localhost:3000/api/pa-requests/PA-7K3M9X2B

# Create a new PA request
curl -X POST http://localhost:3000/api/pa-requests \
  -H 'Content-Type: application/json' \
  -d '{
    "patient_id": "Patient-TEST",
    "procedure_code": "27447",
    "diagnosis_codes": ["M17.11"],
    "urgency": "standard",
    "payer": "Medicare"
  }'

# Execute agents on a PA
curl -X POST http://localhost:3000/api/agents/execute \
  -H 'Content-Type: application/json' \
  -d '{
    "pa_id": "PA-4D1G3Y9Z",
    "patient_id": "Patient-5892",
    "procedure_code": "27447",
    "diagnosis_codes": ["M17.12"],
    "urgency": "standard",
    "payer": "UnitedHealthcare"
  }'

# Get analytics
curl http://localhost:3000/api/analytics

# Check mock mode status
curl http://localhost:3000/api/mock-mode

# Health check
curl http://localhost:3000/api/health
```

### Service Health Check

```bash
npm run health-check
```

This verifies connectivity to:
- Elasticsearch (if configured)
- FHIR server (if Docker is running)
- Reports which services are available

---

## 7. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_MOCK_MODE` | No | Auto-detect | `true` / `false` / empty |
| `ELASTICSEARCH_CLOUD_ID` | Production | — | Elasticsearch Cloud ID |
| `ELASTICSEARCH_API_KEY` | Production | — | Elasticsearch API key |
| `GEMINI_API_KEY` | Production | — | Gemini AI API key |
| `FHIR_SERVER_URL` | No | `http://localhost:8080/fhir` | HAPI FHIR server URL |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | App base URL |

---

## 8. NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup:es` | Create Elasticsearch indices |
| `npm run setup:policies` | Seed sample payer policies |
| `npm run health-check` | Verify service connections |
| `npm run load:fhir-data -- <path>` | Load Synthea FHIR bundles |
| `npm run index:fhir` | Index FHIR data into Elasticsearch |
