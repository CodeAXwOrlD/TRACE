# TRACE — MEMBER 2 AI / AGENT ENGINEERING HANDOFF DOCUMENT

**Role:** AI / Agent Engineer  
**Status:** COMPLETE  
**Location of Agent Package:** `agent/` (Dedicated, self-contained module)  
**Primary Integration Partner:** Member 3 (Backend / Data Engineer)

---

## 1. Overview & Verification Summary
Member 2 has delivered the complete, production-grade intelligence layer for **TRACE**. All acceptance criteria specified in `MEMBER2_AI_AGENT_ENGINEERING_HANDOFF.md` are satisfied.

- **Test Suite Status:** 26 automated unit and integration tests passing (`Ran 26 tests in 0.011s, OK`).
- **Offline / Mock Mode:** 100% functional without external LLM API access (`AI_MOCK_MODE=true` default).
- **Frontend Compatibility:** Exactly matches `frontend/lib/contracts.ts` (0 frontend changes required).

---

## 2. Implemented LangGraph Workflow Nodes
The investigation state machine is implemented via LangGraph's `StateGraph` in `agent/agent/graph.py`:

```
START
  │
  ├── 1. LOAD_INVESTIGATION          [Initializes case context, emits 'investigation_started']
  ├── 2. COLLECT_EVIDENCE            [Runs deterministic detectors: velocity, risk_score, 3DS, micro-tests]
  ├── 3. ANALYZE_TRANSACTION_HISTORY [Detects first_suspicious_txn_id, builds episode_txn_ids, sums exposure_usd]
  ├── 4. ANALYZE_GRAPH_CONNECTIONS   [Evaluates shared devices across payment cards, emits graph events]
  ├── 5. ANALYZE_PATTERNS            [Classifies fraud typology: card_testing, cnp, out_of_region, account_takeover, none]
  ├── 6. SEARCH_HISTORICAL_CASES     [Structured similarity match against historical memory bank]
  ├── 7. ESTIMATE_FRAUD_PROBABILITY  [Bayesian evidence weighting separating risk_score from probability]
  ├── 8. ESTIMATE_UNCERTAINTY        [Assesses evidence concordance/sparsity: LOW, MEDIUM, HIGH, 3-outcome verdict]
  ├── 9. APPLY_POLICY                [Evaluates standardized deterministic rules R1-R9]
  ├── 10. GENERATE_NEXT_ACTIONS      [Dispatches actionable analyst next steps: BLOCK_CARD, ESCALATE_CASE, etc.]
  ├── 11. GENERATE_RATIONALE         [Synthesizes defensible audit narrative via LLM with deterministic fallback]
  ├── 12. FINALIZE_INVESTIGATION     [Packages final state, sets status COMPLETED, emits 'investigation_complete']
  │
  ▼
END
```

---

## 3. State Schema & Wire Contracts

### Investigation State (`agent/agent/state.py`)
```python
class InvestigationState(TypedDict):
    case_id: str
    transaction_id: str
    card_id: str
    transaction: Dict[str, Any]
    customer: Dict[str, Any]
    transaction_history: List[Dict[str, Any]]
    connected_cards: List[str]
    connected_devices: List[str]
    evidence: List[EvidenceItem]
    first_suspicious_txn_id: Optional[str]
    episode_txn_ids: List[str]
    exposure_usd: float
    pattern: FraudPatternContract
    similar_cases: List[SimilarCaseContract]
    fraud_probability: float
    uncertainty: UncertaintyContract
    verdict: VerdictContract
    policy: str
    next_actions: List[str]
    rationale: str
    status: str
    events: List[InvestigationEvent]
```

### Final Wire Contract (`InvestigationContract`)
Matches `frontend/lib/contracts.ts` field-for-field:
```json
{
  "case_id": "CASE-9102",
  "transaction_id": "txn_root_77",
  "card_id": "card_gold_55",
  "verdict": "FRAUD",
  "fraud_probability": 0.91,
  "uncertainty": "LOW",
  "pattern": "cnp_new_device",
  "first_suspicious_txn_id": "txn_prior_1",
  "episode_txn_ids": ["txn_prior_1", "txn_prior_2", "txn_root_77"],
  "connected_card_ids": ["card_gold_55", "card_other_22", "card_other_33"],
  "similar_cases": [
    {
      "case_id": "CASE-7012",
      "similarity": 0.88,
      "outcome": "confirmed_fraud",
      "reason": "Identical fraud typology (cnp_new_device); Matching multi-card device linkage"
    }
  ],
  "evidence": [
    {
      "step": "device_link",
      "finding": "Device shared across 3 distinct payment cards",
      "direction": "concern",
      "weight": 0.94
    }
  ],
  "policy": "R6",
  "next_actions": ["BLOCK_CARD", "ESCALATE_CASE", "MONITOR_CONNECTED_CARDS"],
  "exposure_usd": 953.50,
  "rationale": "Investigation confirms fraud classification based on: Device shared across 3 distinct payment cards..."
}
```

