# Implementation Plan: Backend API — Scholarly / EduConnect

## Overview

Replace all hardcoded mock data in the React/TanStack frontend with a production-grade FastAPI (Python 3.12) service backed by PostgreSQL 16. The backend lives in a new `backend/` directory at the project root. Implementation proceeds in six phases: project setup → database models & migrations → authentication → domain routers (one task per domain, 19 total) → property-based and integration tests → frontend integration (API client + TanStack Query hooks).

All tasks use Python 3.12, FastAPI 0.115.x, SQLAlchemy 2.0 async ORM, asyncpg, Alembic, Pydantic v2, python-jose, passlib[bcrypt], pytest, httpx, and hypothesis.

---

## Tasks

### Phase 1 — Project Setup

- [ ] 1. Scaffold backend project structure and configuration
  - [-] 1.1 Create `backend/` directory tree: `app/main.py`, `app/config.py`, `app/database.py`, `app/dependencies.py`, `app/models/`, `app/schemas/`, `app/routers/`, `app/services/`, `app/tests/`, `alembic/`, `alembic.ini`, `requirements.txt`, `.env.example`
    - Write `requirements.txt` pinning: `fastapi==0.115.*`, `uvicorn[standard]==0.32.*`, `sqlalchemy[asyncio]==2.0.*`, `asyncpg==0.30.*`, `alembic==1.14.*`, `pydantic==2.*`, `python-jose[cryptography]==3.3.*`, `passlib[bcrypt]==1.7.*`, `python-multipart==0.0.*`, `boto3==1.35.*`, `redis==5.*`, `pytest==8.*`, `hypothesis==6.*`, `httpx==0.28.*`, `pytest-asyncio`
    - Write `.env.example` with keys: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `APP_VERSION`
    - _Requirements: 1.1, 1.2_

  - [~] 1.2 Implement `app/config.py` with Pydantic `BaseSettings`
    - Load all env vars listed in `.env.example`; raise a descriptive `ValueError` at import time if any required variable is missing
    - Export a singleton `settings` instance
    - _Requirements: 1.2, 1.6_

  - [~] 1.3 Implement `app/database.py` async engine and session factory
    - Create `AsyncEngine` with `create_async_engine(settings.DATABASE_URL)` and `async_sessionmaker`
    - Export `AsyncSession` type and `get_db` dependency (yields session, closes on exit)
    - _Requirements: 2.1, 2.4_

  - [~] 1.4 Implement `app/main.py` — application factory with middleware and global error handlers
    - Mount `APIRouter` at `/api/v1/`
    - Configure `CORSMiddleware` using `settings.CORS_ORIGINS`, allowing `GET POST PUT PATCH DELETE` and `Authorization Content-Type` headers
    - Register global exception handlers for `HTTPException` (RFC 7807 envelope: `type`, `title`, `status`, `detail`) and `RequestValidationError` (422 with field-level detail)
    - Add `GET /api/v1/health` route returning `{"status": "ok", "version": settings.APP_VERSION}`
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [ ]* 1.5 Write property test for error response envelope consistency
    - **Property 1: Error Response Envelope Consistency** — for any 4xx/5xx response, body contains `detail` (or `error.code` + `error.message`)
    - **Validates: Requirement 1.4**
    - _Requirements: 1.4_

- [~] 2. Checkpoint — Bootstrap validation
  - Confirm `uvicorn app.main:app --reload` starts without errors, `GET /api/v1/health` returns 200, and CORS headers are present on an OPTIONS preflight. Ask the user if questions arise.


---

### Phase 2 — Database Models and Migrations

- [ ] 3. Define SQLAlchemy ORM models for all domains
  - [~] 3.1 Create `app/models/base.py` — `Base = DeclarativeBase()`, UTC timestamp mixin (`created_at`, `updated_at` as `TIMESTAMP WITH TIME ZONE`)
    - _Requirements: 2.1, 2.4_

  - [~] 3.2 Create `app/models/auth.py` — `User`, `RefreshToken`
    - `users`: `id` (UUID PK), `email` (unique), `password_hash`, `role` (enum: student/teacher/parent/school_admin), `is_active`, timestamps
    - `refresh_tokens`: `id`, `user_id FK`, `token_hash`, `expires_at`, `revoked`
    - _Requirements: 2.2, 3.3_

  - [~] 3.3 Create `app/models/school.py` — `School`, `AcademicYear`, `Term`, `Class`, `Subject`, `Enrollment`, `TeachingAssignment`
    - All foreign-key constraints enforced; `academic_years.is_current` boolean; `enrollments` unique on `(student_id, academic_year_id)`
    - _Requirements: 2.2, 2.3_

  - [~] 3.4 Create `app/models/people.py` — `Student`, `Teacher`, `Parent`, `Admin`, `StudentParent`
    - Each 1:1 with `users` via `user_id FK`; `student_parent` M:M join with `relation` field
    - _Requirements: 2.2, 2.3_

  - [~] 3.5 Create `app/models/academics.py` — `Homework`, `HomeworkResource`, `Submission`, `Grade`, `SubjectProgress`
    - `submissions.status` enum: pending/submitted/graded/overdue
    - _Requirements: 2.2, 2.3_

  - [~] 3.6 Create `app/models/attendance.py` — `AttendanceRecord`
    - Unique constraint on `(student_id, date)`; `status` enum: present/absent/leave
    - _Requirements: 2.2, 7.6_

  - [~] 3.7 Create `app/models/finance.py` — `FeeStructure`, `FeeTransaction`
    - `fee_transactions.status` enum: success/pending/failed
    - _Requirements: 2.2, 11.4_

  - [~] 3.8 Create `app/models/communication.py` — `Message`, `Circular`, `CircularVisibility`, `Notification`
    - `messages.parent_id` self-referential FK for threading; `circulars` has `is_archived` bool
    - _Requirements: 2.2, 2.3_

  - [~] 3.9 Create `app/models/scheduling.py` — `TimetableSlot`, `Event`, `LeaveRequest`
    - `timetable_slots` unique on `(class_id, day_of_week, period_no, academic_year_id)`; `leave_requests.status` enum: pending/approved/rejected
    - _Requirements: 2.2, 12.5_

  - [~] 3.10 Create `app/models/library.py` — `LibraryBook`, `LibraryIssue`
    - _Requirements: 2.2_

  - [~] 3.11 Create `app/models/transport.py` — `TransportRoute`, `RouteStop`, `StudentTransport`, `TransportLive`
    - _Requirements: 2.2_

  - [~] 3.12 Create `app/models/content.py` — `Achievement`, `GalleryAlbum`, `GalleryPhoto`
    - _Requirements: 2.2_

  - [~] 3.13 Create `app/models/ai.py` — `AISession`, `AIMessage`
    - `ai_messages.role` enum: user/assistant; ordered by `sent_at`
    - _Requirements: 2.2, 20.2_

  - [ ]* 3.14 Write property test for UTC timestamp storage
    - **Property 22: Timestamp UTC Storage** — all created records have UTC timestamps (offset +00:00)
    - **Validates: Requirement 2.4**

  - [ ]* 3.15 Write property test for foreign key integrity
    - **Property 21: Foreign Key Integrity** — inserting a record with a non-existent parent FK returns 422 or 404 with no partial record created
    - **Validates: Requirement 2.3**

