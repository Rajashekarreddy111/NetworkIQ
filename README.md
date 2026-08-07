# 🚀 NetworkIQ – AI-Powered Regional Inventory Optimization

NetworkIQ is an Agentic AI-based inventory optimization system developed for a hackathon. The system analyzes inventory across multiple regions, identifies surplus and deficit stock, recommends inter-region inventory transfers, validates recommendations using deterministic business rules, and provides a human approval workflow.

The objective is to reduce inventory holding costs, improve stock availability, and maximize operational efficiency using Large Language Models (LLMs) and rule-based optimization.

---

# 📌 Features

- 🤖 Multi-Agent AI Architecture
- 📊 Regional Inventory Analysis
- 🔄 Intelligent Inventory Transfer Recommendations
- 💰 Cost & Margin Analysis
- 🛡️ Deterministic Business Guardrails
- ✅ Human Approval Workflow
- 📈 Baseline vs AI Comparison
- 📜 Audit Trail for Every Recommendation
- 🌐 REST APIs using FastAPI
- 📑 Swagger API Documentation

---

# 🏗️ System Architecture

```

Indian Store Dataset
│
▼
Preprocessing Pipeline
(Person A)
│
▼
Regional Inventory Dataset
│
▼
Regional Agent (LLM)
│
▼
Coordinator Agent (LLM)
│
▼
Cost Engine (Python)
│
▼
Guardrail Validation Engine
│
▼
Self Check Agent (LLM)
│
▼
FastAPI Backend
│
▼
React Dashboard

```

---

# 🧠 Multi-Agent Workflow

## 1. Regional Agent

Analyzes inventory within a region.

Responsibilities

- Detect surplus products
- Detect deficit products
- Estimate transfer quantity
- Generate structured JSON output

---

## 2. Coordinator Agent

Receives outputs from all Regional Agents.

Responsibilities

- Match surplus regions with deficit regions
- Generate optimized transfer recommendations
- Explain recommendation reasoning
- Provide cost trade-off details

---

## 3. Cost Engine

Pure Python implementation.

Responsibilities

- Holding Cost
- Transfer Cost
- Margin Unlocked
- Cost Per Recommendation

No AI is used in this stage.

---

## 4. Guardrail Validation

Deterministic validation layer.

Checks

- Margin vs Transfer Cost
- Capacity Constraints
- Inventory Availability
- Cold Chain Requirements
- Transfer Thresholds

---

## 5. Self Check Agent

Reviews the final plan against business objectives before presenting recommendations.

---

# 🗂️ Project Structure

```

backend/
│
├── app/
│
├── agents/
│ ├── llm.py
│ ├── regional_agent.py
│ ├── coordinator_agent.py
│ └── selfcheck_agent.py
│
├── services/
│ ├── loader.py
│ ├── cost_engine.py
│ └── planner.py
│
├── guardrails/
│ └── validator.py
│
├── models/
│
├── routers/
│
├── prompts/
│ ├── regional_prompt.txt
│ ├── coordinator_prompt.txt
│ └── selfcheck_prompt.txt
│
├── utils/
│ └── logger.py
│
├── config.py
│
├── main.py
│
└── requirements.txt

```

---

# 📂 Expected Data

The backend expects preprocessed datasets generated from the provided Kaggle datasets.

```

data/
│
├── master_inventory.csv
├── lane_cost.csv
├── region_capacity.csv
├── cold_chain.csv

```

---

# 📊 Data Pipeline

Raw Kaggle Datasets

↓

Preprocessing

↓

Region-wise Inventory

↓

Regional Agent

↓

Coordinator Agent

↓

Cost Engine

↓

Guardrails

↓

Self Check

↓

Dashboard

---

# 🔌 API Endpoints

| Method | Endpoint | Description |
|----------|-----------------------------------|-----------------------------------------|
| POST | `/agents/regional/{region}` | Analyze regional inventory |
| POST | `/agents/coordinate` | Generate transfer recommendations |
| POST | `/cost/calculate` | Calculate costs |
| POST | `/guardrails/validate` | Validate transfer recommendations |
| POST | `/selfcheck` | Review final recommendations |
| GET | `/plan` | Retrieve latest transfer plan |
| POST | `/plan/{id}/approve` | Approve recommendation |
| POST | `/plan/{id}/override` | Override recommendation |

---

# 🧾 Technology Stack

## Backend

- Python
- FastAPI
- Pydantic
- Uvicorn

## AI

- Google Gemini API
- Multi-Agent Prompt Engineering

## Data Processing

- Pandas
- NumPy

## Frontend

- React
- Tailwind CSS

---

# 📋 Development Workflow

Stage 1 — Backend Setup

Stage 2 — Data Models

Stage 3 — LLM Infrastructure

Stage 4 — Inventory Loader

Stage 5 — Regional Agent

Stage 6 — Coordinator Agent

Stage 7 — Cost Engine

Stage 8 — Guardrails

Stage 9 — Self Check Agent

Stage 10 — REST APIs

---

# ▶️ Running the Project

## Clone Repository

```bash
git clone <repository-url>
cd backend
```

## Create Virtual Environment

```bash
python -m venv venv
```

Activate

Windows

```bash
venv\Scripts\activate
```

Linux / macOS

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create `.env`

```env
GEMINI_API_KEY=your_api_key
```

---

## Run Server

```bash
uvicorn app.main:app --reload
```

---

## Swagger Documentation

```
http://127.0.0.1:8000/docs
```

---

# 👥 Team Responsibilities

## Person A

- Data Cleaning
- Feature Engineering
- Inventory Dataset Preparation
- Classical Baseline Model

---

## Person B

- Regional Agent
- Coordinator Agent
- Cost Engine
- Guardrails
- Self Check Agent
- FastAPI Backend

---

## Person C

- React Dashboard
- Approval Workflow
- Benchmark Visualization
- Business Presentation

---

# 🎯 Project Goals

- Reduce Holding Cost
- Improve Inventory Availability
- Optimize Regional Transfers
- Minimize Manual Planning
- Provide Explainable AI Recommendations
- Enable Human-in-the-Loop Decision Making

---

# 📌 Notes

- Prompt templates are stored separately from Python code.
- Business validation is deterministic and implemented using Python.
- AI is used only for planning and recommendation generation.
- Cost calculations and validation rules are fully deterministic.
- Configuration and secrets are managed through environment variables.

---

# 📄 License

This project was developed for educational and hackathon purposes.