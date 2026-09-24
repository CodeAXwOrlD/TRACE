"""LangGraph Workflow for TRACE Fraud Investigation.

Implements Section 3 of Member 2 handoff:
START
  -> LOAD_INVESTIGATION
  -> COLLECT_EVIDENCE
  -> ANALYZE_TRANSACTION_HISTORY
  -> ANALYZE_GRAPH_CONNECTIONS
  -> ANALYZE_PATTERNS
  -> SEARCH_HISTORICAL_CASES
  -> ESTIMATE_FRAUD_PROBABILITY
  -> ESTIMATE_UNCERTAINTY
  -> APPLY_POLICY
  -> GENERATE_NEXT_ACTIONS
  -> GENERATE_RATIONALE
  -> FINALIZE_INVESTIGATION
  -> END
"""

import copy
from typing import Any, Dict, List
from langgraph.graph import StateGraph, START, END

from agent.state import InvestigationState
from agent.schemas.events import InvestigationEvent
from agent.evidence import EvidenceCollector
from agent.history import HistoryAnalyzer
from agent.graph_analysis import GraphAnalyzer
from agent.patterns import PatternAnalyzer
from agent.historical import HistoricalCaseMatcher
from agent.scoring import ScoringEngine
from agent.policy import PolicyEngine
from agent.explanation import ExplanationGenerator


def _append_event(state: InvestigationState, event_type: str, data: Dict[str, Any]) -> List[InvestigationEvent]:
    events = list(state.get("events", []))
    events.append(InvestigationEvent(type=event_type, data=data))
    return events


# 1. LOAD INVESTIGATION
def node_load_investigation(state: InvestigationState) -> Dict[str, Any]:
    case_id = state.get("case_id", f"case_{state.get('transaction_id', 'unknown')}")
    events = _append_event(
        state,
        "investigation_started",
        {
            "case_id": case_id,
            "transaction_id": state.get("transaction_id"),
            "card_id": state.get("card_id"),
        },
    )
    return {
        "case_id": case_id,
        "status": "RUNNING",
        "events": events,
    }


# 2. COLLECT EVIDENCE
def node_collect_evidence(state: InvestigationState) -> Dict[str, Any]:
    collected = EvidenceCollector.collect(
        transaction=state.get("transaction", {}),
        customer=state.get("customer", {}),
        transaction_history=state.get("transaction_history", []),
        connected_cards=state.get("connected_cards", []),
        connected_devices=state.get("connected_devices", []),
    )
    current_evidence = list(state.get("evidence", []))
    # Deduplicate by step & finding
    existing_keys = {(e.step, e.finding) for e in current_evidence}
    for item in collected:
        if (item.step, item.finding) not in existing_keys:
            current_evidence.append(item)
            existing_keys.add((item.step, item.finding))

    events = list(state.get("events", []))
    for ev_item in collected:
        events.append(
            InvestigationEvent(
                type="evidence_found",
                data=ev_item.model_dump(),
            )
        )

    return {
        "evidence": current_evidence,
        "events": events,
    }


# 3. ANALYZE TRANSACTION HISTORY
def node_analyze_history(state: InvestigationState) -> Dict[str, Any]:
    first_suspicious_txn_id, episode_txn_ids, exposure_usd = HistoryAnalyzer.analyze(
        current_transaction=state.get("transaction", {}),
        transaction_history=state.get("transaction_history", []),
    )
    return {
        "first_suspicious_txn_id": first_suspicious_txn_id,
        "episode_txn_ids": episode_txn_ids,
        "exposure_usd": exposure_usd,
    }


# 4. ANALYZE GRAPH CONNECTIONS
def node_analyze_graph(state: InvestigationState) -> Dict[str, Any]:
    events = _append_event(
        state,
        "graph_analysis_started",
        {"card_id": state.get("card_id")},
    )
    graph_evidence = GraphAnalyzer.analyze_connections(
        card_id=state.get("card_id", ""),
        connected_cards=state.get("connected_cards", []),
        connected_devices=state.get("connected_devices", []),
        transaction=state.get("transaction", {}),
    )
    current_evidence = list(state.get("evidence", []))
    for ge in graph_evidence:
        current_evidence.append(ge)
        events.append(
            InvestigationEvent(
                type="evidence_found",
                data=ge.model_dump(),
            )
        )

    events.append(
        InvestigationEvent(
            type="graph_analysis_complete",
            data={
                "connected_cards_count": len(state.get("connected_cards", [])),
                "connected_devices_count": len(state.get("connected_devices", [])),
            },
        )
    )

    return {
        "evidence": current_evidence,
        "events": events,
    }