- [ ] 4. Generate and apply Alembic migrations
  - [~] 4.1 Configure `alembic.ini` and `alembic/env.py` to use `settings.DATABASE_URL` and import all ORM models for autogenerate
    - _Requirements: 2.1_

  - [~] 4.2 Generate initial migration (`alembic revision --autogenerate -m "initial schema"`) and verify the generated file covers all 30+ tables
    - _Requirements: 2.1, 2.5_

  - [~] 4.3 Write a `backend/seed.py` script that inserts one school, one academic year, sample users for each role, one class, and sample data sufficient for all domain endpoints to return non-empty responses
    - _Requirements: 2.2_

- [~] 5. Checkpoint — Database validation
  - Run `alembic upgrade head` against a local PostgreSQL 16 instance; confirm all tables are created and `seed.py` runs without errors. Ask the user if questions arise.


---

### Phase 3 — Authentication and RBAC

- [ ] 6. Implement authentication service and router
  - [~] 6.1 Implement `app/services/auth_service.py`
    - `hash_password(plain: str) -> str` using `passlib.bcrypt`
    - `verify_password(plain: str, hashed: str) -> bool`
    - `create_access_token(user_id, role, school_id) -> str` — HS256 JWT, `exp = iat + 900s`
    - `create_refresh_token(user_id) -> tuple[str, str]` — raw token + bcrypt hash, `exp = iat + 604800s`
    - `decode_access_token(token: str) -> dict` — raises `HTTPException(401)` on invalid/expired
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]* 6.2 Write property test for token expiry claims
    - **Property 2: Token Expiry Claims** — `exp - iat == 900` for access tokens; `exp - iat == 604800` for refresh tokens
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 6.3 Write property test for password storage security
    - **Property 3: Password Storage Security** — stored hash never equals plaintext; `bcrypt.verify(plaintext, stored_hash)` is always True
    - **Validates: Requirement 3.3**

  - [~] 6.4 Implement `app/routers/auth.py` with four endpoints
    - `POST /auth/login`: validate credentials, issue access + refresh tokens; set refresh token as `httpOnly; Secure; SameSite=Strict` cookie; return `{access_token, user: {id, role, name, email}}`
    - `POST /auth/refresh`: read refresh cookie, verify against DB hash, rotate token (revoke old, insert new), return new access token
    - `POST /auth/logout`: revoke refresh token in DB
    - `GET /auth/me`: return current user profile with role-specific sub-object
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8_

  - [ ]* 6.5 Write property test for authentication guard — invalid tokens
    - **Property 4: Authentication Guard — Invalid Tokens** — missing/malformed/expired bearer token on any protected endpoint returns 401
    - **Validates: Requirements 3.9, 3.10**

  - [ ]* 6.6 Write property test for logout invalidating refresh token
    - **Property 5: Logout Invalidates Refresh Token** — after logout, calling `/auth/refresh` with the same token returns 401
    - **Validates: Requirement 3.8**

- [ ] 7. Implement RBAC dependency
  - [~] 7.1 Implement `app/dependencies.py` — `get_current_user` dependency that decodes bearer token and returns the `User` ORM object; `require_roles(roles: list[str])` factory that returns a dependency enforcing role membership; `require_own_or_roles` for owner-or-admin patterns
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 7.2 Write property test for role-based access — cross-user ownership
    - **Property 6: Role-Based Access — Cross-User Ownership** — user B with equal/lesser role and no ownership link accessing user A's resources returns 403
    - **Validates: Requirements 4.3, 4.4**

- [~] 8. Checkpoint — Auth validation
  - Confirm login, refresh, logout, and `/me` endpoints work end-to-end; confirm protected routes return 401 without token and 403 for wrong role. Ask the user if questions arise.


