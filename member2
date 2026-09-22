# TRACE — MEMBER 2 AI / AGENT ENGINEERING HANDOFF

Role:
AI / Agent Engineer

Primary Ownership:
LangGraph + LLM + investigation reasoning + evidence interpretation + policy reasoning

Project:
TRACE — AI-assisted financial fraud investigation and case intelligence platform

============================================================
0. YOUR ROLE
============================================================

You are responsible for the intelligence layer of TRACE.

You are NOT responsible for:

- frontend UI
- Sigma.js implementation
- visual design
- raw dataset ingestion
- TigerGraph infrastructure
- frontend routing

You ARE responsible for:

- investigation agent
- LangGraph workflow
- evidence reasoning
- pattern interpretation
- historical case reasoning
- uncertainty
- policy reasoning
- final investigation output
- real-time agent events
- deterministic structured output

Your implementation must integrate with the existing frontend without requiring a frontend rewrite.

============================================================
1. CORE PRINCIPLE
============================================================

TRACE must NOT behave like:

"LLM sees transaction → LLM guesses fraud"

Instead:

DATA
 ↓
GRAPH / DETECTORS
 ↓
STRUCTURED EVIDENCE
 ↓
PATTERN ANALYSIS
 ↓
HISTORICAL CASES
 ↓
FRAUD PROBABILITY
 ↓
UNCERTAINTY
 ↓
POLICY
 ↓
NEXT ACTION
 ↓
EXPLANATION

The LLM is an interpretation/reasoning layer.

It is NOT the source of truth for raw transaction facts.

============================================================
2. TARGET ARCHITECTURE
============================================================

FastAPI
   |
   v
Investigation Service
   |
   v
LangGraph
   |
   +---- Evidence Collector
   |
   +---- Pattern Analysis
   |
   +---- Historical Case Analysis
   |
   +---- Risk / Probability Reasoning
   |
   +---- Uncertainty
   |
   +---- Policy Reasoning
   |
   +---- Explanation
   |
   v
Structured Investigation Result

============================================================
3. LANGGRAPH WORKFLOW
============================================================

Implement a state graph approximately like:

START
  |
  v
LOAD INVESTIGATION
  |
  v
COLLECT EVIDENCE
  |
  v
ANALYZE TRANSACTION HISTORY
  |
  v
ANALYZE GRAPH CONNECTIONS
  |
  v
ANALYZE PATTERNS
  |
  v
SEARCH HISTORICAL CASES
  |
  v
ESTIMATE FRAUD PROBABILITY
  |
  v
ESTIMATE UNCERTAINTY
  |
  v
APPLY POLICY
  |
  v
GENERATE NEXT ACTIONS
  |
  v
GENERATE RATIONALE
  |
  v
FINALIZE INVESTIGATION
  |
  v
END

============================================================
4. STATE MODEL
============================================================

Create a strongly typed investigation state.

Example conceptual state:

{
  case_id,
  transaction_id,
  card_id,

  transaction,
  customer,
  evidence,

  transaction_history,
  connected_cards,
  connected_devices,
  episode_transactions,

  patterns,
  similar_cases,

  fraud_probability,
  uncertainty,

  policy,
  next_actions,

  exposure_usd,

  rationale,

  status
}

Do not use unstructured dictionaries everywhere.

Use typed Pydantic models where appropriate.

============================================================
5. EVIDENCE MODEL
============================================================

Evidence must be structured.

Expected conceptual structure:

{
  "step": "device_link",
  "finding": "Device on 3 other cards",
  "direction": "concern",
  "weight": 0.08
}

Possible direction values:

- concern
- support
- neutral

Do not let the LLM invent arbitrary evidence.

Evidence must come from:

- dataset
- graph queries
- deterministic detectors
- historical case retrieval
- policy logic

The LLM may explain evidence.

It must not fabricate evidence.

============================================================
6. DETERMINISTIC VS LLM RESPONSIBILITIES
============================================================

DETERMINISTIC:

- transaction values
- transaction IDs
- card IDs
- customer IDs
- device relationships
- historical case IDs
- graph relationships
- counts
- timestamps
- exposure calculations
- rule/policy matching

LLM:

- explain evidence
- summarize patterns
- compare qualitative similarities
- generate human-readable rationale
- explain uncertainty
- structure analyst-facing reasoning

Never ask the LLM to calculate something that can be calculated deterministically.

============================================================
7. RISK SCORE RULE
============================================================

IMPORTANT:

risk_score is an input signal.

It is NOT automatically:

fraud_probability

Do not implement:

if risk_score > 0.6:
    fraud = true

Instead combine available evidence and signals according to the task specification.

The final output must contain:

fraud_probability

and:

uncertainty

separately.

============================================================
8. THREE-OUTCOME MODEL
============================================================

The system must support:

FRAUD
LEGITIMATE
UNCERTAIN

Do not force every investigation into:

FRAUD

If evidence is insufficient:

UNCERTAIN

must remain possible.

The agent should communicate uncertainty instead of inventing confidence.

============================================================
9. FIRST SUSPICIOUS TRANSACTION
============================================================

This is critical.

Do NOT assume:

trigger_transaction == first suspicious transaction

The investigation result must support:

first_suspicious_txn_id

and:

episode_txn_ids

The reasoning layer should explain why the earliest suspicious transaction was selected when enough evidence exists.

============================================================
10. HISTORICAL CASE REASONING
============================================================

Use closed historical cases as investigation memory.

The agent should retrieve relevant cases based on structured similarity.

Potential signals:

- transaction pattern
- device relationships
- card relationships
- behavioral pattern
- amount pattern
- sequence pattern

Do not simply retrieve random cases and ask the LLM to choose one.

Return structured:

similar_cases

with:

- case_id
- similarity/relevance
- short reason

============================================================
11. POLICY ENGINE
============================================================

Policy decisions must be explicit.

The agent should produce:

policy

and:

next_actions

Do not bury the action inside a prose response.

Expected conceptual output:

{
  "policy": "R6",
  "next_actions": [
    "BLOCK_CARD",
    "ESCALATE_CASE"
  ]
}

The exact policy rules must come from the project specification.

Do not invent new policy rules.

============================================================
12. FINAL OUTPUT CONTRACT
============================================================

The AI service must produce an object compatible with:

{
  "case_id": "...",
  "transaction_id": "...",
  "card_id": "...",

  "verdict": "FRAUD | LEGITIMATE | UNCERTAIN",

  "fraud_probability": 0.82,

  "uncertainty": "LOW | MEDIUM | HIGH",

  "pattern": "...",

  "first_suspicious_txn_id": "...",

  "episode_txn_ids": [],

  "connected_card_ids": [],

  "similar_cases": [],

  "evidence": [],

  "policy": "...",

  "next_actions": [],

  "exposure_usd": 0,

  "rationale": "..."
}

The frontend must be able to consume this without changing its architecture.

============================================================
13. SSE / REAL-TIME EVENTS
============================================================

The frontend already has an abstraction for investigation streaming.

Emit structured events.

Examples:

investigation_started

evidence_found

graph_analysis_started

graph_analysis_complete

pattern_detected

historical_cases_found

probability_updated

uncertainty_updated

policy_selected

action_generated

investigation_complete

Each event should be JSON serializable.

Conceptual:

{
  "type": "evidence_found",
  "data": {
    "step": "device_link",
    "finding": "Device on 3 other cards",
    "direction": "concern",
    "weight": 0.08
  }
}

Do not send huge payloads.

The frontend needs events, not internal Python objects.

============================================================
14. LLM PROVIDER
============================================================

Implement an abstraction:

LLMProvider

Do not tightly couple the agent to one provider.

Example:

llm/
    base.py
    gemini.py
    groq.py
    factory.py

Environment variables:

GEMINI_API_KEY=
GROQ_API_KEY=

Do not commit API keys.

The application should be able to switch provider through configuration.

============================================================
15. PROMPT ENGINEERING
============================================================

