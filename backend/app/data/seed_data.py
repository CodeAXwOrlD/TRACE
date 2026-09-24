"""Seed dataset and data access layer for TRACE backend.

Provides in-memory datasets for cases, transactions, customers, devices,
and graph representations, with full referential integrity matching
frontend/mock and agent contracts.
"""

from typing import Dict, List, Optional, Any

SEED_CUSTOMERS: Dict[str, Dict[str, Any]] = {
    "C12382": {
        "id": "C12382",
        "riskLevel": "HIGH",
        "connectedCards": 3,
        "transactionCount": 17,
        "deviceCount": 2,
        "previousCases": 1,
    },
    "C10041": {
        "id": "C10041",
        "riskLevel": "NONE",
        "connectedCards": 1,
        "transactionCount": 142,
        "deviceCount": 1,
        "previousCases": 0,
    },
    "C10982": {
        "id": "C10982",
        "riskLevel": "MEDIUM",
        "connectedCards": 2,
        "transactionCount": 34,
        "deviceCount": 3,
        "previousCases": 2,
    },
}

SEED_DEVICES: Dict[str, Dict[str, Any]] = {
    "DEV-8819": {
        "id": "DEV-8819",
        "deviceType": "mobile_ios",
        "deviceInfo": "iPhone 15 Pro / iOS 17.5.1 Safari",
        "cardsSeenOn": ["CARD-4417", "CARD-0921", "CARD-7754", "CARD-3308"],
    },
    "device-a9": {
        "id": "device-a9",
        "deviceType": "mobile_ios",
        "deviceInfo": "iPhone 15 Pro / iOS 17.5.1 Safari",
        "cardsSeenOn": ["CARD-4417", "CARD-0921", "CARD-7754", "CARD-3308"],
    },
    "DEV-0921": {
        "id": "DEV-0921",
        "deviceType": "desktop_mac",
        "deviceInfo": "macOS 14.4 Sonoma / Chrome 124.0.6367",
        "cardsSeenOn": ["CARD-0921"],
    },
    "DEV-7754": {
        "id": "DEV-7754",
        "deviceType": "mobile_android",
        "deviceInfo": "Samsung Galaxy S23 / Android 14",
        "cardsSeenOn": ["CARD-7754"],
    },
    "DEV-3308": {
        "id": "DEV-3308",
        "deviceType": "desktop_windows",
        "deviceInfo": "Windows 11 / Edge 125.0",
        "cardsSeenOn": ["CARD-3308"],
    },
}

SEED_TRANSACTIONS: Dict[str, Dict[str, Any]] = {
    "txn-flagged": {
        "id": "txn-flagged",
        "timestamp": "2026-09-18T14:22:00Z",
        "amount": 128.33,
        "channel": "card_not_present",
        "cardId": "card-4417",
        "deviceId": "DEV-8819",
        "billingRegion": "US-CA",
        "emailDomain": "proton.example",
        "riskScore": 0.87,
        "flagged": True,
        "is_3ds_authenticated": False,
    },
    "txn-001": {
        "id": "txn-001",
        "timestamp": "2026-09-18T13:41:00Z",
        "amount": 1.05,
        "channel": "card_not_present",
        "cardId": "card-4417",
        "deviceId": "DEV-8819",
        "billingRegion": "US-CA",
        "emailDomain": "proton.example",
        "riskScore": 0.41,
        "flagged": False,
        "is_3ds_authenticated": False,
    },
    "txn-002": {
        "id": "txn-002",
        "timestamp": "2026-09-18T13:39:00Z",
        "amount": 1.20,
        "channel": "card_not_present",
        "cardId": "card-4417",
        "deviceId": "DEV-8819",
        "billingRegion": "US-CA",
        "emailDomain": "proton.example",
        "riskScore": 0.39,
        "flagged": False,
        "is_3ds_authenticated": False,
    },
    "txn-legit-1": {
        "id": "txn-legit-1",
        "timestamp": "2026-09-10T09:00:00Z",
        "amount": 64.00,
        "channel": "card_present",
        "cardId": "card-legit",
        "deviceId": "DEV-0921",
        "billingRegion": "US-NY",
        "emailDomain": "gmail.example",
        "riskScore": 0.91,
        "flagged": False,
        "is_3ds_authenticated": True,
        "authenticated_3ds": True,
        "is_known_device": True,
    },
    "txn-unsure-1": {
        "id": "txn-unsure-1",
        "timestamp": "2026-09-15T11:00:00Z",
        "amount": 842.00,
        "channel": "card_not_present",
        "cardId": "card-3308",
        "deviceId": "DEV-3308",
        "billingRegion": "US-TX",
        "emailDomain": "outlook.example",
        "riskScore": 0.58,
        "flagged": True,
        "is_3ds_authenticated": False,
    },
}

