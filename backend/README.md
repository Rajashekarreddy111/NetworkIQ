# NetworkIQ Backend API — Technical Documentation & Architecture

The FastAPI backend powers **NetworkIQ**, an enterprise multi-agent supply chain inventory optimization and stock rebalancing platform. It provides role-based and region-based access control (RBAC), MongoDB persistence & dynamic configuration, PyJWT bearer token authentication, bcrypt password hashing, and Google Gemini AI multi-agent orchestration.

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: FastAPI (Python 3.10+)
- **ASGI Web Server**: Uvicorn
- **Database Engine**: MongoDB (`networkiq` database via PyMongo / Motor)
- **Security & RBAC**: PyJWT (`pyjwt`), Passlib / Bcrypt password hashing
- **Data Validation & Schemas**: Pydantic v2, `pydantic-settings`
- **Analytics & Processing**: Pandas, NumPy (Preprocessed Indian Store Sales Dataset)
- **AI Infrastructure**: Google Gemini 2.5 SDK (`google-genai` / `google-generativeai`)

---

## 🗄️ MongoDB-First Persistence & Configuration Architecture

In NetworkIQ, **MongoDB is the primary source of truth** for all application configurations, parameters, thresholds, master inventory, user accounts, and operational history, eliminating dependence on `.env` configuration files or static CSVs.

### Why MongoDB-First?
- **Dynamic Configuration Updates**: Parameters like `APPROVAL_THRESHOLD` (0.9), `DEFAULT_HOLDING_COST_RATE` (1.5), `DEFAULT_LEAD_TIME_DAYS` (7), cold-chain rules, and warehouse storage capacity are stored as JSON documents in MongoDB. Admins can tweak system parameters without requiring application redeployments or server restarts.
- **Single Source of Truth**: User accounts, stock levels, planner signoffs, and audit trails persist safely in MongoDB collections.
- **Minimal `.env` Scope**: Environment files are limited strictly to infrastructure credentials such as `MONGODB_URI`, `PORT`, and `GEMINI_API_KEY`.

---

## 📊 MongoDB Collections Schema

1. **`system_config`**: Dynamic system parameters, approval thresholds, default holding costs, and lead times.
2. **`users`**: User profile documents containing bcrypt hashed passwords, assigned role (`admin`, `planner`, `stock_manager`), assigned region (`North`, `South`, `East`, `West`, or `all`), and account status (`enabled: true/false`).
3. **`inventory`**: Master store inventory positions (96 SKU positions across 4 regional warehouses).
4. **`stock_history`**: Complete audit trail of stock additions, removals, and adjustments.
5. **`planner_decisions`**: Planner decision logs (`approve`, `reject`, `override`) for transfer proposals.
6. **`audit_logs`**: System audit event log entries tracking logins, logouts, administrative actions, and stock changes.
7. **`lane_costs`**: 12 region-to-region transfer cost pricing pairs (freight & handling per unit).
8. **`cold_chain`**: Regional cold-chain requirements and temperature control policies.
9. **`warehouse_capacity`**: Maximum warehouse storage volume limits per regional distribution center.

---

## 🔐 Security Architecture & RBAC (Role-Based Access Control)

### User Roles & Regional Boundaries

1. **Admin** (`role: admin`, `region: all`)
   - Complete user account lifecycle management (Create, Edit, Delete, Enable, Disable, Password Reset).
   - Global visibility across all regions, dashboards, multi-agent tools, analytics, and audit logs.

2. **Planner** (`role: planner`, `region: all`)
   - Access to Command Dashboard, AI Recommendations, Planner Approval Center (`approve`/`reject`/`override`), Solver Benchmarks, and Demand Analytics.
   - Restricted from manually adding/deleting regional stock or managing user accounts.

3. **Stock Manager** (`role: stock_manager`, `region: North | South | East | West`)
   - Assigned strictly to **EXACTLY ONE region**.
   - Authorized to view inventory, perform stock adjustments (`POST /stock/update`), and view stock history within their assigned region.
   - **Enforced Constraint**: Attempting to view or modify stock outside their assigned region returns `HTTP 403 Forbidden`.

---

## 📡 Complete Catalog of Backend REST API Endpoints

### 1. System & Health APIs
- `GET /` — Returns system name, status, and running version.
- `GET /health` — Returns system health status, database connection state, environment, and Gemini LLM connection.

