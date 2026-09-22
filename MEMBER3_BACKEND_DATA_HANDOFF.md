# TRACE — MEMBER 3 BACKEND + DATA ENGINEERING HANDOFF

Role:
Backend + Data + Graph Engineer

Primary Ownership:

- FastAPI
- dataset ingestion
- Polars
- TigerGraph
- graph schema
- graph queries
- REST APIs
- SSE transport
- health checks
- data validation

============================================================
0. YOUR ROLE
============================================================

You own the DATA and BACKEND foundation of TRACE.

You are NOT responsible for:

- frontend design
- landing page
- GSAP animations
- Sigma.js UI
- LLM prompt design

You ARE responsible for:

RAW DATA
 ↓
VALIDATION
 ↓
TRANSFORMATION
 ↓
GRAPH
 ↓
DETECTORS / QUERIES
 ↓
FASTAPI
 ↓
AI AGENT
 ↓
FRONTEND

============================================================
1. DATASET RULE
============================================================

The raw dataset must NOT be committed to Git.

Large files such as:

transactions.csv

must remain outside Git.

Expected local structure:

data/

    raw/

        transactions.csv
        identity.csv
        case_pack.csv
        closed_cases_history.csv

The exact available files and columns must be verified against the provided README/specification.

DO NOT invent columns.

If a derivation rule is not explicitly specified, document the assumption before implementing it.

============================================================
2. DATA PIPELINE
============================================================

Implement:

RAW CSV
   ↓
Polars
   ↓
Schema validation
   ↓
Cleaning
   ↓
Normalization
   ↓
Derived fields
   ↓
Graph records
   ↓
TigerGraph

Use Polars rather than Pandas for large CSV processing where practical.

Do not load the entire dataset into memory unnecessarily.

============================================================
3. DATA VALIDATION
============================================================

Before graph ingestion:

Validate:

- required columns
- data types
- nulls
- duplicate IDs
- malformed records
- unexpected values
- date/time fields

Create a validation report.

Example:

records:
1000000

valid:
999200

invalid:
800

duplicates:
120

missing_required:
34

Do not silently drop records.

Log why a record was rejected.

============================================================
4. DATASET COLUMN RULE
============================================================

The transactions dataset contains:

TransactionID

id_01
id_02
id_03
...
id_38

DeviceType

DeviceInfo

The exact semantic meaning of id_01 ... id_38 must come from the supplied dataset README/specification.

Do NOT assign meanings based on guessing.

If the README specifies derivation logic:

implement it exactly.

If a value is anonymized:

keep it anonymized.

============================================================
5. GRAPH MODEL
============================================================

Use TigerGraph as the relationship investigation engine.

Conceptual entity types:

Customer
Card
Transaction
Device
Case

Relationships should represent actual relationships supported by the dataset/specification.

Conceptual:

Customer
   |
   | owns
   v
Card
   |
   | made
   v
Transaction
   |
   | uses
   v
Device

Case
 |
 | contains
 v
Transaction

Do not create relationships that cannot be justified by available data.

============================================================
6. GRAPH DESIGN PRINCIPLE
============================================================

DO NOT render the complete graph in the frontend.

TigerGraph should answer:

"Which subgraph is relevant to this investigation?"

Frontend receives:

small investigation-specific subgraph.

Example:

Transaction
   |
   +-- Card
   |
   +-- Customer
   |
   +-- Device
   |
   +-- related Transactions
   |
   +-- related Cards
   |
   +-- Case

============================================================
7. GRAPH QUERIES
============================================================

Implement reusable graph queries for:

1. transaction investigation

2. customer history

3. card history

4. device connections

5. connected cards

6. transaction episode

7. historical case relationships

8. investigation subgraph

9. relevant evidence

10. exposure calculation where graph/data logic is required

Do not put graph query logic directly inside FastAPI route handlers.

Use:

graph/

    client.py
    queries.py
    mapper.py

============================================================
8. INVESTIGATION API
============================================================

Implement:

POST /api/investigate

Request:

{
    "transaction_id": "..."
}

Response should start or create an investigation and return the identifier needed by the frontend/stream.

The exact response shape must remain compatible with the frontend contract.

============================================================
9. INVESTIGATION STREAM
============================================================

Implement:

GET /api/investigate/stream?transaction_id=...

Use Server-Sent Events.

Events should represent actual investigation progress.

Example:

investigation_started

transaction_loaded

history_loaded