---

### Phase 4 — Domain Routers

- [ ] 9. Implement Students domain (`/api/v1/students`)
  - [~] 9.1 Create `app/schemas/students.py` — `StudentProfile` response schema with all fields from Req 5.1 (id, name, grade, rollNo, admissionNo, dob, bloodGroup, address, email, phone, house, photo, attendancePct, cgpa, daysLeft, parent sub-object)
    - Use `model_config = ConfigDict(from_attributes=True)`
    - _Requirements: 5.1, 23.4_

  - [~] 9.2 Create `app/services/student_service.py` — `get_student_profile(student_id, db)` assembling the full profile from `students`, `users`, `parents`, `student_parent`, and computed attendance/CGPA
    - _Requirements: 5.1, 5.4_

  - [~] 9.3 Create `app/routers/students.py` with endpoints:
    - `GET /students/me` (student) → own profile
    - `GET /students/{student_id}` (teacher, admin, or linked parent) → profile for given student
    - Apply `require_roles` and parent-child scoping; return 404 when not found
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 9.4 Write property test for response field completeness on `/students/me`
    - **Property 16: Response Field Completeness** — all fields from Req 5.1 schema present and non-null when data exists
    - **Validates: Requirements 5.1, 24.1**

- [ ] 10. Implement Courses domain (`/api/v1/courses`)
  - [~] 10.1 Create `app/schemas/courses.py` — `CourseOut` (id, name, chapters, quizzes, dpp, progress 0–100, color, icon); `CourseClassOut` with added classAverage
    - _Requirements: 6.1, 23.4_

  - [~] 10.2 Create `app/services/course_service.py` — fetch `subject_progress` joined with `subjects` for a student; compute `progress` as integer percentage of `chapters_completed / total_chapters`
    - _Requirements: 6.1, 6.2_

  - [~] 10.3 Create `app/routers/courses.py`:
    - `GET /courses/me` (student) → list of CourseOut
    - `GET /courses/{course_id}` (student) → single course; 404 if not in student's class
    - `GET /courses?class_id={id}` (teacher) → all courses with class-wide averages
    - `PATCH /courses/{subject_id}/progress` (student own, teacher) → update chapter/quiz/DPP counts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 11. Implement Attendance domain (`/api/v1/attendance`)
  - [~] 11.1 Create `app/schemas/attendance.py` — `AttendanceSummary` (present, absent, leave, total, streak, monthly list, recent list); `AttendanceMarkRequest` (date, records list); `AttendanceRecord`
    - _Requirements: 7.1, 23.1_

  - [~] 11.2 Create `app/services/attendance_service.py`
    - `get_student_summary(student_id, db)` — aggregate counts, compute 6-month monthly %, last-30-days log, streak
    - `mark_attendance(class_id, date, records, teacher, db)` — bulk insert; raise 409 on duplicate `(student_id, date)`; enforce teacher class assignment
    - `get_class_attendance(class_id, date, db)` — return daily sheet
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 7.6_

  - [~] 11.3 Create `app/routers/attendance.py`:
    - `GET /attendance/me` (student) → AttendanceSummary
    - `GET /attendance/{student_id}` (teacher, admin, linked parent) → AttendanceSummary
    - `POST /attendance` (teacher) → 201 Created; 403 if not assigned to class; 409 on duplicate
    - `GET /attendance?class_id={id}&date={date}` (teacher, admin) → daily sheet
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 11.4 Write property test for attendance summary invariant
    - **Property 9: Attendance Summary Invariant** — `total == present + absent + leave`; `attendancePct == round((present/total)*100, 1)` when total > 0
    - **Validates: Requirements 7.1, 5.1**

  - [ ]* 11.5 Write property test for duplicate attendance rejection
    - **Property 10: Duplicate Attendance Rejection** — submitting a second attendance record for the same (student, date) returns 409 regardless of status value
    - **Validates: Requirement 7.6**

- [ ] 12. Implement Homework domain (`/api/v1/homework`)
  - [~] 12.1 Create `app/schemas/homework.py` — `HomeworkOut` (id, subject, title, assigned, due, status, grade, resources count); `HomeworkCreateRequest`; `HomeworkGradeRequest`
    - _Requirements: 8.1, 23.1_

  - [~] 12.2 Create `app/services/homework_service.py`
    - `get_student_homework(student_id, db)` — join with submissions to compute status (overdue if past due and not submitted)
    - `create_homework(data, teacher, db)` — insert homework + resources
    - `submit_homework(homework_id, student_id, file_url, db)` — upsert submission to `submitted`
    - `grade_homework(homework_id, sub_id, grade, teacher, db)` — update to `graded`; enforce teacher ownership
    - _Requirements: 8.1, 8.2, 8.6, 8.7_

  - [~] 12.3 Create `app/routers/homework.py`:
    - `GET /homework/me` (student) → list
    - `GET /homework/{student_id}` (linked parent) → list for child
    - `POST /homework` (teacher) → 201
    - `PUT /homework/{id}` (teacher owner) → 200; 403 if not creator
    - `DELETE /homework/{id}` (teacher, admin) → soft-delete, 204
    - `POST /homework/{id}/submit` (student) → 200
    - `POST /homework/{id}/grade` (teacher) → 200
    - `GET /homework?class_id={id}` (teacher) → class homework list
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 12.4 Write property test for CRUD round-trip on homework
    - **Property 12: CRUD Round-Trip — Create Then Fetch Returns Matching Data** — POST homework then GET returns matching fields
    - **Validates: Requirement 8.2**

  - [ ]* 12.5 Write property test for delete then fetch returns empty for homework
    - **Property 13: Delete Then Fetch Returns Empty** — DELETE homework then GET list does not include it
    - **Validates: Requirement 8.4**

