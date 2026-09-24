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
- **TigerGraph MCP Server Integration:** Compatible with official `tigergraph-mcp` for agent-tool graph interactions.
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
   │ LangGraph Agent Engine    │                   │   TigerGraph MCP Server   │
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
│   │   └── data/seed_data.py    # Seed cases and transactions
│   └── requirements.txt         # Backend Python dependencies
│
├── frontend/                    # Next.js 14 Frontend Application
│   ├── app/                     # Next App router (Console, Dashboard, Cases)
│   ├── components/
│   │   ├── graph/               # Graph visualization (Sigma / Graphology)
│   │   └── workbench/           # Investigation stream & risk components
│   └── lib/api.ts               # Resilient API client with mock fallback
│
├── data/
│   └── raw/                     # IEEE-CIS Fraud Benchmark Dataset
│       ├── transactions.csv     # ~590k raw card transactions
│       ├── identity.csv         # Device & connection fingerprints
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
TIGERGRAPH_HOST=https://your-subdomain.i.tgcloud.io
TIGERGRAPH_TOKEN=your-savanna-api-token
TIGERGRAPH_GRAPH=AntiFraudGraph
TIGERGRAPH_USERNAME=tigergraph
TIGERGRAPH_PASSWORD=your-cluster-password

# AI Reasoning Providers (Optional / Fallback)
BACKEND_MOCK_MODE=true        # Set 'false' when connecting to live TigerGraph
AI_MOCK_MODE=false
AI_PROVIDER=gemini            # Options: 'mock', 'gemini', 'groq'
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
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

## 🐯 TigerGraph Savanna & MCP Configuration

### Option A: Managed Cloud (Recommended)
1. Go to [savanna.tgcloud.io](https://savanna.tgcloud.io/) and create a free account.
2. Create a free tier cluster and enable **Auto-start/Auto-stop**.
3. Create a graph named `AntiFraudGraph`.
4. Generate a secret/token from Admin Portal or GraphStudio.
5. Provide the URL, Graph Name, and Secret in `backend/.env`.

### Running TigerGraph MCP Server
TRACE integrates with the official `tigergraph-mcp` standard:
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

## 📊 Benchmarking & Dataset

The project includes the 20 benchmark test cases defined for the hackathon in `data/raw/case_pack.csv`.

To execute an autonomous investigation run on a specific benchmark transaction or case:

```python
from agent.runner import InvestigationRunner

runner = InvestigationRunner()
result = runner.run({
    "case_id": "HHG-001",
    "transaction_id": "3514030",
    "card_id": "C12382-K1",
    "customer_id": "C12382",
    "transaction": {
        "amount": 250.00,
        "risk_score": 0.61,
        "is_new_device": True
    },
    "connected_cards": ["C12382-K1"]
})

print(f"Verdict: {result.verdict}")
print(f"Risk Score: {result.fraud_probability}")
print(f"Next-Best Action: {result.next_actions}")
print(f"Policy: {result.policy}")
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
