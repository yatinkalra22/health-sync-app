# HealthSync APP - Technology Stack

## Core Framework

| Package              | Version  | Purpose                                    |
|----------------------|----------|--------------------------------------------|
| `next`               | 16.1.6   | Full-stack React framework (App Router)    |
| `react`              | 19.2.3   | UI library                                 |
| `react-dom`          | 19.2.3   | React DOM renderer                         |
| `typescript`         | ^5       | Static typing                              |

## Data & Search

| Package                    | Version | Purpose                               |
|----------------------------|---------|---------------------------------------|
| `@elastic/elasticsearch`   | ^9.3.2  | Elasticsearch JavaScript client       |
| `swr`                      | ^2.4.0  | Client-side data fetching + caching   |

## AI & Agents

| Package              | Version  | Purpose                                    |
|----------------------|----------|--------------------------------------------|
| `@anthropic-ai/sdk`  | ^0.78.0  | Claude API for clinical/policy analysis   |

## UI & Styling

| Package                    | Version  | Purpose                              |
|----------------------------|----------|--------------------------------------|
| `tailwindcss`              | ^4       | Utility-first CSS framework          |
| `@tailwindcss/postcss`     | ^4       | PostCSS integration for Tailwind     |
| `framer-motion`            | ^12.34.3 | Animations and transitions           |
| `lucide-react`             | ^0.575.0 | Icon library                         |
| `class-variance-authority` | ^0.7.1   | Component variant utility            |
| `clsx`                     | ^2.1.1   | Conditional class joining            |
| `tailwind-merge`           | ^3.5.0   | Tailwind class deduplication         |

## Forms & Validation

| Package               | Version | Purpose                                 |
|-----------------------|---------|-----------------------------------------|
| `react-hook-form`     | ^7.71.2 | Performant form state management        |
| `@hookform/resolvers` | ^5.2.2  | Validation resolver integration         |
| `zod`                 | ^4.3.6  | Schema validation                       |

## Charts

| Package    | Version | Purpose                     |
|------------|---------|-----------------------------|
| `recharts` | ^3.7.0  | Data visualization charts   |

## Utilities

| Package    | Version | Purpose                        |
|------------|---------|--------------------------------|
| `date-fns` | ^4.1.0  | Date formatting and parsing   |

## Dev Dependencies

| Package                        | Version | Purpose                      |
|--------------------------------|---------|------------------------------|
| `tsx`                          | ^4.21.0 | TypeScript script runner     |
| `prettier`                     | ^3.8.1  | Code formatter               |
| `eslint`                       | ^9      | Linting                      |
| `eslint-config-next`           | 16.1.6  | Next.js ESLint rules         |
| `babel-plugin-react-compiler`  | 1.0.0   | React Compiler (auto-memo)   |
| `@types/node`                  | ^20     | Node.js types                |
| `@types/react`                 | ^19     | React types                  |
| `@types/react-dom`             | ^19     | React DOM types              |

## Infrastructure

| Tool            | Purpose                                        |
|-----------------|------------------------------------------------|
| Docker Compose  | Run HAPI FHIR server + PostgreSQL locally      |
| HAPI FHIR       | FHIR R4-compliant healthcare data server       |
| PostgreSQL 14   | Backing database for FHIR server               |
| Elastic Cloud   | Hosted Elasticsearch (search + storage)        |
| Vercel          | Production deployment (optional)               |