graph_analysis_started

graph_analysis_complete

evidence_found

pattern_detected

historical_cases_found

risk_calculated

policy_selected

investigation_complete

Do not fake successful events if a dependency failed.

============================================================
10. CASE API
============================================================

Implement:

GET /api/cases

GET /api/cases/{id}

POST /api/cases/{id}/evidence

POST /api/cases/{id}/close

The exact response structures must match the shared contract.

============================================================
11. GRAPH API
============================================================

Implement:

GET /api/graph/{case_id}

Response:

nodes
+
edges

Example:

{
  "nodes": [
    {
      "id": "...",
      "type": "transaction",
      "label": "..."
    }
  ],
  "edges": [
    {
      "source": "...",
      "target": "...",
      "type": "uses"
    }
  ]
}

Only return the relevant subgraph.

============================================================
12. HEALTH API
============================================================

Implement:

GET /api/health

Return health status for:

API
Graph
Dataset
Agent/LLM

Conceptual:

{
  "api": "ok",
  "graph": "ok",
  "dataset": "loaded",
  "agent": "ready"
}

Do not claim a dependency is healthy without checking it.

============================================================
13. BACKEND ARCHITECTURE
============================================================

Use:

FastAPI

Pydantic

Polars

TigerGraph client

Async where useful

Suggested structure:

apps/api/

    app/
        main.py

        api/
            health.py
            investigations.py
            cases.py
            graph.py

        schemas/
            investigation.py
            case.py
            graph.py
            events.py

        services/
            investigation_service.py
            evidence_service.py
            case_service.py

        graph/
            client.py
            queries.py
            mapper.py

        data/
            loader.py
            validator.py
            transformer.py

        config.py

============================================================
14. DO NOT PUT BUSINESS LOGIC IN ROUTES
============================================================

Bad:

@app.post("/api/investigate")
def investigate():
    # 300 lines of logic

Good:

route
 ↓
service
 ↓
graph/data/agent

Keep route handlers thin.

============================================================
15. DATA INGESTION COMMAND
============================================================

Create a reproducible command.

Example:

python -m scripts.validate_data

python -m scripts.ingest_data

or equivalent.

The ingestion process must be documented.

It should be safe to run again.

Avoid creating duplicate graph records.

============================================================
16. IDEMPOTENT INGESTION
============================================================

Running:

ingest_data

twice should NOT create duplicate entities.

Use deterministic IDs.

Example:

Transaction:
transaction:{TransactionID}

Card:
card:{card_id}

Device:
device:{device_id}

Customer:
customer:{customer_id}

Use the actual identifiers/derivations specified by the project.

============================================================
17. GRAPH QUERY OUTPUT
============================================================

The backend must return frontend-friendly data.

Do not expose raw TigerGraph internals.

Example:

TigerGraph result
        ↓
mapper
        ↓
API contract
        ↓
frontend

============================================================
18. EVIDENCE GENERATION
============================================================

Evidence should be derived from actual data/query results.

Examples:

device reused across cards

unusual transaction sequence

historical case similarity

connected card relationship

relevant transaction history

The backend should produce structured evidence.

Conceptual:

{
  "step": "device_link",
  "finding": "Device on 3 other cards",
  "direction": "concern",
  "weight": 0.08
}

Do not ask the LLM to invent these facts.

============================================================
19. FIRST SUSPICIOUS TRANSACTION
============================================================

The backend must support:

first_suspicious_txn_id

and:

episode_txn_ids

Do NOT automatically set:

first_suspicious_txn_id = trigger transaction

unless the actual data/evidence supports it.

============================================================
20. EXPOSURE
============================================================

Calculate exposure from actual transaction data according to the task specification.

Do not ask the LLM to calculate exposure.

Return:

exposure_usd

as structured data.

============================================================
21. CLOSED CASE MEMORY
============================================================

Historical cases should be queryable.

Expose:

similar_cases

with structured fields.

Do not send the entire historical dataset to the frontend.

============================================================
22. API CONTRACT
============================================================

The backend must support the frontend contract:

GET /api/health

GET /api/cases

GET /api/cases/{id}

POST /api/investigate

GET /api/investigate/stream?transaction_id=

POST /api/cases/{id}/evidence

GET /api/graph/{case_id}

POST /api/cases/{id}/close

If the API contract changes:

UPDATE:

docs/API_CONTRACT.md

and notify Member 1 and Member 2.

