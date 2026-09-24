"""Entity lookup API router for TRACE (Transactions, Customers, Devices)."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..data.dataset_loader import (
    get_transaction_by_id as get_dataset_txn,
    get_customer_by_id as get_dataset_cust,
    get_device_by_id as get_dataset_dev,
)

router = APIRouter()


@router.get("/transactions/{id}")
async def get_transaction_by_id(id: str) -> Dict[str, Any]:
    txn = get_dataset_txn(id)
    if not txn:
        raise HTTPException(status_code=404, detail="TRANSACTION_NOT_FOUND")
    return txn


@router.get("/customers/{id}")
async def get_customer_by_id(id: str) -> Dict[str, Any]:
    cust = get_dataset_cust(id)
    if not cust:
        raise HTTPException(status_code=404, detail="CUSTOMER_NOT_FOUND")
    return cust


@router.get("/devices/{id}")
async def get_device_by_id(id: str) -> Dict[str, Any]:
    dev = get_dataset_dev(id)
    if not dev:
        raise HTTPException(status_code=404, detail="DEVICE_NOT_FOUND")
    return dev
