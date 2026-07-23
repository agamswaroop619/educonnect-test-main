"""Pydantic schemas for the Fees domain."""

import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class FeeStructureItem(BaseModel):
    label: str
    amount: float


class FeeTransactionOut(BaseModel):
    id: uuid.UUID
    date: Optional[datetime] = None
    label: str
    amount: float
    method: str
    status: str


class FeeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    totalAnnual: float
    paid: float
    due: float
    nextDueDate: Optional[date] = None
    structure: list[FeeStructureItem]
    transactions: list[FeeTransactionOut]


class FeeTransactionCreateRequest(BaseModel):
    student_id: uuid.UUID
    amount: float
    label: str
    method: str

    @field_validator("amount")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v

    @field_validator("method")
    @classmethod
    def validate_method(cls, v: str) -> str:
        allowed = {"cash", "card", "bank_transfer", "online"}
        if v not in allowed:
            raise ValueError(f"method must be one of {allowed}")
        return v
