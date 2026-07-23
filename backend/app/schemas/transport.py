"""Pydantic schemas for the Transport domain."""

import uuid
from datetime import time
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StopOut(BaseModel):
    name: str
    time: Optional[str] = None
    passed: bool = False


class TransportDetail(BaseModel):
    routeNo: str
    driver: Optional[str] = None
    driverPhone: Optional[str] = None
    vehicle: Optional[str] = None
    attendant: Optional[str] = None
    status: str
    eta: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    stops: list[StopOut]


class RouteStopIn(BaseModel):
    stop_name: str
    stop_order: int
    scheduled_time: Optional[time] = None


class RouteCreateRequest(BaseModel):
    route_no: str
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_no: Optional[str] = None
    attendant_name: Optional[str] = None
    stops: list[RouteStopIn] = []


class StudentAssignRequest(BaseModel):
    student_id: uuid.UUID
    stop_id: Optional[uuid.UUID] = None
    academic_year_id: uuid.UUID


class LiveUpdateRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    eta_minutes: Optional[int] = None
    status: str = "en-route"
