"""
Finance models: FeeStructure, FeeTransaction.
"""

import uuid
from datetime import date, datetime
from enum import Enum as PyEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, new_uuid


class FeeCategory(str, PyEnum):
    tuition = "tuition"
    development = "development"
    transport = "transport"
    lab = "lab"
    exam = "exam"
    other = "other"


class PaymentMethod(str, PyEnum):
    cash = "cash"
    card = "card"
    bank_transfer = "bank_transfer"
    online = "online"


class TransactionStatus(str, PyEnum):
    success = "success"
    pending = "pending"
    failed = "failed"


class FeeStructure(Base, TimestampMixin):
    __tablename__ = "fee_structures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    class_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classes.id"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False
    )
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    category: Mapped[str] = mapped_column(
        Enum("tuition", "development", "transport", "lab", "exam", "other", name="fee_category"),
        nullable=False,
    )
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class FeeTransaction(Base, TimestampMixin):
    __tablename__ = "fee_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(
        Enum("cash", "card", "bank_transfer", "online", name="payment_method"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("success", "pending", "failed", name="transaction_status"),
        nullable=False, default="success",
    )
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
