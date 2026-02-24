# HealthSync AI - Elasticsearch Agent Builder Hackathon Submission

## Devpost Description (~400 words)

### What it does

HealthSync AI automates prior authorization (PA) — healthcare's most expensive administrative process, costing **$150 billion annually** in the US alone. Clinicians spend an average of 13 hours per week on PA paperwork instead of treating patients.

HealthSync replaces that manual workflow with **5 specialized AI agents** orchestrated through Elasticsearch:

1. **Clinical Data Gatherer** — Uses ES|QL to aggregate patient profiles across FHIR R4 indices (conditions, medications, procedures, observations) with `FROM ... | WHERE ... | STATS` queries
2. **Policy Analyzer** — Runs ES|QL stats and hybrid search to match payer coverage criteria against clinical findings
3. **Documentation Assembler** — Generates structured PA packets with medical necessity narratives
4. **Compliance Validator** — Enforces CMS timeline rules (72h expedited / 7-day standard) and flags low-confidence cases for human review
5. **Coordinator Agent** — Orchestrates the pipeline, manages state transitions, and writes audit logs for every PHI access

When a clinician submits a PA request, the agents process it end-to-end in minutes instead of days. High-confidence cases are auto-approved; borderline cases are escalated with full reasoning visible to the reviewer.

### How we built it

- **Elasticsearch** powers three layers: ES|QL for cross-index clinical data aggregation, hybrid search for policy matching, and audit logging for HIPAA compliance tracking
- **8 Elasticsearch indices** store patients, conditions, medications, procedures, observations, PA requests, payer policies, and audit logs
- **ES|QL Query Inspector** — Every agent step and analytics chart shows the actual ES|QL queries it executed, making the Elasticsearch integration transparent
- **HIPAA Audit Log Viewer** — Every agent action and PHI access is logged with expandable detail rows, ES|QL queries, and PHI-only filtering
- **Next.js 16** with Server Components, Server Actions, SSE streaming, and SWR polling for real-time updates
- **Claude AI** (Anthropic) generates medical necessity narratives and evaluates clinical evidence
- **Demo mode** runs the entire pipeline without any external services — realistic clinical data, policy analysis, and compliance checks generated locally

### Why it matters

Prior authorization delays cause **real patient harm** — 94% of physicians report care delays and 33% report serious adverse events due to PA. HealthSync reduces processing time from 2-7 days to hours while maintaining compliance and creating a full audit trail.

### What's next

- Integration with real EHR systems (Epic, Cerner) via SMART on FHIR
- Payer-side API integration for direct submission (X12 278)
- Multi-language support for medical necessity narratives
- Predictive analytics for denial risk before submission

---

## Demo Video Script (3 minutes)

### Opening (0:00–0:20)
"Prior authorization costs US healthcare $150 billion a year. Clinicians spend 13 hours per week on paperwork instead of treating patients. HealthSync AI fixes this with Elasticsearch-powered AI agents."

### Dashboard Overview (0:20–0:50)
- Show the PA Dashboard with 6 requests in different statuses
- Highlight the status badges: submitted, processing, ready for review, HITL required, approved, denied
- Click into the "ready for review" PA to show the detail view
- Point out: "This was processed end-to-end by 5 AI agents"

### Agent Timeline & ES|QL Inspector (0:50–1:30)
- Scroll to the Agent Workflow timeline
- Walk through each step: Clinical Data Gathering → Policy Analysis → Documentation Assembly → Compliance Validation
- **Click the "3 ES|QL Queries" button** on Clinical Data Gathering to expand the query inspector
- Show the actual ES|QL: `FROM healthsync-conditions | WHERE patient_id == "Patient-1042" | STATS total_conditions = COUNT(*)`
- "Every agent shows exactly what Elasticsearch queries it ran — full transparency"

### Clinical Data & PA Packet (1:30–2:00)
- Click through the tabbed clinical data panels: Conditions, Medications, Procedures, Observations
- Show the generated medical necessity narrative
- Show policy compliance: all criteria checked off

### Live Processing Demo (2:00–2:30)
- Navigate to the "submitted" PA request
- Click "Run AI Agents" button
- Watch the status change from submitted → processing → ready_for_review
- Show the newly populated Agent Workflow with ES|QL queries
- "The entire PA was processed in seconds — from clinical data gathering through compliance validation"

### Analytics Dashboard (2:30–2:45)
- Navigate to Analytics
- Show the 4 KPI cards, status distribution chart, payer breakdown pie chart
- **Click the ES|QL badge** on any chart to show the query powering it
- "Every chart shows the ES|QL query behind it"

### Audit Log (2:45–2:55)
- Navigate to Audit Log
- Show the stats bar: total events, PHI access events, unique agents, PA requests
- Click "PHI Only" filter to show just PHI access events
- Expand a row to show full details and the ES|QL query
- "Full HIPAA-compliant audit trail — every PHI access is logged with the exact query that ran"

### Closing (2:55–3:00)
"HealthSync AI: 5 agents, 8 Elasticsearch indices, ES|QL-powered analytics, HIPAA audit trail, and end-to-end PA processing. From days to minutes."

---

## Social Media Post

**For Twitter/X:**

🏥 Built HealthSync AI for the @elastic Agent Builder Hackathon!

5 AI agents automate prior authorization — healthcare's $150B paperwork problem.

⚡ ES|QL queries across 8 FHIR indices
🤖 End-to-end PA processing in minutes vs days
📊 Real-time analytics with ES|QL badges on every chart
🔍 ES|QL Query Inspector shows every agent query
🛡️ HIPAA audit trail with PHI access tracking

Built with #Elasticsearch, Next.js, and Claude AI.

#ElasticAgentHackathon #HealthTech

---

## Architecture Summary (for Devpost)

```
┌─────────────────────────────────────────────────────┐
│                    Next.js Frontend                  │
│  Dashboard │ PA Detail │ Analytics │ Audit │ New PA  │
└─────────────┬───────────────────────┬───────────────┘
              │ Server Actions        │ SSE/SWR
              ▼                       ▼
┌─────────────────────────────────────────────────────┐
│              Coordinator Agent                       │
│  Orchestrates pipeline │ Manages state │ Audit logs  │
└──┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌──────────┐
│Clinical││Policy  ││Doc     ││Compliance│
│Data    ││Analyzer││Assembly││Validator │
│Gatherer││        ││        ││          │
└───┬────┘└───┬────┘└────────┘└────┬─────┘
    │         │                    │
    ▼         ▼                    ▼
┌─────────────────────────────────────────────────────┐
│              Elasticsearch                           │
│  ES|QL Queries │ Hybrid Search │ Audit Logs          │
│  8 indices: patients, conditions, medications,       │
│  procedures, observations, pa-requests, policies,    │
│  audit-logs                                          │
└─────────────────────────────────────────────────────┘
```
