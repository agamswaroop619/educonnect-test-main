"""
Application factory — FastAPI app with middleware and global error handlers.
"""

import http
import logging

from fastapi import FastAPI
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Scholarly API",
    version=settings.APP_VERSION,
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json",
    redoc_url=None,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "type": "about:blank",
            "title": "Unprocessable Entity",
            "status": 422,
            "detail": exc.errors(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    try:
        title = http.HTTPStatus(exc.status_code).phrase
    except ValueError:
        title = "HTTP Error"
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "about:blank",
            "title": title,
            "status": exc.status_code,
            "detail": exc.detail,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An unexpected error occurred.",
        },
    )


# ---------------------------------------------------------------------------
# API Router  (prefix = /api/v1)
# ---------------------------------------------------------------------------

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "version": settings.APP_VERSION}


# ---------------------------------------------------------------------------
# Domain routers — task 28.1
# ---------------------------------------------------------------------------

from app.routers import (  # noqa: E402
    achievements,
    admin,
    ai,
    attendance,
    auth,
    calendar,
    circulars,
    courses,
    fees,
    gallery,
    homework,
    leave,
    library,
    messages,
    notifications,
    reports,
    students,
    teachers,
    timetable,
    transport,
)

api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(courses.router)
api_router.include_router(attendance.router)
api_router.include_router(homework.router)
api_router.include_router(leave.router)
api_router.include_router(reports.router)
api_router.include_router(fees.router)
api_router.include_router(timetable.router)
api_router.include_router(calendar.router)
api_router.include_router(circulars.router)
api_router.include_router(messages.router)
api_router.include_router(transport.router)
api_router.include_router(library.router)
api_router.include_router(achievements.router)
api_router.include_router(gallery.router)
api_router.include_router(notifications.router)
api_router.include_router(teachers.router)
api_router.include_router(admin.router)
api_router.include_router(ai.router)

app.include_router(api_router)
