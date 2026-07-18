# Implementation Plan: Backend API — Scholarly / EduConnect

## Overview

Replace all hardcoded mock data in the React/TanStack frontend with a production-grade FastAPI (Python 3.12) service backed by PostgreSQL 16. The backend lives in a new `backend/` directory at the project root. Implementation proceeds in six phases: project setup → database models & migrations → authentication → domain routers (one task per domain, 19 total) → property-based and integration tests → frontend integration (API client + TanStack Query hooks).

All tasks use Python 3.12, FastAPI 0.115.x, SQLAlchemy 2.0 async ORM, asyncpg, Alembic, Pydantic v2, python-jose, passlib[bcrypt], pytest, httpx, and hypothesis.

---

## Tasks

### Phase 1 — Project Setup

- [x] 1. Scaffold backend project structure and configuration
  - [x] 1.1 Create `backend/` directory tree: `app/main.py`, `app/config.py`, `app/database.py`, `app/dependencies.py`, `app/models/`, `app/schemas/`, `app/routers/`, `app/services/`, `app/tests/`, `alembic/`, `alembic.ini`, `requirements.txt`, `.env.example`
  - [x] 1.2 Implement `app/config.py` with Pydantic `BaseSettings`
  - [x] 1.3 Implement `app/database.py` async engine and session factory
  - [x] 1.4 Implement `app/main.py` — application factory with middleware and global error handlers
  - [x]* 1.5 Write property test for error response envelope consistency

- [x] 2. Checkpoint — Bootstrap validation

---

### Phase 2 — Database Models and Migrations

- [x] 3. Define SQLAlchemy ORM models for all domains
  - [x] 3.1 Create `app/models/base.py` — `Base = DeclarativeBase()`, UTC timestamp mixin
  - [x] 3.2 Create `app/models/auth.py` — `User`, `RefreshToken`
  - [x] 3.3 Create `app/models/school.py` — `School`, `AcademicYear`, `Term`, `Class`, `Subject`, `Enrollment`, `TeachingAssignment`
  - [x] 3.4 Create `app/models/people.py` — `Student`, `Teacher`, `Parent`, `Admin`, `StudentParent`
  - [x] 3.5 Create `app/models/academics.py` — `Homework`, `HomeworkResource`, `Submission`, `Grade`, `SubjectProgress`
  - [x] 3.6 Create `app/models/attendance.py` — `AttendanceRecord`
  - [x] 3.7 Create `app/models/finance.py` — `FeeStructure`, `FeeTransaction`
  - [x] 3.8 Create `app/models/communication.py` — `Message`, `Circular`, `CircularVisibility`, `Notification`
  - [x] 3.9 Create `app/models/scheduling.py` — `TimetableSlot`, `Event`, `LeaveRequest`
  - [x] 3.10 Create `app/models/library.py` — `LibraryBook`, `LibraryIssue`
  - [x] 3.11 Create `app/models/transport.py` — `TransportRoute`, `RouteStop`, `StudentTransport`, `TransportLive`
  - [x] 3.12 Create `app/models/content.py` — `Achievement`, `GalleryAlbum`, `GalleryPhoto`
  - [x] 3.13 Create `app/models/ai.py` — `AISession`, `AIMessage`
  - [x]* 3.14 Write property test for UTC timestamp storage
  - [x]* 3.15 Write property test for foreign key integrity

- [x] 4. Generate and apply Alembic migrations
  - [x] 4.1 Configure `alembic.ini` and `alembic/env.py` to use `settings.DATABASE_URL` and import all ORM models for autogenerate
  - [ ] 4.2 Generate initial migration (`alembic revision --autogenerate -m "initial schema"`) — **requires live PostgreSQL DB**
  - [x] 4.3 Write a `backend/seed.py` script that inserts sample data for all domains

- [ ] 5. Checkpoint — Database validation
  - Run `alembic upgrade head` against a local PostgreSQL 16 instance; confirm all tables are created and `seed.py` runs without errors.

---

### Phase 3 — Authentication and RBAC