- [ ] 13. Implement Leave Requests domain (`/api/v1/leaves`)
  - [~] 13.1 Create `app/schemas/leave.py` — `LeaveRequestOut` (id, from, to, reason, status, appliedOn); `LeaveCreateRequest`; `LeaveReviewRequest`
    - _Requirements: 9.2, 23.1_

  - [~] 13.2 Create `app/services/leave_service.py`
    - `create_leave(student_id, data, db)` → insert with status `pending`
    - `review_leave(leave_id, status, reviewer, db)` → update; raise 409 if already in terminal state
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [~] 13.3 Create `app/routers/leave.py`:
    - `POST /leaves` (student) → 201
    - `GET /leaves/me` (student) → list
    - `PUT /leaves/{id}/approve` (teacher, admin) → 200
    - `PUT /leaves/{id}/reject` (teacher, admin) → 200
    - `GET /leaves?class_id={id}` (teacher) → all requests for class
    - 409 when attempting state change on terminal leave
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 13.4 Write property test for leave request status lifecycle
    - **Property 15: Leave Request Status Lifecycle** — transitioning an approved or rejected request returns 409
    - **Validates: Requirement 9.5**

- [ ] 14. Implement Reports domain (`/api/v1/reports`)
  - [~] 14.1 Create `app/schemas/reports.py` — `ReportOut` (overallGrade, cgpa, rank, totalStudents, subjects list, trend list, remarks object); `GradeCreateRequest`
    - _Requirements: 10.1, 23.4_

  - [~] 14.2 Create `app/services/report_service.py`
    - `get_student_report(student_id, db)` — aggregate grades per subject per term, compute CGPA, rank within class
    - `upsert_grade(data, teacher, db)` — create or update grade record
    - `get_class_report(class_id, term_id, db)` — aggregate averages
    - _Requirements: 10.1, 10.3, 10.6_

  - [~] 14.3 Create `app/routers/reports.py`:
    - `GET /reports/me` (student) → ReportOut
    - `GET /reports/{student_id}` (teacher, admin, linked parent) → ReportOut
    - `POST /reports` (teacher, admin) → 201
    - `PUT /reports/{id}` (teacher) → 200
    - `GET /reports?class_id={id}&term={term}` (admin) → class aggregate
    - 404 for non-existent term
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 15. Implement Fees domain (`/api/v1/fees`)
  - [~] 15.1 Create `app/schemas/fees.py` — `FeeSummary` (totalAnnual, paid, due, nextDueDate, structure list, transactions list); `FeeTransactionCreateRequest`
    - _Requirements: 11.1, 23.4_

  - [~] 15.2 Create `app/services/fee_service.py`
    - `get_student_fees(student_id, db)` — dynamically sum successful transactions for `paid`; compute `due = totalAnnual - paid`; derive `nextDueDate` from fee structure
    - `create_transaction(data, admin, db)` → insert with status `success`
    - _Requirements: 11.1, 11.4_

  - [~] 15.3 Create `app/routers/fees.py`:
    - `GET /fees/me` (student, parent own) → FeeSummary
    - `GET /fees/{student_id}` (admin) → FeeSummary
    - `POST /fees/transactions` (admin) → 201
    - 403 when parent accesses unlinked student
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 15.4 Write property test for fee balance invariant
    - **Property 11: Fee Balance Invariant** — `paid == sum(successful transactions)`; `due == totalAnnual - paid`; computed on every request
    - **Validates: Requirements 11.1, 11.4**

- [ ] 16. Implement Timetable domain (`/api/v1/timetable`)
  - [~] 16.1 Create `app/schemas/timetable.py` — `TimetableOut` (days list, periods list with slots); `TimetableSlotCreateRequest`
    - _Requirements: 12.1, 23.1_

  - [~] 16.2 Create `app/services/timetable_service.py`
    - `get_class_timetable(class_id, db)` — pivot slots into days × periods grid
    - `create_slot(data, db)` — insert; raise 409 on `(class_id, day_of_week, period_no)` conflict
    - _Requirements: 12.1, 12.5_

  - [~] 16.3 Create `app/routers/timetable.py`:
    - `GET /timetable/me` (student) → own class timetable
    - `GET /timetable?class_id={id}` (teacher) → class timetable
    - `GET /timetable/teacher/{teacher_id}` (teacher own) → teacher's weekly schedule
    - `POST /timetable` (admin) → 201; 409 on conflict
    - `PUT /timetable/{slot_id}` (admin) → 200
    - `DELETE /timetable/{slot_id}` (admin) → 204
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 16.4 Write property test for timetable conflict rejection
    - **Property 14: Timetable Conflict Rejection** — creating a second slot with same (class_id, day_of_week, period_no) returns 409
    - **Validates: Requirement 12.5**

