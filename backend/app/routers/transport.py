"""Transport router — /api/v1/transport"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import CurrentUser
from app.models.people import Student
from app.models.transport import RouteStop, StudentTransport, TransportLive, TransportRoute
from app.schemas.transport import LiveUpdateRequest, RouteCreateRequest, StudentAssignRequest

router = APIRouter(prefix="/transport", tags=["transport"])


async def _build_transport_detail(student_id: uuid.UUID, db: AsyncSession) -> dict:
    st_result = await db.execute(select(StudentTransport).where(StudentTransport.student_id == student_id))
    st = st_result.scalar_one_or_none()
    if not st:
        raise HTTPException(status_code=404, detail="No transport assignment found")

    route_result = await db.execute(select(TransportRoute).where(TransportRoute.id == st.route_id))
    route = route_result.scalar_one_or_none()
    live_result = await db.execute(select(TransportLive).where(TransportLive.route_id == st.route_id))
    live = live_result.scalar_one_or_none()
    stops_result = await db.execute(select(RouteStop).where(RouteStop.route_id == st.route_id)
                                     .order_by(RouteStop.stop_order))
    stops = stops_result.scalars().all()

    return {
        "routeNo": route.route_no if route else "",
        "driver": route.driver_name if route else None,
        "driverPhone": route.driver_phone if route else None,
        "vehicle": route.vehicle_no if route else None,
        "attendant": route.attendant_name if route else None,
        "status": live.status if live else "idle",
        "eta": live.eta_minutes if live else None,
        "lat": live.lat if live else None,
        "lng": live.lng if live else None,
        "stops": [{"name": s.stop_name, "time": str(s.scheduled_time) if s.scheduled_time else None,
                   "passed": False} for s in stops],
    }


@router.get("/me")
async def my_transport(current_user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await _build_transport_detail(student.id, db)


@router.get("/routes/{route_id}/live")
async def live_location(route_id: uuid.UUID, current_user: CurrentUser,
                         db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TransportLive).where(TransportLive.route_id == route_id))
    live = result.scalar_one_or_none()
    if not live:
        raise HTTPException(status_code=404, detail="No live data")
    return {"lat": live.lat, "lng": live.lng, "eta": live.eta_minutes, "status": live.status}


@router.post("/routes/{route_id}/live")
async def update_live(route_id: uuid.UUID, body: LiveUpdateRequest, current_user: CurrentUser,
                       db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.execute(select(TransportLive).where(TransportLive.route_id == route_id))
    live = result.scalar_one_or_none()
    if not live:
        live = TransportLive(id=uuid.uuid4(), route_id=route_id)
        db.add(live)
    live.lat = body.lat
    live.lng = body.lng
    live.eta_minutes = body.eta_minutes
    live.status = body.status
    live.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "updated"}


@router.post("/routes", status_code=201)
async def create_route(body: RouteCreateRequest, current_user: CurrentUser,
                        db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    from app.models.people import Admin
    admin_result = await db.execute(select(Admin).where(Admin.user_id == current_user.id))
    admin = admin_result.scalar_one_or_none()
    route = TransportRoute(id=uuid.uuid4(), school_id=admin.school_id if admin else uuid.uuid4(),
                           route_no=body.route_no, driver_name=body.driver_name,
                           driver_phone=body.driver_phone, vehicle_no=body.vehicle_no,
                           attendant_name=body.attendant_name)
    db.add(route)
    await db.flush()
    for stop in body.stops:
        rs = RouteStop(id=uuid.uuid4(), route_id=route.id, stop_name=stop.stop_name,
                       stop_order=stop.stop_order, scheduled_time=stop.scheduled_time)
        db.add(rs)
    await db.commit()
    return {"id": route.id}


@router.post("/routes/{route_id}/assign", status_code=201)
async def assign_student(route_id: uuid.UUID, body: StudentAssignRequest, current_user: CurrentUser,
                          db: AsyncSession = Depends(get_db)):
    if current_user.role != "school_admin":
        raise HTTPException(status_code=403, detail="Admin only")
    st = StudentTransport(id=uuid.uuid4(), student_id=body.student_id, route_id=route_id,
                          stop_id=body.stop_id, academic_year_id=body.academic_year_id)
    db.add(st)
    await db.commit()
    return {"id": st.id}