- [x] 6. Implement authentication service and router
  - [x] 6.1 Implement `app/services/auth_service.py`
  - [x]* 6.2 Write property test for token expiry claims
  - [x]* 6.3 Write property test for password storage security
  - [x] 6.4 Implement `app/routers/auth.py` with four endpoints
  - [x]* 6.5 Write property test for authentication guard — invalid tokens
  - [x]* 6.6 Write property test for logout invalidating refresh token

- [x] 7. Implement RBAC dependency
  - [x] 7.1 Implement `app/dependencies.py` — `get_current_user`, `require_roles`, `require_own_or_roles`
  - [x]* 7.2 Write property test for role-based access — cross-user ownership

- [ ] 8. Checkpoint — Auth validation

---

### Phase 4 — Domain Routers

- [x] 9. Implement Students domain (`/api/v1/students`)
  - [x] 9.1 Create `app/schemas/students.py`
  - [x] 9.2 Create `app/services/student_service.py`
  - [x] 9.3 Create `app/routers/students.py`
  - [x]* 9.4 Write property test for response field completeness on `/students/me`

- [x] 10. Implement Courses domain (`/api/v1/courses`)
  - [x] 10.1 Create `app/schemas/courses.py`
  - [x] 10.2 Create `app/services/course_service.py`
  - [x] 10.3 Create `app/routers/courses.py`

- [x] 11. Implement Attendance domain (`/api/v1/attendance`)
  - [x] 11.1 Create `app/schemas/attendance.py`
  - [x] 11.2 Create `app/services/attendance_service.py`
  - [x] 11.3 Create `app/routers/attendance.py`
  - [x]* 11.4 Write property test for attendance summary invariant
  - [x]* 11.5 Write property test for duplicate attendance rejection

- [x] 12. Implement Homework domain (`/api/v1/homework`)
  - [x] 12.1 Create `app/schemas/homework.py`
  - [x] 12.2 Create `app/services/homework_service.py`
  - [x] 12.3 Create `app/routers/homework.py`
  - [x]* 12.4 Write property test for CRUD round-trip on homework
  - [x]* 12.5 Write property test for delete then fetch returns empty for homework

- [x] 13. Implement Leave Requests domain (`/api/v1/leaves`)
  - [x] 13.1 Create `app/schemas/leave.py`
  - [x] 13.2 Create `app/services/leave_service.py`
  - [x] 13.3 Create `app/routers/leave.py`
  - [x]* 13.4 Write property test for leave request status lifecycle

- [x] 14. Implement Reports domain (`/api/v1/reports`)
  - [x] 14.1 Create `app/schemas/reports.py`
  - [x] 14.2 Create `app/services/report_service.py`
  - [x] 14.3 Create `app/routers/reports.py`

- [x] 15. Implement Fees domain (`/api/v1/fees`)
  - [x] 15.1 Create `app/schemas/fees.py`
  - [x] 15.2 Create `app/services/fee_service.py`
  - [x] 15.3 Create `app/routers/fees.py`
  - [x]* 15.4 Write property test for fee balance invariant

- [x] 16. Implement Timetable domain (`/api/v1/timetable`)
  - [x] 16.1 Create `app/schemas/timetable.py`
  - [x] 16.2 Create `app/services/timetable_service.py`
  - [x] 16.3 Create `app/routers/timetable.py`
  - [x]* 16.4 Write property test for timetable conflict rejection

- [x] 17. Implement Calendar / Events domain (`/api/v1/calendar`)
  - [x] 17.1 Create `app/schemas/calendar.py`
  - [x] 17.2 Create `app/routers/calendar.py`
  - [x]* 17.3 Write property test for CRUD round-trip on calendar events
  - [x]* 17.4 Write property test for delete then fetch returns empty for calendar events

- [x] 18. Implement Circulars domain (`/api/v1/circulars`)
  - [x] 18.1 Create `app/schemas/circulars.py`
  - [x] 18.2 Create `app/services/circular_service.py`
  - [x] 18.3 Create `app/routers/circulars.py`
  - [x]* 18.4 Write property test for circular visibility filtering
  - [x]* 18.5 Write property test for circular ordering — pinned before non-pinned