### 2. Authentication APIs (`/auth`)
- `POST /auth/login` — Authenticates user credentials against MongoDB (bcrypt verification) and issues signed JWT access and refresh tokens.
- `GET /auth/me` — Fetches current authenticated user profile session.
- `POST /auth/logout` — Terminates user session and logs security audit entry in MongoDB.
- `POST /auth/refresh` — Generates fresh access token using `X-Refresh-Token` header.

### 3. Admin User Management APIs (`/admin/users`) — Admin Only
- `POST /admin/users` — Creates a new Stock Manager or user account document in MongoDB.
- `GET /admin/users` — Fetches all user documents stored in MongoDB.
- `GET /admin/users/{user_id}` — Gets detailed user profile by ID.
- `PUT /admin/users/{user_id}` — Edits user details (Name, Role, Region).
- `DELETE /admin/users/{user_id}` — Deletes user account document from MongoDB.
- `PUT /admin/users/{user_id}/disable` — Disables user account (blocks login authentication).
- `PUT /admin/users/{user_id}/enable` — Enables user account.
- `PUT /admin/users/{user_id}/reset-password` — Resets user password with bcrypt hashing.

### 4. Stock Management APIs (`/stock`) — Stock Manager & Admin
- `POST /stock/update` — Adds or removes inventory stock in assigned region (Region-restricted).
- `GET /stock/history` — Retrieves stock adjustment audit history from MongoDB.

### 5. Core Supply Chain & AI Planner APIs
- `GET /dashboard` — Retrieves live dashboard KPIs, recent transfer proposals, and warehouse capacity utilization from MongoDB.
- `GET /inventory` — Retrieves and filters 96 preprocessed regional store inventory positions from MongoDB.
- `GET /plan` — Retrieves latest AI validated stock transfer plan recommendations.
- `POST /plan/decision` — Submits planner decision (`approve`, `reject`, `override`) for a proposed transfer.
- `POST /plan/{id}/approve` — Approves specific transfer recommendation by ID.
- `POST /plan/{id}/override` — Overrides transfer quantity or parameters.
- `GET /self-check` / `POST /selfcheck` — Runs Self-Check Agent safety evaluation against current stock transfer plan.
- `GET /analytics` — Retrieves SKU velocity distribution (A/B/C) and top mover metrics.
- `GET /audit` — Retrieves system-wide audit event logs from MongoDB.
- `GET /benchmark` — Retrieves classical math solver vs NetworkIQ AI multi-agent engine performance benchmarks.
- `GET /config` — Retrieves dynamic system configuration parameters and thresholds from MongoDB.

### 6. AI Agent Orchestration APIs
- `POST /agents/regional/{region}` — Triggers Regional Agent optimization for specified region (`North`, `South`, `East`, `West`).
- `POST /agents/coordinate` — Triggers Coordinator Agent multi-region rebalancing engine.
- `POST /guardrails/validate` — Validates transfer candidate against capacity, cold-chain, holding cost, margin, and signoff threshold guardrails.
- `POST /cost/calculate` — Computes transfer freight costs, handling fees, and margin unlock value.

---

## 🤖 Multi-Agent AI Framework Pipeline

```
1. Regional Agents ──► 2. Coordinator Agent ──► 3. Cost Engine ──► 4. Guardrails Engine ──► 5. Self-Check Agent
 (Surplus/Deficit)     (Cross-Region Plan)    (Lane/Margin)      (Capacity/ColdChain)     (Sanity Review)
```

- **Regional Agent**: Analyzes stock levels per warehouse region to identify stockouts and excess buffer stock.
- **Coordinator Agent**: Synthesizes regional insights into a network-wide multi-echelon stock rebalancing plan.
- **Cost Engine**: Calculates exact freight costs using lane pricing matrices, handling fees, and estimated margin unlock.
- **Guardrails Engine**: Enforces strict business constraints (storage capacity limits, cold-chain compliance, max transfer quantities, planner approval thresholds).
- **Self-Check Agent**: Performs automated pre-execution validation to ensure no safety stock violations or policy breaches occur.

---

## 🛠️ Installation & Execution

```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate Virtual Environment & Install Dependencies
.venv\Scripts\activate
pip install -r requirements.txt

# 3. Start FastAPI Application Server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Live FastAPI API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc API Documentation**: `http://localhost:8000/redoc`

---

## 🧪 Automated Unit & Integration Test Suite

Execute the full backend test suite covering RBAC, MongoDB persistence, cost engine, guardrail validation, and API endpoints:

```bash
.venv\Scripts\python.exe -m unittest discover
```

- **Test Result**: **36 / 36 tests passing (100% SUCCESS)**
