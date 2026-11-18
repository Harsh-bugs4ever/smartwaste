# SmartWaste – Intelligent Urban Waste Management System

A production-grade, modern, and responsive web application and IoT data platform for municipal waste monitoring, fleet dispatching, smart bin telemetry, and urban waste segregation tracking.

Built with **React, Vite, TypeScript, Tailwind CSS, Leaflet, Recharts, and Supabase PostgreSQL**.

---

## 1. Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation
```bash
# Navigate to project folder
cd smartwaste

# Install dependencies
npm install

# Setup environment variables (default uses zero-setup mock services)
cp .env.example .env

# Start development server
npm run dev
# Accessible at http://localhost:5173
```

### Production Build & Type Verification
```bash
# Run strict TypeScript check
npm run typecheck

# Build optimized production bundle
npm run build

# Preview build locally
npm run preview
```

---

## 2. Project Architecture

```
smartwaste/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, Register, Demo notice banner
│   │   ├── bins/           # Add/Edit Bin modal, Telemetry details modal, Delete dialog
│   │   ├── collections/    # Dispatch run modal, Completion confirmation modal
│   │   ├── common/         # FormField, MetricCard, PageHeader, StatusBadge, States
│   │   ├── dashboard/      # TrendChart, CategoryBreakdown, RecentAlerts, RecentCollections
│   │   ├── layout/         # AppShell, responsive Sidebar, Topbar with search & alerts
│   │   ├── staff/          # Add/Edit personnel modal with zone allocation
│   │   └── ui/             # Dialog modal, Button, Card, Input, Select, Badge, Tabs
│   ├── hooks/              # useAuth, useTheme, useData, useAsync
│   ├── pages/              # Dashboard, SmartBins, LiveMap, Alerts, Collections, Analytics, Staff, Reports, Settings
│   ├── routes/             # Role guards, Protected routes, Navigation definitions
│   ├── services/
│   │   ├── interfaces/     # Centralized TypeScript service contracts
│   │   ├── mock/           # In-memory realistic dataset for Mumbai Metropolitan Region
│   │   ├── supabase/       # Real PostgreSQL + Supabase client, queries, and Realtime hooks
│   │   └── index.ts        # Dynamic service switcher based on VITE_DATA_SOURCE
│   ├── types/              # Domain entities (SmartBin, Alert, Collection, Staff, etc.)
│   └── utils/              # Bin status threshold logic, date formatting
├── supabase/
│   ├── functions/
│   │   └── ingest-sensor-data/ # Deno Edge Function for ESP32 telemetry ingestion
│   └── migrations/
│       ├── 20261118000001_initial_schema.sql         # 10 core tables, constraints, indexes
│       ├── 20261118000002_functions_and_triggers.sql  # Sensor processing, automated alerts, lifecycle
│       ├── 20261118000003_rls_policies.sql           # Granular Row Level Security for all roles
│       ├── 20261118000004_analytics_views.sql        # High-performance reporting SQL views
│       └── 20261118000005_seed_data.sql              # Municipal MMR seed dataset
├── scripts/
│   └── simulate-sensors.mjs # Local ESP32 ultrasonic telemetry test simulator
└── package.json
```

---

## 3. Application Modules

| Module | Route | Access Level | Description |
|---|---|---|---|
| **Dashboard** | `/dashboard` | All Roles | Network KPIs, collection trend charts, segregation donut, live alert stream, recent runs. |
| **Smart Bins** | `/bins` | All Roles | Grid & Table views, search, status & category filters, register new bin, edit, decommission, and 24h telemetry graphs. |
| **Live Map** | `/map` | All Roles | Interactive Leaflet map with OpenStreetMap tiles, colored markers (Normal, Warning, Critical, Offline), popups, and focus sidebar. |
| **Alerts** | `/alerts` | All Roles | Automated capacity (75%, 90%, 98% overflow) and sensor disconnect warnings, severity badges, and one-click resolution. |
| **Collections** | `/collections` | All Roles | Dispatch queue, staff assignment, route lifecycle (Pending → Assigned → In Progress → Completed), and weight logging. |
| **Analytics** | `/analytics` | Admin Only | Deep-dive waste segregation percentages, area-wise generation bars, monthly targets vs completions, and AI insights. |
| **Staff Management** | `/staff` | Admin Only | Municipal worker directory, zone allocations, task completion metrics, and on-duty status toggles. |
| **Reports** | `/reports` | Admin Only | Audit preview table for collection runs, ward sectors, and overflow incidents, with client-side CSV export. |
| **Settings** | `/settings` | All Roles | Telemetry threshold configuration, municipal jurisdiction parameters, dark/light theme toggle, and database status. |

---

## 4. Supabase Backend & Database Setup

### Connecting to Live Supabase:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Execute the migration scripts in `supabase/migrations/` in order (via Supabase SQL Editor or Supabase CLI):
   ```bash
   supabase db push
   ```
3. Set your credentials in `.env`:
   ```env
   VITE_DATA_SOURCE=supabase
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Restart Vite (`npm run dev`). The application will now read and write directly to your PostgreSQL database.

---

## 5. IoT Sensor Integration & Simulation

ESP32 ultrasonic sensors mounted inside waste bin lids measure distance from the sensor to the waste surface.

- **Ingestion Endpoint:** `supabase/functions/ingest-sensor-data/index.ts`
- **Device Authentication:** Header `x-device-secret` validated against `iot_devices.secret_hash`.
- **Threshold Automation:**
  - `0% - 74%`: Normal operation
  - `75% - 89%`: Warning alert generated
  - `90% - 97%`: Critical alert generated
  - `98% - 100%`: Overflow alert generated

### Running the Sensor Simulator:
```bash
# Simulates ESP32 telemetry pulses for Mumbai test bins
node scripts/simulate-sensors.mjs
```

---

## 6. Security & Row Level Security (RLS)

- **Super Admin:** Full system privileges across all tables and settings.
- **Municipal Administrator:** Read/write smart bins, alerts, staff roster, and collections within their municipal zones.
- **Collection Staff:** Read-only access to bins and assigned collection routes; can update the status of their assigned runs and record payload weights.
- **Anonymous Users:** All database endpoints protected by RLS; operational data is inaccessible without valid authentication.