- [x] 19. Implement Messages domain (`/api/v1/messages`)
  - [x] 19.1 Create `app/schemas/messages.py`
  - [x] 19.2 Create `app/services/message_service.py`
  - [x] 19.3 Create `app/routers/messages.py`

- [x] 20. Implement Transport domain (`/api/v1/transport`)
  - [x] 20.1 Create `app/schemas/transport.py`
  - [x] 20.2 Create `app/routers/transport.py`

- [x] 21. Implement Library domain (`/api/v1/library`)
  - [x] 21.1 Create `app/schemas/library.py`
  - [x] 21.2 Create `app/services/library_service.py`
  - [x] 21.3 Create `app/routers/library.py`
  - [x]* 21.4 Write property test for CRUD round-trip on library issues

- [x] 22. Implement Achievements domain (`/api/v1/achievements`)
  - [x] 22.1 Create `app/schemas/achievements.py`
  - [x] 22.2 Create `app/routers/achievements.py`
  - [x]* 22.3 Write property test for CRUD round-trip and delete for achievements

- [x] 23. Implement Gallery domain (`/api/v1/gallery`)
  - [x] 23.1 Create `app/schemas/gallery.py`
  - [x] 23.2 Create `app/services/gallery_service.py`
  - [x] 23.3 Create `app/routers/gallery.py`

- [x] 24. Implement Notifications domain (`/api/v1/notifications`)
  - [x] 24.1 Create `app/schemas/notifications.py`
  - [x] 24.2 Implement `app/services/notification_service.py`
  - [x] 24.3 Create `app/routers/notifications.py`

- [x] 25. Implement Teachers domain (`/api/v1/teachers`)
  - [x] 25.1 Create `app/schemas/teachers.py`
  - [x] 25.2 Create `app/services/teacher_service.py`
  - [x] 25.3 Create `app/routers/teachers.py`
  - [x]* 25.4 Write property test for roster filter correctness

- [x] 26. Implement Admin domain (`/api/v1/admin`)
  - [x] 26.1 Create `app/schemas/admin.py`
  - [x] 26.2 Create `app/services/admin_service.py`
  - [x] 26.3 Create `app/routers/admin.py`

- [x] 27. Implement AI Assistant domain (`/api/v1/ai`)
  - [x] 27.1 Create `app/schemas/ai.py`
  - [x] 27.2 Create `app/services/ai_service.py`
  - [x] 27.3 Create `app/routers/ai.py`
  - [x]* 27.4 Write property test for AI session history order

- [x] 28. Register all routers in `app/main.py`
  - [x] 28.1 Import and include all 19 domain `APIRouter` instances in `app/main.py`

- [ ] 29. Checkpoint — All domain endpoints
  - Confirm all 19 domains are reachable, RBAC checks fire correctly, and `/api/v1/docs` lists all routes.

---

### Phase 5 — Property-Based and Integration Tests

- [x] 30. Set up test infrastructure
  - [x] 30.1 Configure `pytest.ini` / `conftest.py` with `asyncio_mode = "auto"`, async client fixture, auth header fixtures
  - [x] 30.2 Write integration tests for authentication endpoints (`test_auth.py`)
  - [x] 30.3 Write integration tests for RBAC enforcement (`test_rbac.py`)

- [ ] 31. Write domain integration tests (happy path + error cases)
  - [ ] 31.1 Attendance: mark bulk → 201; duplicate mark → 409; parent unlinked → 403
  - [ ] 31.2 Homework: create → submit → grade lifecycle; delete then list omits item
  - [ ] 31.3 Leave: create pending → approve → attempt re-approve → 409
  - [ ] 31.4 Timetable: create slot → 201; duplicate slot → 409
  - [ ] 31.5 Circulars: list returns only audience-matching items; pinned ordering
  - [ ] 31.6 Fees: paid/due computed correctly after adding a transaction
  - [ ] 31.7 No-password exposure across response bodies