- [ ] 17. Implement Calendar / Events domain (`/api/v1/calendar`)
  - [~] 17.1 Create `app/schemas/calendar.py` — `CalendarEventOut` (id, title, date, type); `CalendarEventCreateRequest`
    - _Requirements: 13.1, 23.1_

  - [~] 17.2 Create `app/routers/calendar.py`:
    - `GET /calendar` (all authenticated) → list; support `?month=&year=&type=` filtering
    - `POST /calendar` (admin) → 201
    - `PUT /calendar/{id}` (admin) → 200
    - `DELETE /calendar/{id}` (admin) → 204; 403 for non-admin create/update/delete
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 17.3 Write property test for CRUD round-trip on calendar events
    - **Property 12: CRUD Round-Trip** — POST calendar event then GET returns matching fields
    - **Validates: Requirement 13.2**

  - [ ]* 17.4 Write property test for delete then fetch returns empty for calendar events
    - **Property 13: Delete Then Fetch Returns Empty** — DELETE calendar event then GET list does not include it
    - **Validates: Requirement 13.4**

- [ ] 18. Implement Circulars domain (`/api/v1/circulars`)
  - [~] 18.1 Create `app/schemas/circulars.py` — `CircularOut` (id, title, category, date, pinned, excerpt); `CircularCreateRequest` (title, category, excerpt, pinned, visible_to list)
    - _Requirements: 14.1, 23.1_

  - [~] 18.2 Create `app/services/circular_service.py`
    - `list_circulars(user_role, db)` — filter by `circular_visibility.role`; order pinned desc then date desc
    - _Requirements: 14.1, 14.5_

  - [~] 18.3 Create `app/routers/circulars.py`:
    - `GET /circulars` (all authenticated) → filtered, ordered list
    - `GET /circulars/{id}` (all authenticated) → full circular
    - `POST /circulars` (admin, teacher) → 201; 403 for student/parent
    - `PUT /circulars/{id}` (admin) → 200
    - `DELETE /circulars/{id}` (admin) → soft-delete (set `is_archived=True`), 204
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 18.4 Write property test for circular visibility filtering
    - **Property 7: Circular Visibility Filtering** — users with roles not in `visible_to` do not see the circular in GET /circulars
    - **Validates: Requirement 14.1**

  - [ ]* 18.5 Write property test for circular ordering — pinned before non-pinned
    - **Property 8: Circular Ordering** — all pinned circulars appear before non-pinned; both groups sorted by date descending
    - **Validates: Requirement 14.5**

- [ ] 19. Implement Messages domain (`/api/v1/messages`)
  - [~] 19.1 Create `app/schemas/messages.py` — `MessageThreadPreview` (id, from, role, subject, preview, time, unread, avatar); `MessageDetail`; `MessageCreateRequest`
    - _Requirements: 15.1, 23.1_

  - [~] 19.2 Create `app/services/message_service.py`
    - `list_threads(user_id, db)` — get threads where user is sender or recipient; compute `unread` count
    - `get_thread(thread_id, user_id, db)` — fetch all messages; mark as read; 403 if not participant
    - `send_message(data, sender, db)` — create root message or reply; set `parent_id` for replies
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [~] 19.3 Create `app/routers/messages.py`:
    - `GET /messages` (all) → thread preview list
    - `GET /messages/{thread_id}` (participant) → full thread; 403 if not participant
    - `POST /messages` (all) → 201 new thread
    - `POST /messages/{thread_id}/reply` (participant) → 201
    - `PUT /messages/{thread_id}/read` (participant) → mark all read, 200
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ] 20. Implement Transport domain (`/api/v1/transport`)
  - [~] 20.1 Create `app/schemas/transport.py` — `TransportDetail` (routeNo, driver, driverPhone, vehicle, attendant, status, eta, lat, lng, stops list); `RouteCreateRequest`
    - _Requirements: 16.1, 23.1_

  - [~] 20.2 Create `app/routers/transport.py`:
    - `GET /transport/me` (student, parent own) → TransportDetail; 404 if not assigned
    - `GET /transport/{student_id}` (linked parent) → same for child
    - `GET /transport/routes/{route_id}` (all) → route with stops
    - `GET /transport/routes/{route_id}/live` (all) → live location
    - `POST /transport/routes/{route_id}/live` (admin) → push location update
    - `GET /transport` (admin) → all routes
    - `POST /transport/routes` (admin) → 201
    - `POST /transport/routes/{route_id}/assign` (admin) → 201 student assignment
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 21. Implement Library domain (`/api/v1/library`)
  - [~] 21.1 Create `app/schemas/library.py` — `LibrarySummary` (issued list, overdue list, history list); `LibraryIssueRequest`; `LibraryReturnRequest`
    - _Requirements: 17.1, 23.1_

  - [~] 21.2 Create `app/services/library_service.py`
    - `get_student_library(student_id, db)` — split issues into current/overdue/history
    - `issue_book(student_id, book_id, db)` — create issue record; 404 if book not found
    - `return_book(record_id, db)` — mark returned; compute fine dynamically from `(today - due_date).days * DAILY_FINE_RATE` from settings
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [~] 21.3 Create `app/routers/library.py`:
    - `GET /library/me` (student) → LibrarySummary
    - `GET /library/{student_id}` (admin) → same for student
    - `GET /library/books` (all) → catalogue search `?q=&category=`
    - `POST /library/issue` (admin, teacher) → 201; 404 if book not in catalogue
    - `POST /library/return` (admin, teacher) → 200 with fine
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ]* 21.4 Write property test for CRUD round-trip on library issues
    - **Property 12: CRUD Round-Trip** — POST issue then GET /library/{student_id} includes the book in issued list
    - **Validates: Requirement 17.2**

