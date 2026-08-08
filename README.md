# 🚀 NetworkIQ — Enterprise AI-Powered Regional Inventory Optimization System

**NetworkIQ** is an Agentic AI-based inventory optimization and multi-echelon stock rebalancing platform. The system analyzes regional store inventory across India, detects surplus and deficit stock positions, generates cost-effective transfer recommendations using Google Gemini LLM agents, enforces strict deterministic business guardrails, and provides a role-based human approval console.

---

## 📌 System Highlights

- 🤖 **Multi-Agent AI Architecture**: Regional Agent, Coordinator Agent, Self-Check Agent.
- 🔐 **MongoDB & JWT RBAC Security**: Admin, Planner, and Regional Stock Manager access control.
- 🗺️ **Region-Based Access Control**: Stock managers restricted strictly to their assigned region (`North`, `South`, `East`, `West`).
- 📊 **Real Dataset Integration**: 96 preprocessed Indian Store Sales records across 4 regions and 24 sub-categories.
- 💰 **Pure Python Cost Engine**: Dynamic transportation lane matrix & margin unlock calculator.
- 🛡️ **Deterministic Guardrails**: Capacity, cold-chain, holding cost, margin, and signoff threshold validation.
- ⚡ **React 19 + TanStack Console**: Premium dark-first dashboard connected live to FastAPI APIs.
- 📜 **Full Audit Logging**: Audit trails for login/logout, user administration, stock edits, and planner approvals.

---

## 🏗️ System Architecture

```
Preprocessed Indian Store Sales Data (backend/data/)
  ├── master_inventory.csv (96 positions)
  ├── lane_cost.csv (12 region-to-region transfer pairs)
  ├── region_capacity.csv (4 warehouse capacities)
  └── cold_chain.csv (4 regional cold-chain rules)
              │
              ▼
   Regional Agent (Gemini LLM)
              │
              ▼
  Coordinator Agent (Gemini LLM)
              │
              ▼
    Cost Engine (Python)
              │
              ▼
Guardrail Validation Engine (Python)
              │
              ▼
   Self Check Agent (Gemini LLM)
              │
              ▼
   FastAPI Backend Server (Port 8000) ◄── MongoDB (`networkiq`)
              │
              ▼
   React Dashboard Client (Port 5173) ◄── JWT Authentication
```

---

## 📡 Complete FastAPI Backend API Matrix

Below is the complete catalog of REST APIs served by the NetworkIQ FastAPI backend (`http://localhost:8000`):

| Category | Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | Public | System status and version details |
| **Health** | `GET` | `/health` | Public | Health status, version, Gemini LLM connection |
| **Auth** | `POST` | `/auth/login` | Public | Authenticate email/password (bcrypt) & issue JWT tokens |
| **Auth** | `GET` | `/auth/me` | Authenticated | Fetch active user session profile |
| **Auth** | `POST` | `/auth/logout` | Authenticated | Logout user session & log security audit entry |
| **Auth** | `POST` | `/auth/refresh` | Public | Refresh access token using `X-Refresh-Token` header |
| **Admin** | `POST` | `/admin/users` | `admin` | Create a new Stock Manager or user account |
| **Admin** | `GET` | `/admin/users` | `admin` | List all user documents stored in MongoDB |
| **Admin** | `GET` | `/admin/users/{id}` | `admin` | Get specific user profile by ID |
| **Admin** | `PUT` | `/admin/users/{id}` | `admin` | Edit user profile (Name, Role, Region) |
| **Admin** | `DELETE`| `/admin/users/{id}` | `admin` | Delete user account from MongoDB |
| **Admin** | `PUT` | `/admin/users/{id}/disable` | `admin` | Disable user account (blocks login) |
| **Admin** | `PUT` | `/admin/users/{id}/enable` | `admin` | Enable user account |
| **Admin** | `PUT` | `/admin/users/{id}/reset-password` | `admin` | Reset user password with bcrypt hashing |
| **Stock** | `POST` | `/stock/update` | `stock_manager`, `admin` | Add or remove stock in assigned region (Region-restricted) |
| **Stock** | `GET` | `/stock/history` | `stock_manager`, `admin` | View stock adjustment audit history |
| **Core** | `GET` | `/dashboard` | Authenticated | High-level KPIs, recent transfers, warehouse metrics |
| **Core** | `GET` | `/inventory` | Authenticated | Filterable 96 regional inventory positions |
| **Core** | `GET` | `/plan` | Authenticated | Latest AI validated transfer plan recommendations |
| **Core** | `POST` | `/plan/decision` | `planner`, `admin` | Submit planner decision (`approve`, `reject`, `override`) |
| **Core** | `POST` | `/plan/{id}/approve` | `planner`, `admin` | Approve specific transfer recommendation |
| **Core** | `POST` | `/plan/{id}/override` | `planner`, `admin` | Override transfer quantity or parameters |
| **Core** | `GET` | `/self-check` | Authenticated | Retrieve Self-Check Agent status & review result |
| **Core** | `POST` | `/selfcheck` | Authenticated | Trigger Self-Check Agent review on transfer plan |
| **Core** | `GET` | `/analytics` | Authenticated | SKU velocity distribution (A/B/C) & top movers |
| **Core** | `GET` | `/audit` | Authenticated | System-wide audit log trail |
| **Core** | `GET` | `/benchmark` | Authenticated | Classical solver vs AI decision engine comparison |
| **Core** | `GET` | `/config` | Authenticated | System configuration & threshold parameters |
| **Agents**| `POST` | `/agents/regional/{region}` | Authenticated | Run regional optimization agent for specified region |
| **Agents**| `POST` | `/agents/coordinate` | Authenticated | Run multi-agent coordinator rebalancing engine |
| **Agents**| `POST` | `/guardrails/validate` | Authenticated | Validate transfer candidate against business guardrails |

---

## 🔐 Default User Credentials

| Role | Email | Password | Assigned Region | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@networkiq.com` | `admin123` | `all` | System administration & Stock Manager user management |
| **Planner** | `planner@networkiq.com` | `planner123` | `all` | Dashboard, AI recommendation approvals, Analytics, Audit |
| **North Manager** | `north_manager@networkiq.com` | `stock123` | `North` | Stock updates & inventory for **North Region only** |
| **South Manager** | `south_manager@networkiq.com` | `stock123` | `South` | Stock updates & inventory for **South Region only** |
| **East Manager** | `east_manager@networkiq.com` | `stock123` | `East` | Stock updates & inventory for **East Region only** |
| **West Manager** | `west_manager@networkiq.com` | `stock123` | `West` | Stock updates & inventory for **West Region only** |

---

## ▶️ How to Run the Full System

### 1. Start FastAPI Backend (Terminal 1)
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Server: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

### 2. Start React Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
- Dashboard App: `http://localhost:5173`

---

## 🧪 Run Unit & Endpoint Test Suite

```bash
cd backend
.venv\Scripts\python.exe -m unittest discover
```
- **Test Result**: **36 / 36 tests passing (100% SUCCESS)**