SEED_CASES: List[Dict[str, Any]] = [
    {
        "id": "CASE-0007",
        "investigationId": "inv-0007",
        "verdict": "FRAUD",
        "exposureUsd": 130.58,
        "openedAt": "2026-09-18T14:22:00Z",
        "updatedAt": "2026-09-18T14:22:00Z",
        "summary": "Shared device with two confirmed fraud cases, plus a burst of small charges immediately before the flagged transaction on a newly observed device.",
    },
    {
        "id": "CASE-0012",
        "investigationId": "inv-0012",
        "verdict": "LEGITIMATE",
        "exposureUsd": 64.00,
        "openedAt": "2026-09-10T09:00:00Z",
        "updatedAt": "2026-09-10T09:00:00Z",
        "summary": "Recurring behaviour on a known device. High risk score is a false-positive artifact of amount threshold; similar past cases were cleared.",
    },
    {
        "id": "CASE-0019",
        "investigationId": "inv-0019",
        "verdict": "UNCERTAIN",
        "exposureUsd": 842.00,
        "openedAt": "2026-09-15T11:00:00Z",
        "updatedAt": "2026-09-15T11:00:00Z",
        "summary": "The evidence conflicts and exposure is $842, so a person decides.",
    },
]

SEED_GRAPH: Dict[str, Any] = {
    "nodes": [
        {
            "id": "cust-C12382",
            "type": "customer",
            "label": "C12382",
            "risk": "high",
            "meta": {
                "risk": "HIGH",
                "connectedCards": 3,
                "transactions": 17,
                "devices": 2,
                "previousCases": 1,
            },
        },
        {
            "id": "card-4417",
            "type": "card",
            "label": "····4417",
            "risk": "high",
            "meta": {
                "last4": "4417",
                "customer": "C12382",
                "channel": "Card Not Present",
                "billingRegion": "US-CA",
                "fraudRisk": "High (Bursts)",
            },
        },
        {
            "id": "txn-flagged",
            "type": "transaction",
            "label": "$128.33",
            "flagged": True,
            "risk": "high",
            "meta": {
                "amount": "$128.33",
                "channel": "card_not_present",
                "riskScore": "0.87 (input)",
                "timestamp": "2026-09-18 14:22:00 UTC",
                "origin": "Flagged Trigger",
            },
        },
        {
            "id": "device-a9",
            "type": "device",
            "label": "Device A9",
            "risk": "high",
            "meta": {
                "deviceType": "iPhone 15 Pro / iOS 17",
                "linkedCards": 4,
                "confirmedFraudCases": 2,
                "firstSeen": "2026-09-18 13:30 UTC",
            },
        },
        {
            "id": "card-0921",
            "type": "card",
            "label": "····0921",
            "meta": {
                "last4": "0921",
                "status": "Blocked in CC-0141",
                "connectedVia": "Shared Device A9",
            },
        },
        {
            "id": "card-7754",
            "type": "card",
            "label": "····7754",
            "meta": {
                "last4": "7754",
                "status": "Blocked in CC-2671",
                "connectedVia": "Shared Device A9",
            },
        },
        {
            "id": "card-3308",
            "type": "card",
            "label": "····3308",
            "meta": {
                "last4": "3308",
                "status": "Active monitoring",
                "connectedVia": "Shared Device A9",
            },
        },
        {
            "id": "case-0141",
            "type": "case",
            "label": "CC-0141",
            "risk": "high",
            "meta": {
                "outcome": "Confirmed Fraud",
                "pattern": "CNP + New Device",
                "exposure": "$710.00",
                "similarity": "91%",
            },
        },
        {
            "id": "case-2671",
            "type": "case",
            "label": "CC-2671",
            "risk": "high",
            "meta": {
                "outcome": "Confirmed Fraud",
                "pattern": "Card Testing",
                "exposure": "$1,240.00",
                "similarity": "84%",
            },
        },
    ],
    "edges": [
        {"id": "e1", "source": "cust-C12382", "target": "card-4417", "label": "OWNS"},
        {"id": "e2", "source": "card-4417", "target": "txn-flagged", "label": "MADE"},
        {"id": "e3", "source": "txn-flagged", "target": "device-a9", "label": "FROM_DEVICE"},
        {"id": "e4", "source": "device-a9", "target": "card-0921", "label": "USED_ON"},
        {"id": "e5", "source": "device-a9", "target": "card-7754", "label": "USED_ON"},
        {"id": "e6", "source": "device-a9", "target": "card-3308", "label": "USED_ON"},
        {"id": "e7", "source": "card-4417", "target": "case-0141", "label": "SIMILAR_TO"},
        {"id": "e8", "source": "card-4417", "target": "case-2671", "label": "SIMILAR_TO"},
    ],
}


