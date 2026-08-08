# NetworkIQ Frontend Client

NetworkIQ is an AI-powered enterprise supply chain inventory optimization console for planners, operations teams, and supply chain analysts. The frontend provides a premium dark-first interface for inventory visibility, AI transfer recommendations, planner approvals, agent monitoring, benchmarking, analytics, audit review, and user management.

The application is built using **React 19**, **Vite 8**, **TanStack Router**, **TanStack Query**, **Axios**, and **Tailwind CSS**. It is fully integrated with the NetworkIQ FastAPI backend.

---

## 🚀 Live Backend Integration

The frontend connects directly to the FastAPI backend API via `VITE_NETWORKIQ_API_URL`.

Create a local `.env` file in the `frontend` directory:

```env
VITE_NETWORKIQ_API_URL=http://localhost:8000
```

### Key Features

- **Live Authentication**: Integrated with `POST /auth/login`, `GET /auth/me`, and `POST /auth/logout`. Automatically attaches JWT Bearer tokens to all outbound Axios requests.
- **Command Dashboard**: Displays live KPIs, demand forecast trends, warehouse utilization, and recent AI transfer recommendations (`GET /dashboard`).
- **Inventory Explorer**: Sourced from 96 preprocessed regional store inventory records with real-time SKU filtering (`GET /inventory`).
- **AI Recommendation Engine & Approval Center**: Allows planners to approve, reject, or override transfers (`GET /plan`, `POST /plan/decision`).
- **Analytics & Benchmark**: Evaluates classical solver vs NetworkIQ AI decision engine performance (`GET /analytics`, `GET /benchmark`).
- **Audit Log**: Full audit trail of planner decisions and security actions (`GET /audit`).
- **Settings & Config**: Configures planner approval thresholds and network parameters (`GET /config`).

---

## 🛠️ Getting Started

Install dependencies and start the development server:

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The application runs locally at: `http://localhost:5173/`

---

## 📦 Available Scripts

```bash
npm run dev        # Starts Vite dev server
npm run build      # Creates production build in dist/
npm run preview    # Serves production build locally
npm run lint       # Runs ESLint checks
```

---

## 🌐 Connected FastAPI Endpoints

| Page / Hook | HTTP Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/auth/login` | Log in user & receive JWT token |
| **User Profile** | `GET` | `/auth/me` | Fetch active user session profile |
| **Command Dashboard** | `GET` | `/dashboard` | Fetch dashboard metrics & KPIs |
| **Inventory Network** | `GET` | `/inventory` | Fetch store inventory positions |
| **AI Recommendations** | `GET` | `/plan` | Fetch validated transfer recommendations |
| **Planner Action** | `POST` | `/plan/decision` | Submit Approve, Reject, or Override |
| **Approve Transfer** | `POST` | `/plan/{id}/approve` | Approve specific transfer recommendation |
| **Override Transfer** | `POST` | `/plan/{id}/override` | Override specific transfer parameters |
| **Self Check Agent** | `GET` / `POST` | `/self-check` | Evaluate plan safety & guardrail compliance |
| **Benchmark** | `GET` | `/benchmark` | Classical baseline vs AI engine metrics |
| **Analytics Workspace**| `GET` | `/analytics` | Demand forecast & velocity distribution |
| **Audit Trail** | `GET` | `/audit` | Historical audit logs |
| **Configuration** | `GET` | `/config` | System threshold settings |

---

## 📁 Directory Structure

```txt
frontend/
  src/
    components/
      common/        Shared dashboard widgets (charts, maps, badges)
      layout/        Navbar, Sidebar, App Shell
      ui/            Radix UI primitives
      warehouse/     Warehouse forms and tables
    hooks/           TanStack Query data hooks (useDashboard, usePlan, etc.)
    lib/             Axios API client (api.ts), types (types.ts), formatters
    routes/          File-based routes (inventory, recommendations, approvals, settings)
    store/           Zustand app and UI stores
  dist/              Production build artifacts
  package.json
  vite.config.ts
```