- [x] 32. Write Hypothesis property-based tests
  - [x] 32.1 Collected into `app/tests/test_properties.py` — Properties 2, 3, 8, 9, 11

- [ ] 33. Checkpoint — Test suite
  - Run `pytest backend/app/tests/ -v` and confirm all tests pass.

---

### Phase 6 — Frontend Integration

- [x] 34. Create API client and auth integration on the frontend
  - [x] 34.1 Create `src/lib/api-client.ts` — `request<T>`, token injection, 401 retry
  - [x] 34.2 Update `src/lib/auth-context.tsx` — real login/logout/refresh via API
  - [x] 34.3 Configure Vite dev proxy in `vite.config.ts` → `http://localhost:8000`

- [x] 35. Replace mock data with TanStack Query hooks — Student pages
  - [x] 35.1 `src/lib/queries/students.ts` — `useStudentProfile()`
  - [x] 35.2 `src/lib/queries/courses.ts` — `useCourses()`
  - [x] 35.3 `src/lib/queries/attendance.ts` — `useAttendance()`
  - [x] 35.4 `src/lib/queries/homework.ts` — `useHomework()`, `useSubmitHomework()`
  - [x] 35.5 `src/lib/queries/leave.ts` — `useLeaveRequests()`, `useCreateLeave()`
  - [x] 35.6 `src/lib/queries/reports.ts` — `useReport()`
  - [x] 35.7 `src/lib/queries/fees.ts` — `useFees()`
  - [x] 35.8 `src/lib/queries/timetable.ts` — `useTimetable()`
  - [x] 35.9 `src/lib/queries/calendar.ts` — `useCalendar()`
  - [x] 35.10 `src/lib/queries/circulars.ts` — `useCirculars()`
  - [x] 35.11 `src/lib/queries/messages.ts` — `useMessageThreads()`, `useThread()`, `useSendMessage()`, `useReplyToThread()`
  - [x] 35.12 `src/lib/queries/transport.ts` — `useTransport()` (polls every 15s)
  - [x] 35.13 `src/lib/queries/library.ts` — `useLibrary()`
  - [x] 35.14 `src/lib/queries/achievements.ts` — `useAchievements()`
  - [x] 35.15 `src/lib/queries/gallery.ts` — `useGallery()`, `useAlbum()`
  - [x] 35.16 `src/lib/queries/ai.ts` — `useChatHistory()`, `useSendChatMessage()`

- [x] 36. Replace mock data with TanStack Query hooks — Teacher and Admin pages
  - [x] 36.1 `src/lib/queries/teachers.ts` — `useClassRoster()`, `useTeacherSubjects()`
  - [x] 36.2 `src/lib/queries/admin.ts` — `useAdminClasses()`, `useAdminClassStudents()`

- [ ] 37. Remove mock data dependency
  - [ ] 37.1 Audit `src/lib/mock-data.ts` imports; wire page components to use query hooks; archive mock-data.ts

- [ ] 38. Final checkpoint — End-to-end smoke test
  - Start backend + frontend; verify login works for all four roles and each page renders real API data.

---

## Task Dependency Graph

```
1 → 2 → 3 → 4 → 5 → 6+7 → 8
8 → 9–27 (parallel) → 28 → 29
29 → 30 → 31+32 → 33
33 → 34 → 35+36 → 37 → 38
```

Domain routers (9–27) are independent of each other and can be implemented in parallel once the auth checkpoint (8) is complete.

---

## Summary of Progress

| Phase | Status |
|---|---|
| Phase 1: Project Setup | ✅ Complete |
| Phase 2: DB Models + Alembic config | ✅ Complete (migration needs live DB) |
| Phase 3: Auth + RBAC | ✅ Complete |
| Phase 4: All 19 Domain Routers | ✅ Complete |
| Phase 5: Tests | 🔄 Partial (conftest, auth tests, property tests done; domain integration tests pending) |
| Phase 6: Frontend Integration | ✅ Complete (api-client, auth context, all 18 query hook files, Vite proxy) |
| Remaining | Alembic migration (needs DB), domain integration tests (31.x), mock-data.ts wiring (37), smoke test (38) |
