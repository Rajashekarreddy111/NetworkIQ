# NetworkIQ Backend API — Technical Documentation

The FastAPI backend powers **NetworkIQ**, an enterprise multi-agent supply chain optimization and inventory rebalancing platform. It provides role-based and region-based access control, MongoDB persistence, PyJWT bearer authentication, and Google Gemini AI orchestration.

---

## 🏗️ Tech Stack

- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: Uvicorn
- **Database**: MongoDB (`pymongo`, `motor`)
- **Security**: JWT (`pyjwt`), bcrypt password hashing
- **Data Validation & Configuration**: Pydantic v2, `pydantic-settings`
- **Data Integration**: Pandas, NumPy (Preprocessed Indian Store Sales Dataset)
- **AI Infrastructure**: Google Gemini 2.5 SDK (`google-genai`)

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

- **Live Server**: `http://localhost:8000`
- **Interactive Swagger OpenAPI Docs**: `http://localhost:8000/docs`
- **ReDoc API Documentation**: `http://localhost:8000/redoc`

---

## 🔑 Authentication & Access Control (RBAC)

### User Roles & Regional Boundaries

1. **Admin** (`role: admin`, `region: all`)
   - Manages Stock Manager user accounts (Create, Edit, Delete, Enable, Disable, Password Reset).
   - Has full visibility across all regions, dashboards, analytics, and audit logs.

2. **Planner** (`role: planner`, `region: all`)
   - Views AI recommendations, approves/rejects/overrides stock transfer recommendations, views benchmarks and analytics.
   - Restricted from adding/deleting inventory or managing users.

3. **Stock Manager** (`role: stock_manager`, `region: North | South | East | West`)
   - Assigned to **EXACTLY ONE region**.
   - Authorized to add/remove stock and view stock history within their assigned region.
   - **Enforced Constraint**: Accessing or updating stock in a region other than their assigned region returns `HTTP 403 Forbidden`.

---

## 📡 Complete List of Exposed API Endpoints

### 1. System & Health APIs
- `GET /` — System status, application title, and version details.
- `GET /health` — System health check, version, environment, and Gemini LLM status.

### 2. Authentication APIs (`/auth`)
- `POST /auth/login` — Authenticate user credentials against MongoDB (bcrypt verification) and issue signed JWT access & refresh tokens.
- `GET /auth/me` — Retrieve profile details of currently authenticated user.
- `POST /auth/logout` — Logout user session and log security audit entry.
- `POST /auth/refresh` — Refresh access token using `X-Refresh-Token` header.

### 3. Admin User Management APIs (`/admin/users`) — Admin Only
- `POST /admin/users` — Create a new Stock Manager or user account for a designated region.
- `GET /admin/users` — List all registered user documents stored in MongoDB.
- `GET /admin/users/{user_id}` — Get detailed user profile by ID.
- `PUT /admin/users/{user_id}` — Edit user details (Name, Role, Region).
- `DELETE /admin/users/{user_id}` — Delete user account from MongoDB.
- `PUT /admin/users/{user_id}/disable` — Disable user account (blocks login).
- `PUT /admin/users/{user_id}/enable` — Enable user account.
- `PUT /admin/users/{user_id}/reset-password` — Reset user password with bcrypt hashing.

### 4. Stock Management APIs (`/stock`) — Stock Manager & Admin
- `POST /stock/update` — Add or remove inventory stock in assigned region (Region-restricted).
- `GET /stock/history` — Retrieve stock adjustment audit history from MongoDB.

### 5. Core Supply Chain & AI Planner APIs
- `GET /dashboard` — Retrieve live dashboard metrics, KPIs, recent transfers, and utilization.
- `GET /inventory` — Retrieve and filter 96 preprocessed regional inventory positions.
- `GET /plan` — Retrieve latest AI validated stock transfer plan recommendations.
- `POST /plan/decision` — Submit planner decision (`approve`, `reject`, `override`) for a transfer.
- `POST /plan/{id}/approve` — Approve specific transfer recommendation by ID.
- `POST /plan/{id}/override` — Override transfer quantity or parameters.
- `GET /self-check` / `POST /selfcheck` — Run Self-Check Agent evaluation against transfer plan.
- `GET /analytics` — Retrieve velocity distribution (A/B/C) and top mover metrics.
- `GET /audit` — Retrieve system-wide audit log trail.
- `GET /benchmark` — Retrieve classical vs AI multi-agent benchmark performance metrics.
- `GET /config` — Retrieve system parameters and planner thresholds.

### 6. AI Agent Orchestration APIs
- `POST /agents/regional/{region}` — Trigger Regional Agent optimization for specified region (`North`, `South`, `East`, `West`).
- `POST /agents/coordinate` — Trigger Coordinator Agent multi-region rebalancing engine.
- `POST /guardrails/validate` — Validate transfer candidate against capacity, cold-chain, holding cost, and safety stock guardrails.

---

## 🗄️ MongoDB Collections Schema

1. **`users`**: User profiles with bcrypt hashed passwords, role, region, and status.
2. **`inventory`**: Master inventory records (96 positions across 4 regions).
3. **`stock_history`**: Audit trail of stock additions and removals.
4. **`planner_decisions`**: Recorded planner decisions.
5. **`audit_logs`**: System audit event log entries.

---

## 🧪 Verification & Testing

Run all 36 unit, integration, RBAC, and API endpoint tests:

```bash
.venv\Scripts\python.exe -m unittest discover
```