- [ ] 22. Implement Achievements domain (`/api/v1/achievements`)
  - [~] 22.1 Create `app/schemas/achievements.py` — `AchievementOut` (id, title, date, category); `AchievementCreateRequest`
    - _Requirements: 18.1, 23.1_

  - [~] 22.2 Create `app/routers/achievements.py`:
    - `GET /achievements/me` (student) → list
    - `GET /achievements/{student_id}` (teacher, admin, linked parent) → list
    - `POST /achievements` (teacher, admin) → 201; 403 for student/parent
    - `DELETE /achievements/{id}` (admin) → 204; 403 for non-admin
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 22.3 Write property test for CRUD round-trip and delete for achievements
    - **Property 12 / Property 13** — POST achievement then GET returns it; DELETE then GET list omits it
    - **Validates: Requirements 18.2, 18.3 (via Properties 12, 13)**

- [ ] 23. Implement Gallery domain (`/api/v1/gallery`)
  - [~] 23.1 Create `app/schemas/gallery.py` — `GalleryAlbumOut` (id, title, count, cover); `GalleryAlbumDetail` with photos list; `AlbumCreateRequest`
    - _Requirements: 19.1, 23.1_

  - [~] 23.2 Create `app/services/gallery_service.py`
    - `upload_photo(album_id, file, uploader, db)` — upload to S3/R2 via boto3, store URL, return photo record
    - _Requirements: 19.4_

  - [~] 23.3 Create `app/routers/gallery.py`:
    - `GET /gallery` (all) → album list with counts and pre-signed cover URLs
    - `GET /gallery/{album_id}` (all) → album detail with photo URLs
    - `POST /gallery/albums` (admin) → 201; 403 for non-admin
    - `POST /gallery/albums/{album_id}/photos` (admin, multipart) → 201 after S3 upload; 403 for non-admin
    - `DELETE /gallery/albums/{album_id}` (admin) → 204
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 24. Implement Notifications domain (`/api/v1/notifications`)
  - [~] 24.1 Create `app/schemas/notifications.py` — `NotificationOut` (id, type, title, body, read, created_at, action_url)
    - _Requirements: 23.1, 23.4_

  - [~] 24.2 Implement a `notify(user_id, type, title, body, action_url, db)` helper in `app/services/notification_service.py` that inserts notification rows; call it from key service operations (new circular, homework assigned, attendance marked, leave reviewed)
    - _Requirements: 2.2_

  - [~] 24.3 Create `app/routers/notifications.py`:
    - `GET /notifications` (all) → unread first, then read, ordered by `created_at` desc
    - `PATCH /notifications/{id}/read` (owner) → mark read, 200
    - `PATCH /notifications/read-all` (all) → mark all read, 200
    - `DELETE /notifications/{id}` (owner) → 204
    - _Requirements: 4.6_

- [ ] 25. Implement Teachers domain (`/api/v1/teachers`)
  - [~] 25.1 Create `app/schemas/teachers.py` — `StudentSummary` (id, name, rollNo, attendancePct, cgpa, trend, performanceStatus); `SubjectSummary` (id, name, classAverage, periodsPerWeek, performanceClassification)
    - _Requirements: 21.1, 21.2_

  - [~] 25.2 Create `app/services/teacher_service.py`
    - `get_class_roster(teacher_id, status_filter, search, db)` — join students with attendance/grades; compute trend from last 2 terms; compute performanceStatus; apply filter and search
    - `get_teacher_subjects(teacher_id, db)` — join teaching_assignments with subjects; compute classAverage per subject
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

  - [~] 25.3 Create `app/routers/teachers.py`:
    - `GET /teachers/me` (teacher) → own teacher profile
    - `GET /teachers/me/class` (teacher) → roster with `?status=&search=` filters; empty list 200 if no class assigned
    - `GET /teachers/me/subjects` (teacher) → subject list with averages
    - `GET /teachers/{teacher_id}` (teacher own, admin) → teacher profile
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

  - [ ]* 25.4 Write property test for roster filter correctness
    - **Property 19: Roster Filter Correctness** — every student in filtered response has `performanceStatus` exactly matching the query parameter
    - **Validates: Requirement 21.3**

- [ ] 26. Implement Admin domain (`/api/v1/admin`)
  - [~] 26.1 Create `app/schemas/admin.py` — `ClassSummaryOut` (id, name, avgCgpa, avgAttendancePct, studentsNeedingAttention)
    - _Requirements: 22.1_

  - [~] 26.2 Create `app/services/admin_service.py` — `get_all_classes(school_id, db)` aggregating per-class CGPA and attendance averages; `studentsNeedingAttention` = count where performanceStatus == "Needs Attention"
    - _Requirements: 22.1_

  - [~] 26.3 Create `app/routers/admin.py`:
    - `GET /admin/classes` (admin) → class summaries; 403 for non-admin
    - `GET /admin/classes/{class_id}/students` (admin) → full student list with performance data; 403 for non-admin
    - _Requirements: 22.1, 22.2, 22.3_

- [ ] 27. Implement AI Assistant domain (`/api/v1/ai`)
  - [~] 27.1 Create `app/schemas/ai.py` — `AIChatRequest` (message); `AIChatResponse` (response); `AIMessageOut` (id, role, text, sent_at)
    - _Requirements: 20.1, 23.1_

  - [~] 27.2 Create `app/services/ai_service.py`
    - `chat(student_id, message, db)` — call configured AI provider (HTTP via httpx); persist user message + assistant reply to `ai_messages`; raise `HTTPException(502)` on provider error or timeout
    - `get_history(student_id, db)` → list ordered by `sent_at` asc, user message immediately followed by its reply
    - _Requirements: 20.1, 20.2, 20.3_

  - [~] 27.3 Create `app/routers/ai.py`:
    - `POST /ai/chat` (student) → AIChatResponse; 403 for non-student; 502 on provider failure
    - `GET /ai/chat/history` (student) → ordered history; 403 for non-student
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ]* 27.4 Write property test for AI session history order
    - **Property 20: AI Session History Order** — messages returned in chronological order with each user message immediately followed by its assistant reply
    - **Validates: Requirements 20.1, 20.2**