Prompts must be:

- explicit
- deterministic where possible
- structured
- short enough
- domain specific
- resistant to hallucination

Every reasoning prompt must clearly state:

1. Facts
2. Evidence
3. Unknowns
4. Required output
5. Allowed decisions

Never tell the LLM:

"Investigate this and decide whatever you think."

Instead provide a strict schema.

============================================================
16. OUTPUT VALIDATION
============================================================

Every LLM output must be validated.

Use Pydantic structured output.

If invalid:

- retry once with correction
- otherwise return a controlled failure

Never allow malformed LLM output to reach the frontend.

============================================================
17. ERROR HANDLING
============================================================

Handle:

- LLM timeout
- invalid LLM response
- missing evidence
- missing transaction
- graph unavailable
- historical cases unavailable
- policy mismatch

The investigation should fail gracefully.

Do not silently fabricate fallback evidence.

============================================================
18. TESTING
============================================================

Create tests for:

1. Investigation state
2. Evidence parsing
3. Probability output validation
4. Uncertainty output
5. Historical case matching
6. Policy output
7. Final investigation schema
8. Invalid LLM response
9. Missing data
10. SSE event generation

At least one complete deterministic investigation test must work WITHOUT an external LLM API.

This is extremely important for hackathon reliability.

============================================================
19. MOCK / DEMO MODE
============================================================

Support:

AI_MOCK_MODE=true

When enabled:

- do not call external LLM
- return deterministic investigation result
- emit realistic SSE events

This allows the frontend and demo to run even if the external LLM provider fails.

Do NOT mix mock mode with real mode silently.

============================================================
20. PERFORMANCE
============================================================

Do not send the entire dataset to the LLM.

Only send relevant structured evidence.

Bad:

entire transactions.csv → LLM

Good:

transaction
+
relevant history
+
graph findings
+
similar cases
+
detectors
→ LLM

============================================================
21. SECURITY
============================================================

Never log:

- API keys
- secrets
- full sensitive payloads unnecessarily

Use environment variables.

============================================================
22. FILE STRUCTURE
============================================================

Suggested:

apps/api/app/agents/

    graph.py

    state.py

    investigator.py

    evidence.py

    patterns.py

    historical.py

    policy.py

    explanation.py

    llm/
        base.py
        gemini.py
        groq.py
        factory.py

    prompts/
        investigator.txt
        evidence.txt
        pattern.txt
        explanation.txt

    schemas/
        investigation.py
        evidence.py
        events.py

============================================================
23. DO NOT MODIFY
============================================================

Do not rewrite:

apps/web/

unless absolutely required for a documented API integration fix.

Do not redesign frontend.

Do not introduce a second frontend framework.

Do not replace Sigma.js.

============================================================
24. ACCEPTANCE CRITERIA
============================================================

Member 2 is complete only when:

[ ] LangGraph workflow works

[ ] Investigation state is typed

[ ] Evidence is structured

[ ] Historical case reasoning works

[ ] Fraud probability is separated from risk score

[ ] Uncertainty exists

[ ] FRAUD / LEGITIMATE / UNCERTAIN supported

[ ] First suspicious transaction supported

[ ] Policy output structured

[ ] Next actions structured

[ ] SSE events work

[ ] Mock AI mode works

[ ] Real LLM provider can be configured

[ ] LLM outputs validated

[ ] Error handling exists

[ ] Tests pass

[ ] Frontend contract is documented

[ ] No frontend rewrite required

============================================================
25. HANDOFF
============================================================

Create:

docs/MEMBER2_HANDOFF.md

Document:

- implemented nodes
- state schema
- API expectations
- SSE events
- LLM provider
- environment variables
- mock mode
- tests
- known limitations
- integration instructions for Member 3

The result must be ready for Member 3's FastAPI/data layer.

============================================================
FINAL RULE
============================================================

Build the intelligence layer as an ENGINEERING SYSTEM.

Do not build a chatbot.

The judge should be able to understand:

"What evidence caused this conclusion?"

That is the core of TRACE.
