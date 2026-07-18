"""
Transport models: TransportRoute, RouteStop, StudentTransport, TransportLive.
"""

import uuid
from datetime import datetime
from datetime import time as dt_time

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Time, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, new_uuid


class TransportRoute(Base, TimestampMixin):
    __tablename__ = "transport_routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    school_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schools.id"), nullable=False)
    route_no: Mapped[str] = mapped_column(String(20), nullable=False)
    driver_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    driver_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    vehicle_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    attendant_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    stops: Mapped[list["RouteStop"]] = relationship(
        "RouteStop", back_populates="route", cascade="all, delete-orphan",
        order_by="RouteStop.stop_order"
    )
    live: Mapped["TransportLive | None"] = relationship("TransportLive", back_populates="route", uselist=False)


class RouteStop(Base):
    __tablename__ = "route_stops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transport_routes.id", ondelete="CASCADE"), nullable=False
    )
    stop_name: Mapped[str] = mapped_column(String(200), nullable=False)
    stop_order: Mapped[int] = mapped_column(Integer, nullable=False)
    scheduled_time: Mapped[dt_time | None] = mapped_column(Time, nullable=True)

    route: Mapped["TransportRoute"] = relationship("TransportRoute", back_populates="stops")


class StudentTransport(Base):
    __tablename__ = "student_transport"
    __table_args__ = (UniqueConstraint("student_id", "academic_year_id", name="uq_student_transport_year"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transport_routes.id"), nullable=False
    )
    stop_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("route_stops.id"), nullable=True)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False
    )


class TransportLive(Base):
    __tablename__ = "transport_live"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=new_uuid)
    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("transport_routes.id"), unique=True, nullable=False
    )
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    eta_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("en-route", "at-stop", "arrived", "idle", name="transport_status"),
        nullable=False, default="idle",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    route: Mapped["TransportRoute"] = relationship("TransportRoute", back_populates="live")