- [ ] 28. Register all routers in `app/main.py`
  - [~] 28.1 Import and include all 19 domain `APIRouter` instances in `app/main.py` under the `/api/v1/` prefix; verify OpenAPI docs at `/api/v1/docs` and `/api/v1/openapi.json` load without errors
    - _Requirements: 1.1, 23.3_

- [~] 29. Checkpoint — All domain endpoints
  - Confirm all 19 domains are reachable, all role-based access checks fire correctly, and `/api/v1/docs` lists all routes. Ask the user if questions arise.


---

### Phase 5 — Property-Based and Integration Tests

- [ ] 30. Set up test infrastructure
  - [~] 30.1 Configure `pytest.ini` (or `pyproject.toml`) with `asyncio_mode = "auto"`, test paths, and a `conftest.py` that:
    - Spins up a test PostgreSQL DB (via `pytest-postgres` or Docker fixture)
    - Runs `alembic upgrade head` before the test session
    - Provides an `AsyncClient` fixture wrapping `httpx.AsyncClient(app=app)`
    - Provides `auth_headers(role)` fixture returning Bearer headers for each of the 4 roles
    - _Requirements: 1.4, 23.1_

  - [~] 30.2 Write integration tests for authentication endpoints
    - Login with valid credentials → 200 with access_token and user object
    - Login with wrong password → 401
    - Refresh with valid cookie → 200 with new access_token
    - Refresh with expired/revoked token → 401
    - Logout then refresh → 401
    - Protected route with no token → 401
    - Protected route with expired token → 401
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [~] 30.3 Write integration tests for RBAC enforcement
    - Student accessing teacher-only endpoint → 403
    - Teacher accessing another teacher's private messages → 403
    - Parent accessing unlinked student data → 403
    - Admin accessing any domain endpoint → 200
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 31. Write domain integration tests (happy path + error cases)
  - [~] 31.1 Attendance: mark bulk → 201; duplicate mark → 409; summary totals invariant; parent unlinked → 403
    - _Requirements: 7.1, 7.3, 7.5, 7.6_

  - [~] 31.2 Homework: create → submit → grade lifecycle; delete then list omits item; teacher ownership 403
    - _Requirements: 8.2, 8.4, 8.5, 8.6, 8.7_

  - [~] 31.3 Leave: create pending → approve → attempt re-approve → 409; teacher scope 403
    - _Requirements: 9.1, 9.3, 9.5_

  - [~] 31.4 Timetable: create slot → 201; duplicate slot → 409
    - _Requirements: 12.3, 12.5_

  - [~] 31.5 Circulars: list returns only audience-matching items; pinned before non-pinned ordering
    - _Requirements: 14.1, 14.5_

  - [~] 31.6 Fees: paid/due computed correctly after adding a transaction
    - _Requirements: 11.1, 11.4_

  - [~] 31.7 Reports: no-password exposure — response bodies contain no field named `password` or `hashed_password`
    - _Requirements: 23.2_

- [ ] 32. Write Hypothesis property-based tests (consolidate all `[]*` tasks)
  - [~] 32.1 Collect all `[]*` property tests marked throughout Phase 3 and Phase 4 tasks into `app/tests/test_properties.py`
    - Properties covered: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22
    - Each test uses `@given(...)` from Hypothesis with appropriate strategies
    - _Requirements: 3.3, 3.4, 3.5, 3.8, 4.3, 7.1, 7.6, 11.1, 12.5, 14.1, 14.5, 21.3_

- [~] 33. Checkpoint — Test suite
  - Run `pytest backend/app/tests/ -v` and confirm all integration and property tests pass. Ask the user if questions arise.


---

### Phase 6 — Frontend Integration

- [ ] 34. Create API client and auth integration on the frontend
  - [~] 34.1 Create `src/lib/api-client.ts`
    - Export a `request<T>(path, options)` function that prepends `VITE_API_BASE_URL` (default `/api/v1`), injects `Authorization: Bearer <token>` from auth context, and on 401 calls `refreshToken()` then retries once
    - _Requirements: 24.2, 24.4_

  - [~] 34.2 Update `src/contexts/auth-context.tsx` (or equivalent)
    - Replace mock login with `POST /api/v1/auth/login`
    - Store access token in memory (not localStorage)
    - Implement `refreshToken()` calling `POST /api/v1/auth/refresh`
    - Implement `logout()` calling `POST /api/v1/auth/logout`
    - _Requirements: 3.1, 3.6, 3.8, 24.1_

  - [~] 34.3 Configure Vite dev proxy in `vite.config.ts` to proxy `/api/*` → `http://localhost:8000`
    - _Requirements: 24.2_

