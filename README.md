# 🚀 NetworkIQ — Enterprise AI-Powered Regional Inventory Optimization System

**NetworkIQ** is an Agentic AI-powered regional inventory optimization and multi-echelon stock rebalancing platform. Built for modern supply chain enterprise networks across India, NetworkIQ analyzes store inventory levels, detects surplus and deficit positions, generates cost-optimized transfer recommendations using Google Gemini AI agents, enforces strict deterministic business guardrails, and provides an interactive role-based human approval console.

---

## 📌 System Highlights

- 🤖 **Multi-Agent AI Architecture**: Powered by Google Gemini (`Regional Agent`, `Coordinator Agent`, and `Self-Check Agent`).
- 🗄️ **MongoDB-First Configuration & Persistence Engine**: All system parameters, approval thresholds (`APPROVAL_THRESHOLD=0.9`), holding cost rates, lead times, safety stocks, regional store inventory (96 positions), user credentials, stock history, and audit logs are stored in and dynamically retrieved from **MongoDB (`networkiq` database)** instead of static `.env` files.
- 🔐 **JWT & MongoDB RBAC Security**: Granular Role-Based Access Control (`Admin`, `Planner`, `Stock Manager`) with bcrypt password hashing and token refresh.
- 🗺️ **Region-Based Access Scoping**: Stock managers are restricted strictly to their assigned region (`North`, `South`, `East`, `West`).
- 📊 **Real Dataset Integration**: 96 preprocessed Indian Store Sales records across 4 geographic regions and 24 product sub-categories.
- 💰 **Pure Python Cost Engine**: Dynamic freight lane costs, handling fees, and margin unlock calculation.
- 🛡️ **Deterministic Guardrails Engine**: Enforces warehouse storage capacity, cold-chain compliance, holding cost limits, margin bounds, and planner signoff thresholds.
- ⚡ **React 19 + TanStack Console**: Premium dark-first enterprise dashboard connected live to FastAPI backend APIs.
- 📜 **Full Audit Logging**: Complete audit trails for logins/logouts, user administration, stock adjustments, and planner decision workflows.

---

## 🏗️ System Architecture & Data Flow

```
                               ┌─────────────────────────────────────────┐
                               │       MongoDB (`networkiq` DB)           │
                               │                                         │
                               │  - `system_config` (Thresholds/Params) │
                               │  - `inventory` (96 Store Positions)     │
                               │  - `users` (RBAC & Hashed Passwords)    │
                               │  - `stock_history` (Audit Log Entries)  │
                               │  - `planner_decisions` (Approvals)      │
                               │  - `audit_logs` (Security/System Logs)  │
                               │  - `lane_costs`, `cold_chain`, `cap`    │
                               └────────────────────┬────────────────────┘
                                                    │ Dynamic Queries & Sync
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FastAPI Backend Server (Port 8000)                             │
│                                                                                                 │
│  ┌─────────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────────────┐  │
│  │  Regional Agent (Gemini)│──►│Coordinator Agent (Gemini) │──►│     Cost Engine (Python)    │  │
│  └─────────────────────────┘   └───────────────────────────┘   └──────────────┬──────────────┘  │
│                                                                               │                 │
│  ┌─────────────────────────┐   ┌───────────────────────────┐                  │                 │
│  │ Self-Check Agent(Gemini)│◄──│  Guardrail Engine (Python)│◄─────────────────┘                 │
│  └─────────────────────────┘   └───────────────────────────┘                                    │
└───────────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                    │ REST APIs & JWT Auth
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │   React 19 Dashboard Client (Port 5173) │
                               │                                         │
                               │  - Command Dashboard & Real-Time KPIs   │
                               │  - Master Inventory Explorer            │
                               │  - AI Recommendations & Approval Center │
                               │  - Multi-Agent Operations Console       │
                               │  - Demand Analytics & Solver Benchmark  │
                               │  - Regional Warehouse Stock Management  │
                               │  - Audit Logs & Security Console        │
                               │  - System Configuration & User Admin    │
                               └─────────────────────────────────────────┘
```

---

