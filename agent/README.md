# TRACE Agent — AI / Intelligence Investigation Layer

This package contains the complete AI intelligence and automated investigation layer for **TRACE** (AI-assisted financial fraud investigation and case intelligence platform).

## Core Principles
1. **Deterministic-First**: Raw transactions, graph connections, entity clusters, first suspicious transaction detection, episode chaining, financial exposure ($ USD), and policy rules are computed **deterministically**.
2. **LLM as Interpretation**: The LLM is used strictly for interpreting qualitative evidence, synthesizing defensible audit rationales, and explaining uncertainty. It **never** invents or fabricates transaction facts.
3. **Three-Outcome Model**: Supports `FRAUD`, `LEGITIMATE`, and `UNCERTAIN`. When evidence is sparse or conflicting, the system explicitly reports high uncertainty rather than hallucinating confidence.
4. **Zero-Frontend Rewrite**: Fully compliant with `frontend/lib/contracts.ts` and `frontend/hooks/useInvestigationStream.ts`.

---

## Directory Structure

```
agent/
├── pyproject.toml
├── requirements.txt
├── README.md
├── agent/
│   ├── config.py              # Settings, env vars, thresholds
│   ├── state.py               # Strongly-typed LangGraph state
│   ├── graph.py               # Compiled 12-node LangGraph StateGraph
│   ├── runner.py              # High-level runner (sync .run() & async .stream_events())
│   ├── evidence.py            # Deterministic evidence detector
│   ├── history.py             # Episode & first suspicious txn analyzer
│   ├── graph_analysis.py      # Device & card cluster analyzer
│   ├── patterns.py            # Fraud pattern classifier
│   ├── historical.py          # Historical closed case similarity matcher
│   ├── scoring.py             # Bayesian probability & uncertainty engine
│   ├── policy.py              # Standardized policy engine (R1-R9)
│   ├── explanation.py         # Rationale generator with LLM & fallback
│   ├── schemas/               # Typed schemas for contracts, evidence, events
│   ├── llm/                   # Multi-provider abstraction (Mock, Gemini, Groq)
│   └── prompts/               # Structured prompt templates
└── tests/                     # 26 automated unit & integration tests
```

---

## Quickstart

### Run Automated Tests
```bash
python3 -m unittest discover -s tests -p "test_*.py" -v
```

### Python API Usage

```python
from agent.runner import InvestigationRunner

runner = InvestigationRunner()

# 1. Synchronous REST execution:
result = runner.run({
    "case_id": "case_101",
    "transaction_id": "txn_root_77",
    "card_id": "card_gold_55",
    "transaction": {
        "amount": 950.00,
        "risk_score": 0.82,
        "is_new_device": True,
    },
    "connected_cards": ["card_gold_55", "card_other_22"],
})
print(result.verdict)            # 'FRAUD'
print(result.fraud_probability)  # 0.91
print(result.policy)             # 'R6'
print(result.next_actions)       # ['BLOCK_CARD', 'ESCALATE_CASE', 'MONITOR_CONNECTED_CARDS']

# 2. SSE Streaming for FastAPI /api/investigate/stream:
# async for sse_chunk in runner.stream_events(initial_state):
#     yield sse_chunk
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AI_MOCK_MODE` | `true` | When true, runs 100% offline with deterministic mock reasoning |
| `AI_PROVIDER` | `mock` | `mock`, `gemini`, or `groq` |
| `GEMINI_API_KEY` | `""` | Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model name |
| `GROQ_API_KEY` | `""` | Groq Cloud API Key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