def get_transaction(txn_id: str) -> Optional[Dict[str, Any]]:
    return SEED_TRANSACTIONS.get(txn_id)


def get_customer(cust_id: str) -> Optional[Dict[str, Any]]:
    return SEED_CUSTOMERS.get(cust_id)


def get_device(dev_id: str) -> Optional[Dict[str, Any]]:
    if dev_id in SEED_DEVICES:
        return SEED_DEVICES[dev_id]
    return {
        "id": dev_id,
        "deviceType": "mobile_ios",
        "deviceInfo": "iPhone / iOS Safari (historical lookup)",
        "cardsSeenOn": ["CARD-4417", "CARD-0921"],
    }


def list_cases() -> List[Dict[str, Any]]:
    return SEED_CASES


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    for c in SEED_CASES:
        if c["id"] == case_id or c.get("investigationId") == case_id:
            return c
    return None


def get_graph(case_or_inv_id: str) -> Dict[str, Any]:
    return SEED_GRAPH


def get_dashboard_stats() -> Dict[str, int]:
    active = sum(1 for c in SEED_CASES if c["verdict"] in ("PENDING", "UNCERTAIN"))
    high_risk = sum(1 for c in SEED_CASES if c["verdict"] == "FRAUD")
    resolved = sum(1 for c in SEED_CASES if c["verdict"] in ("FRAUD", "LEGITIMATE"))
    return {
        "activeCases": active,
        "highRisk": high_risk,
        "investigations": len(SEED_CASES),
        "resolved": resolved,
    }


def build_initial_state_for_txn(transaction_id: str) -> Dict[str, Any]:
    """Constructs LangGraph investigation initial state from transaction context."""
    # Resolve aliases if an investigation or case ID is provided
    if transaction_id in ("inv-0007", "CASE-0007", "0007"):
        transaction_id = "txn-flagged"
    elif transaction_id in ("inv-0012", "CASE-0012", "0012"):
        transaction_id = "txn-legit-1"
    elif transaction_id in ("inv-0019", "CASE-0019", "0019"):
        transaction_id = "txn-unsure-1"

    txn = SEED_TRANSACTIONS.get(transaction_id)
    if not txn:
        # Default fallback
        return {
            "case_id": f"CASE-{transaction_id}",
            "transaction_id": transaction_id,
            "card_id": "card-unknown",
            "transaction": {
                "id": transaction_id,
                "amount": 100.0,
                "risk_score": 0.5,
                "is_3ds_authenticated": False,
            },
            "customer": {"id": "C-UNKNOWN", "risk_level": "MEDIUM"},
            "transaction_history": [],
            "connected_cards": [],
            "connected_devices": [],
        }

    card_id = txn.get("cardId", "card-4417")
    cust_id = "C12382" if card_id == "card-4417" else "C10041" if card_id == "card-legit" else "C10982"
    device_id = txn.get("deviceId", "DEV-8819")

    # Collect transaction history for this card
    history = [
        t for t in SEED_TRANSACTIONS.values() if t.get("cardId") == card_id
    ]

    if card_id == "card-4417":
        connected_cards = ["card-0921", "card-7754", "card-3308"]
    elif card_id == "card-3308":
        connected_cards = ["card-4417"]
    else:
        connected_cards = []

    connected_devices = [device_id] if device_id else []

    case_id = "CASE-0007" if card_id == "card-4417" else "CASE-0012" if card_id == "card-legit" else "CASE-0019"

    normalized_txn = {
        **txn,
        "id": txn.get("id", transaction_id),
        "transaction_id": txn.get("id", transaction_id),
        "amount": float(txn.get("amount", 0.0)),
        "risk_score": float(txn.get("risk_score", txn.get("riskScore", 0.0))),
        "riskScore": float(txn.get("risk_score", txn.get("riskScore", 0.0))),
        "authenticated_3ds": txn.get(
            "authenticated_3ds",
            txn.get("is_3ds_authenticated", False),
        ),
        "is_3ds_authenticated": txn.get(
            "is_3ds_authenticated",
            txn.get("authenticated_3ds", False),
        ),
        "is_known_device": txn.get("is_known_device", False),
    }

    return {
        "case_id": case_id,
        "transaction_id": transaction_id,
        "card_id": card_id,
        "transaction": normalized_txn,
        "customer": SEED_CUSTOMERS.get(cust_id, {"id": cust_id, "risk_level": "LOW"}),
        "transaction_history": history,
        "connected_cards": connected_cards,
        "connected_devices": connected_devices,
    }