## 🗄️ MongoDB-First Architecture (Replacing `.env` Configs)

Unlike traditional applications that rely on static `.env` configuration files, NetworkIQ uses **MongoDB as its centralized configuration, parameter, and data engine**.

### Key Advantages:
1. **Dynamic Configuration Management**: System thresholds (e.g. `APPROVAL_THRESHOLD=0.9`, `DEFAULT_HOLDING_COST_RATE=1.5`, `DEFAULT_LEAD_TIME_DAYS=7`), regional warehouse capacity rules, cold-chain guardrail rules, and transfer lane cost matrices are stored as JSON documents in MongoDB collections and can be updated dynamically without restarting backend services.
2. **Centralized Source of Truth**: User accounts, RBAC permissions, 96 regional inventory SKU records, stock movement history, planner decisions, and audit events are stored in MongoDB.
3. **Minimal `.env` Overhead**: Environment files are used solely for low-level connection strings (e.g. `MONGODB_URI`, `PORT`, `GEMINI_API_KEY`).

---

## 📡 Complete FastAPI Backend API Matrix

Below is the complete catalog of REST APIs served by the NetworkIQ FastAPI backend (`http://localhost:8000`):

| Category | Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/` | Public | System status, application title, and version details |
| **Health** | `GET` | `/health` | Public | System health check, version, environment, and Gemini LLM connection |
| **Auth** | `POST` | `/auth/login` | Public | Authenticate email/password (bcrypt) against MongoDB & issue JWT tokens |
| **Auth** | `GET` | `/auth/me` | Authenticated | Fetch current authenticated user session profile |
| **Auth** | `POST` | `/auth/logout` | Authenticated | Logout user session & log security audit entry in MongoDB |
| **Auth** | `POST` | `/auth/refresh` | Public | Refresh access token using `X-Refresh-Token` header |
| **Admin** | `POST` | `/admin/users` | `admin` | Create a new Stock Manager or user account in MongoDB |
| **Admin** | `GET` | `/admin/users` | `admin` | List all user documents stored in MongoDB |
| **Admin** | `GET` | `/admin/users/{id}` | `admin` | Get specific user profile document by ID |
| **Admin** | `PUT` | `/admin/users/{id}` | `admin` | Edit user profile details (Name, Role, Region) |
| **Admin** | `DELETE`| `/admin/users/{id}` | `admin` | Delete user account document from MongoDB |
| **Admin** | `PUT` | `/admin/users/{id}/disable` | `admin` | Disable user account (blocks login authentication) |
| **Admin** | `PUT` | `/admin/users/{id}/enable` | `admin` | Enable user account |
| **Admin** | `PUT` | `/admin/users/{id}/reset-password` | `admin` | Reset user password with bcrypt hashing |
| **Stock** | `POST` | `/stock/update` | `stock_manager`, `admin` | Add or remove stock in assigned region (Region-restricted) |
| **Stock** | `GET` | `/stock/history` | `stock_manager`, `admin` | Retrieve stock adjustment audit history from MongoDB |
| **Core** | `GET` | `/dashboard` | Authenticated | High-level KPIs, recent transfers, warehouse metrics from MongoDB |
| **Core** | `GET` | `/inventory` | Authenticated | Filterable 96 regional store inventory positions from MongoDB |
| **Core** | `GET` | `/plan` | Authenticated | Latest AI validated stock transfer recommendations |
| **Core** | `POST` | `/plan/decision` | `planner`, `admin` | Submit planner decision (`approve`, `reject`, `override`) |
| **Core** | `POST` | `/plan/{id}/approve` | `planner`, `admin` | Approve specific transfer recommendation by ID |
| **Core** | `POST` | `/plan/{id}/override` | `planner`, `admin` | Override transfer quantity or parameters |
| **Core** | `GET` | `/self-check` | Authenticated | Retrieve Self-Check Agent status & review result |
| **Core** | `POST` | `/selfcheck` | Authenticated | Trigger Self-Check Agent review on stock transfer plan |
| **Core** | `GET` | `/analytics` | Authenticated | SKU velocity distribution (A/B/C) & top mover metrics |
| **Core** | `GET` | `/audit` | Authenticated | System-wide audit log trail stored in MongoDB |
| **Core** | `GET` | `/benchmark` | Authenticated | Classical solver vs NetworkIQ AI decision engine comparison |
| **Core** | `GET` | `/config` | Authenticated | Retrieve dynamic system parameters & thresholds from MongoDB |
| **Agents**| `POST` | `/agents/regional/{region}` | Authenticated | Run regional optimization agent for specified region |
| **Agents**| `POST` | `/agents/coordinate` | Authenticated | Run multi-agent coordinator rebalancing engine |
| **Agents**| `POST` | `/guardrails/validate` | Authenticated | Validate transfer candidate against business guardrails |
| **Agents**| `POST` | `/cost/calculate` | Authenticated | Compute transfer freight cost, handling, and margin unlock |

---

## 💻 React 19 Frontend Route & Feature Matrix

The React 19 client (`http://localhost:5173`) provides an interactive interface for all supply chain personas:

| Route | Feature | Description | Target Persona |
| :--- | :--- | :--- | :--- |
| `/` | **Command Dashboard** | Real-time network KPIs, warehouse utilization, recent AI transfer activity | All Users |
| `/inventory` | **Inventory Explorer** | Filterable grid of 96 Indian store inventory positions with stock status badges | All Users |
| `/recommendations` | **AI Recommendations** | Interactive listing of AI stock transfer proposals with financial metrics | Planners / Admins |
| `/approvals` | **Planner Approval Center** | Action hub to Approve, Reject, or Override AI transfer plans | Planners / Admins |
| `/analytics` | **Analytics Workspace** | SKU velocity distribution (A/B/C), stockout risk analysis, and demand trends | Planners / Admins |
| `/agents` | **Multi-Agent Console** | Live AI agent execution trigger (Regional, Coordinator, Self-Check) & logs | Planners / Admins |
| `/benchmark` | **Solver Benchmark** | Classical math solver vs Gemini AI multi-agent decision engine comparison | Supply Chain Analysts |
| `/warehouse` | **Warehouse Management** | Regional inventory stock updates (`Add`/`Remove`) and stock adjustment log | Stock Managers / Admins |
| `/audit` | **Audit Trail** | Comprehensive event audit log (login, user updates, stock edits, approvals) | Admins / Compliance |
| `/settings` | **System Settings** | Configuration manager for thresholds, holding cost rates, and guardrails | Admins |
| `/profile` | **User Profile** | User session information, role badges, and assigned region display | All Users |
| `/login` | **Login Console** | Secure authentication portal with JWT token creation | Public |

---

## 🔐 Default System User Credentials

The system seeds default user accounts in MongoDB for instant evaluation:

| Role | Email | Password | Assigned Region | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@networkiq.com` | `admin123` | `all` | Full system administration, user management, global settings |
| **Planner** | `planner@networkiq.com` | `planner123` | `all` | Dashboard, AI recommendations approval, analytics, benchmarks |
| **North Manager** | `north_manager@networkiq.com` | `stock123` | `North` | Inventory stock updates & history for **North Region only** |
| **South Manager** | `south_manager@networkiq.com` | `stock123` | `South` | Inventory stock updates & history for **South Region only** |
| **East Manager** | `east_manager@networkiq.com` | `stock123` | `East` | Inventory stock updates & history for **East Region only** |
| **West Manager** | `west_manager@networkiq.com` | `stock123` | `West` | Inventory stock updates & history for **West Region only** |

---

## ▶️ How to Run the Full System

### 1. Start FastAPI Backend (Terminal 1)
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc API Docs**: `http://localhost:8000/redoc`

### 2. Start React 19 Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
- **React Application**: `http://localhost:5173`

---

## 🧪 Verification & Automated Test Suite

Run the full automated test suite covering unit logic, guardrails, cost engine, multi-agent planners, MongoDB persistence, and RBAC authentication:

```bash
cd backend
.venv\Scripts\python.exe -m unittest discover
```
- **Test Result**: **36 / 36 tests passing (100% SUCCESS)**