# NetworkIQ Backend API — Production Service

The FastAPI backend powers **NetworkIQ**, an enterprise multi-agent supply chain optimization and stock balancing platform.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn ASGI
- **Database**: MongoDB (`pymongo`, `motor`)
- **Authentication**: JWT (`pyjwt`) & bcrypt password hashing
- **Data Validation & Settings**: Pydantic v2 & `pydantic-settings`
- **Data Processing**: Pandas & NumPy
- **AI Infrastructure**: Google Gemini LLM SDK (`google-genai`)

---

## 📋 Installation & Setup

1. **Create Virtual Environment & Install Dependencies**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment Variables (`.env`)**:
   ```env
   APP_NAME="NetworkIQ Backend API"
   APP_VERSION="1.0.0"
   ENVIRONMENT="development"
   GEMINI_API_KEY="your_gemini_api_key_here"
   GEMINI_MODEL="gemini-2.5-flash"
   JWT_SECRET_KEY="networkiq_super_secret_jwt_key_2026_prod"
   MONGODB_URI="mongodb://localhost:27017"
   ALLOWED_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
   ```

3. **Start FastAPI Backend Server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 🔐 Security, Roles & Access Control

### 1. MongoDB Collections
- `users`: Stores user accounts with bcrypt hashed passwords.
- `inventory`: Preprocessed Indian Store Sales inventory data (96 rows across 4 regions).
- `stock_history`: Audit trail for stock adjustments.
- `planner_decisions`: Planner decision logs.
- `audit_logs`: System-wide audit event records.

### 2. User Roles & Regional Permissions
- **Admin** (`admin@networkiq.com`): Full system administration, creates/edits/deletes Stock Manager accounts.
- **Planner** (`planner@networkiq.com`): Reviews, approves, rejects, and overrides AI recommendations.
- **Stock Managers**: Assigned to a specific region (`North`, `South`, `East`, `West`). Authorized ONLY to modify stock within their designated region. Attempting cross-region updates returns `403 Forbidden`.

---

## 🧪 Test Suite Execution

Run all 36 unit and integration tests:

```bash
.venv\Scripts\python.exe -m unittest discover
```