# 5. ANALYZE PATTERNS
def node_analyze_patterns(state: InvestigationState) -> Dict[str, Any]:
    pattern = PatternAnalyzer.classify(
        transaction=state.get("transaction", {}),
        evidence=state.get("evidence", []),
        connected_cards=state.get("connected_cards", []),
        episode_txn_ids=state.get("episode_txn_ids", []),
    )
    events = _append_event(
        state,
        "pattern_detected",
        {"pattern": pattern},
    )
    return {
        "pattern": pattern,
        "events": events,
    }


# 6. SEARCH HISTORICAL CASES
def node_search_historical_cases(state: InvestigationState) -> Dict[str, Any]:
    similar_cases = HistoricalCaseMatcher.match(
        pattern=state.get("pattern", "none"),
        transaction=state.get("transaction", {}),
        evidence=state.get("evidence", []),
        connected_cards=state.get("connected_cards", []),
    )
    events = _append_event(
        state,
        "historical_cases_found",
        {"count": len(similar_cases), "cases": [c.model_dump() for c in similar_cases]},
    )
    return {
        "similar_cases": similar_cases,
        "events": events,
    }


# 7. ESTIMATE FRAUD PROBABILITY
def node_estimate_fraud_probability(state: InvestigationState) -> Dict[str, Any]:
    prob, uncertainty, verdict = ScoringEngine.calculate(
        transaction=state.get("transaction", {}),
        evidence=state.get("evidence", []),
    )
    events = _append_event(
        state,
        "probability_updated",
        {"fraud_probability": prob},
    )
    # Store temporary calculation; uncertainty & verdict will be committed in next node
    return {
        "fraud_probability": prob,
        "uncertainty": uncertainty,
        "verdict": verdict,
        "events": events,
    }


# 8. ESTIMATE UNCERTAINTY
def node_estimate_uncertainty(state: InvestigationState) -> Dict[str, Any]:
    uncertainty = state.get("uncertainty", "HIGH")
    verdict = state.get("verdict", "UNCERTAIN")
    events = _append_event(
        state,
        "uncertainty_updated",
        {"uncertainty": uncertainty, "verdict": verdict},
    )
    return {
        "uncertainty": uncertainty,
        "verdict": verdict,
        "events": events,
    }


# 9. APPLY POLICY
def node_apply_policy(state: InvestigationState) -> Dict[str, Any]:
    policy_id, next_actions = PolicyEngine.evaluate(
        verdict=state.get("verdict", "UNCERTAIN"),
        fraud_probability=state.get("fraud_probability", 0.5),
        uncertainty=state.get("uncertainty", "HIGH"),
        pattern=state.get("pattern", "none"),
        evidence=state.get("evidence", []),
        connected_cards=state.get("connected_cards", []),
        exposure_usd=state.get("exposure_usd", 0.0),
    )
    events = _append_event(
        state,
        "policy_selected",
        {"policy": policy_id},
    )
    return {
        "policy": policy_id,
        "next_actions": next_actions,
        "events": events,
    }


# 10. GENERATE NEXT ACTIONS
def node_generate_next_actions(state: InvestigationState) -> Dict[str, Any]:
    actions = state.get("next_actions", [])
    events = _append_event(
        state,
        "action_generated",
        {"next_actions": actions},
    )
    return {
        "next_actions": actions,
        "events": events,
    }