- [ ] 35. Replace mock data with TanStack Query hooks — Student pages
  - [~] 35.1 Create `src/lib/queries/students.ts` — `useStudentProfile()` → `GET /api/v1/students/me`
    - _Requirements: 5.1, 24.1_

  - [~] 35.2 Create `src/lib/queries/courses.ts` — `useCourses()` → `GET /api/v1/courses/me`
    - _Requirements: 6.1, 24.1_

  - [~] 35.3 Create `src/lib/queries/attendance.ts` — `useAttendance()` → `GET /api/v1/attendance/me`
    - _Requirements: 7.1, 24.1_

  - [~] 35.4 Create `src/lib/queries/homework.ts` — `useHomework()` → `GET /api/v1/homework/me`; `useSubmitHomework()` mutation
    - _Requirements: 8.1, 8.6, 24.1_

  - [~] 35.5 Create `src/lib/queries/leave.ts` — `useLeaveRequests()` → `GET /api/v1/leaves/me`; `useCreateLeave()` mutation
    - _Requirements: 9.1, 9.2, 24.1_

  - [~] 35.6 Create `src/lib/queries/reports.ts` — `useReport()` → `GET /api/v1/reports/me`
    - _Requirements: 10.1, 24.1_

  - [~] 35.7 Create `src/lib/queries/fees.ts` — `useFees()` → `GET /api/v1/fees/me`
    - _Requirements: 11.1, 24.1_

  - [~] 35.8 Create `src/lib/queries/timetable.ts` — `useTimetable()` → `GET /api/v1/timetable/me`
    - _Requirements: 12.1, 24.1_

  - [~] 35.9 Create `src/lib/queries/calendar.ts` — `useCalendar()` → `GET /api/v1/calendar`
    - _Requirements: 13.1, 24.1_

  - [~] 35.10 Create `src/lib/queries/circulars.ts` — `useCirculars()` → `GET /api/v1/circulars`
    - _Requirements: 14.1, 24.1_

  - [~] 35.11 Create `src/lib/queries/messages.ts` — `useMessageThreads()`, `useThread(id)`, `useSendMessage()`, `useReplyToThread()`
    - _Requirements: 15.1, 15.3, 15.4, 24.1_

  - [~] 35.12 Create `src/lib/queries/transport.ts` — `useTransport()` → `GET /api/v1/transport/me`
    - _Requirements: 16.1, 24.1_

  - [~] 35.13 Create `src/lib/queries/library.ts` — `useLibrary()` → `GET /api/v1/library/me`
    - _Requirements: 17.1, 24.1_

  - [~] 35.14 Create `src/lib/queries/achievements.ts` — `useAchievements()` → `GET /api/v1/achievements/me`
    - _Requirements: 18.1, 24.1_

  - [~] 35.15 Create `src/lib/queries/gallery.ts` — `useGallery()` → `GET /api/v1/gallery`; `useAlbum(id)` → `GET /api/v1/gallery/{id}`
    - _Requirements: 19.1, 19.2, 24.1_

  - [~] 35.16 Create `src/lib/queries/ai.ts` — `useChatHistory()`, `useSendChatMessage()` mutation
    - _Requirements: 20.1, 20.2, 24.1_

- [ ] 36. Replace mock data with TanStack Query hooks — Teacher and Admin pages
  - [~] 36.1 Create `src/lib/queries/teachers.ts` — `useClassRoster(filters)` → `GET /api/v1/teachers/me/class`; `useTeacherSubjects()` → `GET /api/v1/teachers/me/subjects`
    - _Requirements: 21.1, 21.2, 24.1_

  - [~] 36.2 Create `src/lib/queries/admin.ts` — `useAdminClasses()` → `GET /api/v1/admin/classes`; `useAdminClassStudents(classId)` → `GET /api/v1/admin/classes/{classId}/students`
    - _Requirements: 22.1, 22.2, 24.1_

- [ ] 37. Remove mock data dependency
  - [~] 37.1 Audit `src/lib/mock-data.ts` imports across the codebase; confirm all page components now use TanStack Query hooks instead of direct mock data imports; delete or archive `mock-data.ts`
    - _Requirements: 24.1_

- [~] 38. Final checkpoint — End-to-end smoke test
  - Start the FastAPI backend (`uvicorn app.main:app`), run the frontend dev server, and verify: login works for all four roles, each page renders real data from the API, no console errors about missing data. Ask the user if questions arise.


---

## Task Dependency Graph

```
1 (Scaffold) → 2 (Checkpoint)
2 → 3 (ORM Models)
3 → 4 (Migrations)
4 → 5 (Checkpoint)
5 → 6 (Auth Service + Router)
5 → 7 (RBAC Dependency)
6 → 8 (Checkpoint)
7 → 8

8 → 9  (Students)
8 → 10 (Courses)
8 → 11 (Attendance)
8 → 12 (Homework)
8 → 13 (Leave)
8 → 14 (Reports)
8 → 15 (Fees)
8 → 16 (Timetable)
8 → 17 (Calendar)
8 → 18 (Circulars)
8 → 19 (Messages)
8 → 20 (Transport)
8 → 21 (Library)
8 → 22 (Achievements)
8 → 23 (Gallery)
8 → 24 (Notifications)
8 → 25 (Teachers)
8 → 26 (Admin)
8 → 27 (AI Assistant)

9–27 → 28 (Register all routers)
28 → 29 (Checkpoint — all domains)

29 → 30 (Test infrastructure)
30 → 31 (Domain integration tests)
30 → 32 (Property-based tests)
31 → 33 (Checkpoint — test suite)
32 → 33

33 → 34 (API client + Auth integration)
34 → 35 (Student query hooks)
34 → 36 (Teacher/Admin query hooks)
35 → 37 (Remove mock-data.ts)
36 → 37
37 → 38 (Final smoke test)
```

Domain routers (tasks 9–27) are independent of each other and can be implemented in parallel once the auth checkpoint (task 8) is complete.
