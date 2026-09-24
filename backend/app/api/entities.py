"""Entity lookup API router for TRACE (Transactions, Customers, Devices)."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..data.seed_data import (
    get_transaction,
    get_customer,
    get_device,
)

router = APIRouter()


@router.get("/transactions/{id}")
async def get_transaction_by_id(id: str) -> Dict[str, Any]:
    txn = get_transaction(id)
    if not txn:
        raise HTTPException(status_code=404, detail="TRANSACTION_NOT_FOUND")
    return txn


@router.get("/customers/{id}")
async def get_customer_by_id(id: str) -> Dict[str, Any]:
    cust = get_customer(id)
    if not cust:
        raise HTTPException(status_code=404, detail="CUSTOMER_NOT_FOUND")
    return cust


@router.get("/devices/{id}")
async def get_device_by_id(id: str) -> Dict[str, Any]:
    dev = get_device(id)
    if not dev:
        raise HTTPException(status_code=404, detail="DEVICE_NOT_FOUND")
    return dev