# 11. GENERATE RATIONALE
def node_generate_rationale(state: InvestigationState) -> Dict[str, Any]:
    explainer = ExplanationGenerator()
    rationale = explainer.generate(
        case_id=state.get("case_id", ""),
        transaction_id=state.get("transaction_id", ""),
        card_id=state.get("card_id", ""),
        verdict=state.get("verdict", "UNCERTAIN"),
        fraud_probability=state.get("fraud_probability", 0.0),
        uncertainty=state.get("uncertainty", "HIGH"),
        pattern=state.get("pattern", "none"),
        first_suspicious_txn_id=state.get("first_suspicious_txn_id"),
        episode_txn_ids=state.get("episode_txn_ids", []),
        exposure_usd=state.get("exposure_usd", 0.0),
        evidence=state.get("evidence", []),
        similar_cases=state.get("similar_cases", []),
        policy=state.get("policy", "R9"),
        next_actions=state.get("next_actions", []),
    )
    return {
        "rationale": rationale,
    }


# 12. FINALIZE INVESTIGATION
def node_finalize_investigation(state: InvestigationState) -> Dict[str, Any]:
    events = _append_event(
        state,
        "investigation_complete",
        {
            "case_id": state.get("case_id"),
            "verdict": state.get("verdict"),
            "fraud_probability": state.get("fraud_probability"),
            "policy": state.get("policy"),
            "exposure_usd": state.get("exposure_usd"),
        },
    )

    # Write case record back to TigerGraph FraudCaseGraph
    written_to_graph = False
    graph_case_id = None
    try:
        from agent.graph_tools import FraudCaseGraphTools
        tools = FraudCaseGraphTools()
        written_to_graph = tools.write_case_to_graph(
            case_id=state.get("case_id", ""),
            verdict=state.get("verdict", "UNCERTAIN"),
            fraud_probability=state.get("fraud_probability", 0.5),
            pattern=state.get("pattern", "none"),
            first_suspicious_txn_id=state.get("first_suspicious_txn_id"),
            transaction_id=state.get("transaction_id"),
            card_id=state.get("card_id"),
            customer_id=state.get("customer", {}).get("id") if isinstance(state.get("customer"), dict) else None,
        )
        graph_case_id = state.get("case_id") if written_to_graph else None
    except Exception:
        written_to_graph = False

    return {
        "status": "COMPLETED",
        "events": events,
        "written_to_graph": written_to_graph,
        "graph_case_id": graph_case_id,
    }


def create_investigation_graph():
    """Build and compile the LangGraph StateGraph pipeline."""
    builder = StateGraph(InvestigationState)

    # Register Nodes
    builder.add_node("load_investigation", node_load_investigation)
    builder.add_node("collect_evidence", node_collect_evidence)
    builder.add_node("analyze_history", node_analyze_history)
    builder.add_node("analyze_graph", node_analyze_graph)
    builder.add_node("analyze_patterns", node_analyze_patterns)
    builder.add_node("search_historical_cases", node_search_historical_cases)
    builder.add_node("estimate_fraud_probability", node_estimate_fraud_probability)
    builder.add_node("estimate_uncertainty", node_estimate_uncertainty)
    builder.add_node("apply_policy", node_apply_policy)
    builder.add_node("generate_next_actions", node_generate_next_actions)
    builder.add_node("generate_rationale", node_generate_rationale)
    builder.add_node("finalize_investigation", node_finalize_investigation)

    # Register Edges
    builder.add_edge(START, "load_investigation")
    builder.add_edge("load_investigation", "collect_evidence")
    builder.add_edge("collect_evidence", "analyze_history")
    builder.add_edge("analyze_history", "analyze_graph")
    builder.add_edge("analyze_graph", "analyze_patterns")
    builder.add_edge("analyze_patterns", "search_historical_cases")
    builder.add_edge("search_historical_cases", "estimate_fraud_probability")
    builder.add_edge("estimate_fraud_probability", "estimate_uncertainty")
    builder.add_edge("estimate_uncertainty", "apply_policy")
    builder.add_edge("apply_policy", "generate_next_actions")
    builder.add_edge("generate_next_actions", "generate_rationale")
    builder.add_edge("generate_rationale", "finalize_investigation")
    builder.add_edge("finalize_investigation", END)

    return builder.compile()


# Compiled Singleton Graph
investigation_workflow = create_investigation_graph()