Do not silently change endpoints.

============================================================
23. CORS
============================================================

Configure CORS for local development.

Example:

Frontend:
http://localhost:3000

Backend:
http://localhost:8000

Do not use:

allow_origins=["*"]

in production configuration unless explicitly required.

============================================================
24. ERROR CONTRACT
============================================================

Return structured errors.

Example:

{
  "error": {
    "code": "TRANSACTION_NOT_FOUND",
    "message": "Transaction does not exist"
  }
}

Possible errors:

TRANSACTION_NOT_FOUND

CASE_NOT_FOUND

GRAPH_UNAVAILABLE

DATASET_NOT_READY

INVESTIGATION_FAILED

INVALID_REQUEST

LLM_UNAVAILABLE

============================================================
25. MOCK MODE
============================================================

Support backend mock mode if useful.

Example:

BACKEND_MOCK_MODE=true

This should allow:

API
+
SSE

to run without TigerGraph.

However:

mock mode must be explicit.

Do not silently fallback to fake data in production/live mode.

============================================================
26. TESTING
============================================================

Test:

1. health endpoint
2. case retrieval
3. transaction lookup
4. investigation creation
5. graph endpoint
6. SSE stream
7. evidence endpoint
8. close case
9. missing transaction
10. TigerGraph failure
11. dataset validation
12. ingestion idempotency

At least one full investigation flow should work in mock mode.

============================================================
27. PERFORMANCE
============================================================

Do not:

- load entire dataset into API memory
- return entire graph
- send huge CSV content to LLM
- perform expensive graph traversals without limits
- block FastAPI event loop unnecessarily

Investigation queries should return bounded subgraphs.

============================================================
28. LOGGING
============================================================

Log:

request ID
investigation ID
transaction ID
query duration
graph query duration
agent duration
errors

Do NOT log secrets.

============================================================
29. ENVIRONMENT VARIABLES
============================================================

Create:

.env.example

Conceptually:

TIGERGRAPH_HOST=

TIGERGRAPH_TOKEN=

TIGERGRAPH_GRAPH=

GEMINI_API_KEY=

GROQ_API_KEY=

BACKEND_MOCK_MODE=false

Do not commit .env.

============================================================
30. DOCKER
============================================================

Do not unnecessarily containerize everything.

The development architecture can be:

Next.js
   ↓
local FastAPI
   ↓
TigerGraph cloud/service
   ↓
LLM provider

Use Docker only where it simplifies reproducibility.

============================================================
31. DOCUMENTATION
============================================================

Create:

docs/API_CONTRACT.md

docs/DATA_PIPELINE.md

docs/GRAPH_SCHEMA.md

docs/MEMBER3_HANDOFF.md

These must explain:

- dataset
- validation
- transformations
- graph schema
- graph queries
- API endpoints
- SSE
- environment variables
- running locally
- troubleshooting

============================================================
32. DO NOT MODIFY
============================================================

Do not redesign:

apps/web/

Do not rewrite:

frontend components

unless an API contract integration requires a very small change.

If frontend changes are necessary:

document them.

============================================================
33. ACCEPTANCE CRITERIA
============================================================

Member 3 is complete when:

[ ] Dataset validation works

[ ] Data transformation works

[ ] TigerGraph schema exists

[ ] Data ingestion works

[ ] Ingestion is idempotent

[ ] Graph queries work

[ ] Investigation API works

[ ] Graph API works

[ ] Case APIs work

[ ] SSE works

[ ] Health endpoint works

[ ] Errors are structured

[ ] Mock mode works

[ ] Real data path works

[ ] Tests pass

[ ] API contract documented

[ ] No secrets committed

[ ] Large dataset excluded from Git

============================================================
34. FINAL END-TO-END TEST
============================================================

The following flow MUST work:

Transaction ID
      ↓
POST /api/investigate
      ↓
Investigation created
      ↓
SSE starts
      ↓
Load transaction
      ↓
Query graph
      ↓
Find relevant evidence
      ↓
Find historical cases
      ↓
AI reasoning
      ↓
Fraud probability
      ↓
Uncertainty
      ↓
Policy
      ↓
Next action
      ↓
Final investigation result
      ↓
Frontend displays it

============================================================
FINAL RULE
============================================================

The backend must provide FACTS.

The graph must provide RELATIONSHIPS.

The agent must provide REASONING.

The frontend must provide VISUALIZATION.

Never mix these responsibilities.