---

## 4. SSE Real-Time Event Stream

Each event matches the frontend streaming specification (`frontend/hooks/useInvestigationStream.ts`):

```
event: <event_type>
data: {"type": "<event_type>", "data": {...}, "timestamp": "2026-09-23T08:00:00Z"}
```

### Emitted Event Progression:
1. `investigation_started` (`case_id`, `transaction_id`, `card_id`)
2. `evidence_found` (repeated as each finding is uncovered)
3. `graph_analysis_started` (`card_id`)
4. `graph_analysis_complete` (`connected_cards_count`, `connected_devices_count`)
5. `pattern_detected` (`pattern`)
6. `historical_cases_found` (`count`, `cases`)
7. `probability_updated` (`fraud_probability`)
8. `uncertainty_updated` (`uncertainty`, `verdict`)
9. `policy_selected` (`policy`)
10. `action_generated` (`next_actions`)
11. `investigation_complete` (final summary metrics)

---

## 5. Multi-Provider LLM Abstraction

Located in `agent/agent/llm/`:
- **`MockLLMProvider`** (`agent/llm/mock.py`): Deterministic mock provider. Requires no API keys. Returns high-quality analytical findings and structured rationales.
- **`GeminiProvider`** (`agent/llm/gemini.py`): Google Gemini REST client with JSON schema validation and 1 automatic retry on format error.
- **`GroqProvider`** (`agent/llm/groq.py`): Groq Cloud client (Llama 3.3 70B) with JSON object mode and 1 automatic retry.
- **`LLMFactory`** (`agent/llm/factory.py`): Config-driven instantiation.

### Fallback Guarantee:
Even if live external LLM APIs fail or timeout, `ExplanationGenerator` gracefully falls back to deterministic, fact-grounded narratives without crashing the investigation.

---

## 6. Environment Variables

Configure via environment or `.env` in root or `agent/`:

```bash
# Set to 'true' for offline mock execution (recommended for hackathon demos)
AI_MOCK_MODE=true

# Provider selection when AI_MOCK_MODE=false: 'gemini' | 'groq' | 'mock'
AI_PROVIDER=mock

# Gemini configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Groq configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## 7. Integration Instructions for Member 3 (FastAPI Layer)

Member 3 can integrate the agent directly into FastAPI services in under 10 lines of code:

### Step A: Add agent directory to Python path / install package
```bash
cd agent && pip install -e .
```

### Step B: Synchronous Investigation Endpoint (`POST /api/investigate`)
```python
from fastapi import APIRouter, HTTPException
from agent.runner import InvestigationRunner

router = APIRouter()
runner = InvestigationRunner()

@router.post("/api/investigate")
def investigate(payload: dict):
    # Member 3 queries Polars / TigerGraph to gather raw facts:
    initial_state = {
        "transaction_id": payload["transaction_id"],
        "card_id": payload.get("card_id", "card_123"),
        "transaction": payload.get("transaction", {}),
        "customer": payload.get("customer", {}),
        "transaction_history": payload.get("history", []),
        "connected_cards": payload.get("connected_cards", []),
        "connected_devices": payload.get("connected_devices", []),
    }
    contract = runner.run(initial_state)
    return contract.model_dump()
```

### Step C: Streaming SSE Endpoint (`GET /api/investigate/stream`)
```python
from fastapi.responses import StreamingResponse

@router.get("/api/investigate/stream")
async def investigate_stream(transaction_id: str):
    # Member 3 gathers facts for transaction_id:
    initial_state = {
        "transaction_id": transaction_id,
        # ... populated facts ...
    }
    return StreamingResponse(
        runner.stream_events(initial_state, artificial_delay=0.15),
        media_type="text/event-stream"
    )
```

---

## 8. Verification & Running Tests

To verify the agent suite anytime:
```bash
cd agent
python3 -m unittest discover -s tests -p "test_*.py" -v
```

All 26 tests will run and pass deterministically in under 0.05 seconds.
