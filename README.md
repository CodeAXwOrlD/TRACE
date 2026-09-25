# TRACE — AI-Powered Agentic Fraud Investigation Platform

[![TigerGraph](https://img.shields.io/badge/Powered%20By-TigerGraph%204.x-orange.svg)](https://www.tigergraph.com/)
[![LangGraph](https://img.shields.io/badge/Agent-LangGraph-blue.svg)](https://github.com/langchain-ai/langgraph)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)

> **TRACE** is an end-to-end, autonomous fraud investigation system developed for the **TigerGraph Agentic Fraud Investigation Hackathon (HHGOA)**. It couples deep knowledge graph analysis (TigerGraph + GSQL + MCP) with a stateful LangGraph agent to autonomously investigate suspicious transactions, synthesize evidence, resolve ambiguity, and recommend defensible Next-Best Actions (NBA).

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Architecture Overview](#-architecture-overview)
3. [Project Structure](#-project-structure)
4. [Prerequisites](#-prerequisites)
5. [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
   - [1. Clone Repository](#1-clone-repository)
   - [2. Environment Configuration](#2-environment-configuration)
   - [3. Backend & Agent Setup (FastAPI + LangGraph)](#3-backend--agent-setup-fastapi--langgraph)
   - [4. Frontend Setup (Next.js Console)](#4-frontend-setup-nextjs-console)
6. [TigerGraph Savanna & MCP Configuration](#-tigergraph-savanna--mcp-configuration)
7. [Running the Application](#-running-the-application)
8. [Benchmarking & Dataset](#-benchmarking--dataset)
9. [API & Stream Contracts](#-api--stream-contracts)
10. [Testing & Verification](#-testing--verification)

---

## ⚡ Key Features

- **Agentic Investigation Workflow:** 12-stage LangGraph pipeline that extracts deterministic evidence, assesses risk, computes uncertainty, and selects rule-based policy actions.
- **TigerGraph Deep Graph Traversal:** Analyzes multi-hop entity connections (shared devices, linked cards, IP clusters, and fraud syndicates).
- **TigerGraph integration:** Direct `pyTigerGraph`/REST access is used for graph reads and verified case writeback. The repository does not invoke an MCP transport at runtime; do not describe a deployment as MCP-powered until one is configured and exercised.
- **GraphRAG & Historical Case Memory:** Fast indexed retrieval across 5,500+ resolved fraud cases from `closed_cases_history.csv` to inform current recommendations.
- **Uncertainty & Next-Best Action (NBA):** Distinguishes between `FRAUD`, `LEGITIMATE`, and `UNCERTAIN` cases, requesting additional evidence (e.g., Step-Up Auth, 3DS, Analyst Review) before recommending terminal actions.
- **Real-time SSE Investigation Stream:** Live telemetry and node-by-node investigation progression streamed straight to the UI.
- **Analyst Investigation Workbench:** Interactive graph visualization (Sigma.js/Graphology), risk scoring, and evidence audit trails.

---

## 🏛 Architecture Overview

```
                          ┌────────────────────────────────┐
                          │   Next.js 14 Web Console       │
                          │ (Analyst Workbench, Graph UI)  │
                          └──────────────┬─────────────────┘
                                         │ REST & SSE Stream
                                         ▼
                          ┌────────────────────────────────┐
                          │     FastAPI Backend (app/)     │
                          │   Routes, Telemetry & Ingestion│
                          └──────────────┬─────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │ LangGraph Agent Engine    │                   │ TigerGraph REST / pyTigerGraph│
   │ (Deterministic Evidence,  │◄─────────────────►│  (GSQL Queries, Neighbors,│
   │  Policy, History Memory)  │   MCP Protocol    │   Graph Topology)         │
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │ Historical Case Memory    │                   │ TigerGraph Cloud (Savanna)│
   │ (5,565+ Resolved Cases)   │                   │ (Cards, Users, Devices)   │
   └───────────────────────────┘                   └───────────────────────────┘
```

---

## 📁 Project Structure

```
.
├── agent/                       # LangGraph AI Investigation Engine
│   ├── agent/
│   │   ├── graph.py             # 12-node compiled LangGraph pipeline
│   │   ├── runner.py            # Async SSE streamer & execution runner
│   │   ├── evidence.py          # Deterministic evidence detector
│   │   ├── historical_memory.py # 5,500+ historical closed case memory
│   │   ├── tigergraph_mcp.py    # TigerGraph MCP & pyTigerGraph bridge
│   │   └── policy.py            # R1-R9 Fraud policies
│   └── tests/                   # Agent test suite
│
├── backend/                     # FastAPI Application Layer
│   ├── app/
│   │   ├── api/                 # /cases, /investigate/stream, /graph
│   │   ├── graph/client.py      # TigerGraph connection client
│   │   └── data/dataset_loader.py # Real benchmark dataset loader
│   └── requirements.txt         # Backend Python dependencies
│
├── frontend/                    # Next.js 14 Frontend Application
│   ├── app/                     # Next App router (Console, Dashboard, Cases)
│   ├── components/
│   │   ├── graph/               # Graph visualization (Sigma / Graphology)
│   │   └── workbench/           # Investigation stream & risk components
│   └── lib/api.ts               # Production live FastAPI client
│
├── cases/                       # 20 Hackathon Benchmark Answer Files (Direct Evaluation)
│   ├── HHG-001.json ... HHG-020.json
│
├── scripts/                     # Automation & Evaluation Scripts
│   └── generate_cases.py        # Generates all 20 benchmark answer files
│
├── data/
│   └── raw/                     # IEEE-CIS Fraud Benchmark Dataset
│       ├── transactions_graph.csv # Graph-linked transaction edges
│       ├── identity_graph.csv   # Device & connection fingerprints
│       ├── closed_cases_history.csv # 5,565 historical closed cases
│       └── case_pack.csv        # 20 benchmark evaluation cases
```

---

## 🛠 Prerequisites

Ensure you have the following installed on your host system:

- **Python 3.10+** (Tested on Python 3.10 - 3.12)
- **Node.js 18+** or **Node.js 20 LTS** & `npm`
- **TigerGraph Account:** Free cluster on [TigerGraph Savanna](https://savanna.tgcloud.io/) or local TigerGraph instance.

---

## 🚀 Step-by-Step Setup Guide

### 1. Clone Repository
```bash
git clone <your-repo-url> TRACE
cd TRACE
```

### 2. Environment Configuration

#### Backend & Agent Environment:
Create a `.env` file in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env` with your settings:
```env
# TigerGraph Savanna Cloud Credentials
# Note: Ensure the host includes the `.i.tgcloud.io` domain
TG_HOST=https://your-instance.i.tgcloud.io
TG_GRAPHNAME=FraudCaseGraph
TG_SECRET=your_tigergraph_secret_here
TG_TOKEN=

# AI Reasoning Providers (Optional / Fallback)
BACKEND_MOCK_MODE=false       # Set 'false' for live TigerGraph cloud connectivity
AI_MOCK_MODE=false
AI_PROVIDER=groq              # Options: 'groq', 'gemini', 'mock'
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
GEMINI_API_KEY=your_gemini_api_key_here
```

#### Frontend Environment:
Create `.env.local` inside `frontend/`:
```bash
cd frontend
cp .env.example .env.local
```
Ensure it points to the FastAPI server:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=false
```
Return to root:
```bash
cd ..
```

---

### 3. Backend & Agent Setup (FastAPI + LangGraph)

Install Python dependencies for both backend and agent packages:

```bash
# 1. Install tigergraph-mcp and core dependencies
pip install pyTigerGraph uvicorn fastapi python-dotenv polars mcp

# 2. Install backend requirements
pip install -r backend/requirements.txt

# 3. Install agent dependencies & editable agent package
pip install -r agent/requirements.txt
pip install -e agent
```

---

### 4. Frontend Setup (Next.js Console)

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## 🐯 TigerGraph Savanna Configuration

### Option A: Managed Cloud (Recommended)
1. Go to [savanna.tgcloud.io](https://savanna.tgcloud.io/) and create or log in to your account.
2. Ensure your cluster is active and copy the URL (format: `https://<cluster-id>.i.tgcloud.io`).
3. Set Graph Name to `FraudCaseGraph` (or your chosen graph name).
4. Generate a secret/token from Admin Portal or GraphStudio.
5. Set `TG_HOST`, `TG_GRAPHNAME`, and `TG_SECRET` in `backend/.env`.
6. Verify connection via the health endpoint: `GET http://localhost:8000/api/health` returns `tigergraph: "connected"` and `graph_connection_state: "CONNECTED"`.

### Optional MCP Server
An MCP server bridge is provided in `agent/agent/tigergraph_mcp.py` for standard protocol tools:
```bash
tigergraph-mcp --transport stdio
# OR Streamable HTTP for multi-user:
tigergraph-mcp --transport streamable-http --host 127.0.0.1 --port 8001
```

---

## 🏃 Running the Application

### 1. Launch FastAPI Backend
From the project root:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Docs available at:* [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Launch Next.js Frontend Console
In a new terminal:
```bash
cd frontend
npm run dev
```
*Web Console available at:* [http://localhost:3000](http://localhost:3000)

---

## 📊 20 Hackathon Benchmark Evaluation Cases

As required by the Hacker House Goa evaluation criteria, all **20 benchmark answer files** are pre-computed, validated, and placed directly at the repository root in the `cases/` directory:

```
cases/
├── HHG-001.json
├── HHG-002.json
├── ...
└── HHG-020.json
```

Each answer file adheres strictly to the competition evaluation contract:
- **`case_id`**, **`transaction_id`**, **`card_id`**, **`customer_id`**
- **`verdict`**: `FRAUD` | `LEGITIMATE` | `UNCERTAIN`
- **`fraud_probability`** (0.0 to 1.0) & **`uncertainty`** (`LOW` | `MEDIUM` | `HIGH`)
- **`pattern`**: Fraud typology (`cnp`, `card_testing`, `account_takeover`, etc.)
- **`first_suspicious_txn_id`** & **`episode_txn_ids`**
- **`exposure_usd`**: Cumulative exposure amount
- **`similar_cases`**: Top historical precedent matches retrieved from the 5,565 closed case repository
- **`evidence`**: Graph traversal & anomaly evidence with signal weights and directions
- **`policy`**: Rule matched under bank fraud policy (`R1` through `R9`)
- **`next_actions`**: Prescribed remediation actions (e.g. `REQUEST_STEP_UP_AUTH`, `FREEZE_CARD`, `SAR_FILING`)
- **`rationale`**: Comprehensive audit-defensible reasoning narrative

> **Note on Dataset Packaging:** To keep the submission package lightweight (~19MB) for judging, the uncompressed 676MB raw Kaggle transaction dump (`transactions.csv`) is omitted. All graph-indexed files (`case_pack.csv`, `identity_graph.csv`, `transactions_graph.csv`, and `closed_cases_history.csv`) are bundled, enabling full offline dataset loading, historical memory retrieval across 5,565 closed cases, and complete autonomous re-evaluation.

### Reproducing / Re-evaluating All 20 Cases

To autonomously execute the entire agent pipeline across all 20 cases:

```bash
python3 scripts/generate_cases.py
```

Or run an individual case via Python API:

```python
from backend.app.data.dataset_loader import build_initial_state_for_case
from agent.runner import InvestigationRunner

# Load Case HHG-002 from benchmark dataset
state = build_initial_state_for_case("HHG-002")

# Execute autonomous LangGraph investigation
runner = InvestigationRunner()
result = runner.run(state)

print(f"Verdict: {result.verdict}")
print(f"Pattern: {result.pattern}")
print(f"Policy: {result.policy}")
print(f"Next Actions: {result.next_actions}")
print(f"Audit Rationale: {result.rationale}")
```

---

## 📡 API & Stream Contracts

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check & TigerGraph connection status |
| `/api/cases` | `GET` | Retrieve active fraud investigation cases |
| `/api/cases/{case_id}` | `GET` | Retrieve specific case record & findings |
| `/api/cases/{case_id}/evidence` | `GET` | Get structured evidence findings for a case |
| `/api/graph/{case_id}` | `GET` | Cytoscape/Sigma graph nodes & edges |
| `/api/investigate/stream` | `GET` | Real-time Server-Sent Events (SSE) investigation stream |

---

## 🧪 Testing & Verification

Run the comprehensive unit and integration test suite:

```bash
# Agent tests (26 unit/integration tests)
python3 -m unittest discover -s agent/tests -p "test_*.py" -v

# Backend endpoint test
python3 backend/test_api.py

# Frontend typechecking & tests
cd frontend
npm run typecheck
npm run test
```

---

## 👥 Contributors & Team
Developed for the **TigerGraph Agentic Fraud Investigation Hackathon (HHGOA)**.
