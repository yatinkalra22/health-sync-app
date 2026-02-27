# HealthSync APP - Setup & Running Guide

## Prerequisites

- **Node.js** v20+ LTS
- **npm** v10+ (or pnpm v8+)
- **Docker Desktop** (for FHIR server - optional)
- **Git**

### Required Accounts (for full functionality)

- **Elastic Cloud** - [Sign up](https://cloud.elastic.co/registration) (14-day free trial)
- **Google Gemini API** - [Get API key](https://aistudio.google.com/apikey) (free tier available)

> The app runs in **demo mode** without these accounts. All features work with mock data.

---

## Quick Start (Demo Mode)

```bash
# 1. Clone and install
git clone <repo-url>
cd health-sync-app
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

That's it. The app runs with demo data showing 6 sample PA requests.

---

## Full Setup (With External Services)

### Step 1: Environment Variables

Edit `.env` and fill in your credentials:

```bash
# Elasticsearch - Get from Elastic Cloud dashboard
ELASTICSEARCH_CLOUD_ID=your-deployment:base64encoded...
ELASTICSEARCH_API_KEY=your-api-key-here

# Google Gemini AI - Get from aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key

# FHIR Server (only if running Docker)
FHIR_SERVER_URL=http://localhost:8080/fhir

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Elasticsearch Setup

```bash
# Create all required indices
npm run setup:es

# Seed sample payer policies
npm run setup:policies
```

### Step 3: FHIR Server (Optional)

```bash
# Start FHIR server + PostgreSQL
docker-compose up -d

# Wait ~2 minutes for FHIR server to initialize
# Verify it's running:
curl http://localhost:8080/fhir/metadata
```

### Step 4: Health Check

```bash
npm run health-check
```

Expected output:
```
========================================
  HealthSync APP System Health Check
========================================

Services:
  Elasticsearch: CONNECTED (v9.3.0)
  FHIR Server: RUNNING
  Gemini API: CONFIGURED

========================================
  Health check complete!
========================================
```

### Step 5: Start Development

```bash
npm run dev
```

---

## Available Scripts

| Command                | Description                                 |
|------------------------|---------------------------------------------|
| `npm run dev`          | Start Next.js dev server (port 3000)        |
| `npm run build`        | Production build                            |
| `npm run start`        | Start production server                     |
| `npm run lint`         | Run ESLint                                  |
| `npm run setup:es`     | Create Elasticsearch indices                |
| `npm run setup:policies` | Seed sample payer policies               |
| `npm run health-check` | Verify all service connections              |

---

## What Needs to Be Done to Run Smoothly

### Required Changes

1. **Set environment variables** - Copy `.env.example` to `.env` and add your Elasticsearch Cloud ID, API key, and Gemini API key. Without these, the app runs in demo mode with mock data.

2. **Elasticsearch Cloud deployment** - Create a deployment at [cloud.elastic.co](https://cloud.elastic.co):
   - Name: `healthsync-ai-dev`
   - Version: 9.3+
   - Size: 4GB RAM (free trial)
   - Copy the Cloud ID and create an API key

3. **Run index setup** - After configuring Elasticsearch, run `npm run setup:es` to create all 7 indices, then `npm run setup:policies` to seed sample coverage policies.

4. **Gemini API key** - Get from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). The Gemini 2.0 Flash model is used for clinical summaries, policy analysis, and PA packet generation.

### Optional Setup

5. **FHIR Server** - Only needed if you want to load real synthetic patient data:
   - Run `docker-compose up -d` to start HAPI FHIR + PostgreSQL
   - Use Synthea to generate patient bundles
   - Load into FHIR server, then index into Elasticsearch

6. **Vercel Deployment** - Connect repo to Vercel, add env vars in Vercel dashboard, deploy.

### Feature Completeness Without Services

| Feature                        | Demo Mode | Full Mode |
|--------------------------------|-----------|-----------|
| Dashboard with PA list         | Yes       | Yes       |
| PA detail with clinical data   | Yes       | Yes       |
| New PA form submission         | Yes       | Yes       |
| Real-time status updates (SSE) | Yes       | Yes       |
| Agent workflow visualization   | Yes       | Yes       |
| AI clinical summaries          | Mock text | Real AI   |
| AI policy analysis             | Mock text | Real AI   |
| Elasticsearch queries          | In-memory | Real ES   |
| FHIR patient data loading      | No        | Yes       |

---

## Troubleshooting

### App shows "demo mode" warnings
- Expected when `.env` credentials are empty. Fill in Elasticsearch + Gemini keys.

### Elasticsearch connection fails
- Verify Cloud ID format: `deployment-name:base64string`
- Check API key has full access permissions
- Run `npm run health-check` to diagnose

### FHIR server won't start
- Ensure Docker Desktop is running
- Check port 8080 is not in use: `lsof -i :8080`
- View logs: `docker logs healthsync-fhir`

### Build errors
- Clear cache: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Scripts directory is excluded from TypeScript compilation (intentional)

### TypeScript errors in scripts/
- Scripts use `dotenv` which is not in project deps (run standalone with `tsx`)
- The `tsconfig.json` excludes the `scripts/` folder from the Next.js build
