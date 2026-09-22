# TRACE — frontend (Member 1 scope)

AI-assisted fraud investigation console. This package is the complete
frontend: UI, graph visualization, motion, mock data, and an API/SSE
abstraction layer ready for Member 2 (agent/LangGraph) and Member 3
(FastAPI/TigerGraph) to plug into without touching this codebase's shape.

Full product context lives in `../docs/` (read `Memory.md`, `Rules.md`,
`Phases.md` in that order) and `../reference/` (the two approved HTML design
previews this build is ported from).

## Installation

```bash
cd frontend
npm install
cp .env.example .env.local
```

## Development

```bash
npm run dev       # http://localhost:3000
npm run typecheck # tsc --noEmit
npm run lint
npm run test       # vitest run
npm run build
```

> **Note on this delivery:** it was assembled in a sandboxed environment with
> no network access, so `npm install` / `next build` / `tsc` / `vitest` have
> **not** been run here. Please run the commands above locally as your first
> step — they're the actual verification, not this note.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend (Architecture.md §9). Frontend runs fully on mocks if unset. |
| `NEXT_PUBLIC_USE_MOCKS` | Set `"true"` to force mock data even with a reachable backend (demo days). |

## Mock mode

Every function in `lib/api.ts` tries the real endpoint first, then falls back
to deterministic fixtures in `mock/`. There is nothing to configure to run
standalone — it's the default. Flip `NEXT_PUBLIC_USE_MOCKS=false` (with a
reachable `NEXT_PUBLIC_API_URL`) once the backend exists.

## Folder structure

```
app/
  page.tsx                    # landing (intro + cinematic hero)
  (console)/                  # route group sharing ConsoleShell (top nav, ⌘K)
    dashboard/
    investigations/  investigations/[id]/   # workspace — the most important UI
    cases/            cases/[id]/
    transactions/[id]/
    customers/[id]/
    devices/[id]/
    settings/
components/
  neon/        # Neon engine (ported from reference/trace-cinematic-v2.html) + React wrapper
  intro/       # IntroSequence
  landing/     # Hero, ScoreSection, HowSection, Outcomes, Patterns, FinalCTA, Nav
  console/     # ConsoleShell (app-wide top nav + command palette)
  graph/       # InvestigationGraph (Sigma.js + Graphology)
  workbench/   # RiskScore, EvidenceCard, AgentActivity, CommandPalette, etc.
  ui/          # design system primitives
lib/
  api.ts       # the ONLY file that calls fetch() for backend data
  sse.ts       # SSE-ready streaming abstraction (mock stream today)
  types.ts     # shared types — mirror backend/app/schemas.py here
mock/          # deterministic fixtures matching the future API contract
hooks/         # useInvestigationStream, useCommandPalette
__tests__/     # vitest + Testing Library
```

See `../docs/MEMBER1_HANDOFF.md` for what to wire up next.
