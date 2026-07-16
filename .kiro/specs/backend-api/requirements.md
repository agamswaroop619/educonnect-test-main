# Requirements Document

## Introduction

This document specifies the requirements for the Scholarly backend API — a production-grade FastAPI (Python 3.12) service backed by PostgreSQL 16 that replaces all hardcoded mock data in `src/lib/mock-data.ts`. The API exposes versioned REST endpoints under `/api/v1/` consumed by TanStack Query hooks in the existing React/TanStack frontend. All nineteen domains (students, teachers, parents, admins, attendance, homework, fees, circulars, transport, library, achievements, gallery, messages, timetable, leave requests, reports, calendar, courses, and AI assistant) are covered with JWT-authenticated, role-based access control enforced at the API layer. The frontend UI structure, routing, and layout remain unchanged; only the data layer is replaced.

---

## Glossary

- **API**: The FastAPI application serving all `/api/v1/` routes.
- **Auth_Service**: The component responsible for issuing and validating JWT tokens.
- **Domain_Router**: A FastAPI `APIRouter` instance for a single domain (e.g. attendance, homework).
- **ORM**: SQLAlchemy ORM layer that maps Python models to PostgreSQL tables.
- **Migration_Tool**: Alembic, used to manage all database schema changes.
- **Pydantic_Schema**: A Pydantic v2 model used for request validation and response serialisation.
- **Access_Token**: A short-lived JWT (15-minute expiry) used to authenticate API requests.
- **Refresh_Token**: A long-lived JWT (7-day expiry) used to obtain new Access_Tokens.
- **Role**: One of four values assigned to every user: `student`, `teacher`, `parent`, `school_admin`.
- **RBAC**: Role-Based Access Control — the mechanism that restricts endpoint access by Role.
- **Student**: A user with Role `student`.
- **Teacher**: A user with Role `teacher`.
- **Parent**: A user with Role `parent`.
- **Admin**: A user with Role `school_admin`.
- **Class**: A school class (e.g. "Class 10 - Section B") that belongs to a Grade and contains Students.
- **Subject**: An academic subject (e.g. Maths, Physics) taught by a Teacher to a Class.
- **Attendance_Record**: A per-Student per-day record with status `present`, `absent`, or `leave`.
- **Homework_Assignment**: A task assigned by a Teacher for a Subject and Class with a due date.
- **Leave_Request**: A Student-submitted request for absence covering a date range.
- **Fee_Record**: The annual fee structure and payment transactions for a Student.
- **Circular**: A school-wide or role-targeted announcement posted by an Admin or Teacher.
- **Message**: A threaded communication between two or more Users of any Role.
- **Timetable_Slot**: A single period entry specifying Class, day, period number, Subject, and Teacher.
- **Report**: Per-Student per-Subject per-Term marks, grade, and teacher remarks.
- **Transport_Route**: A bus route with ordered stops; Students are assigned to a route.
- **Library_Record**: An issued or returned book record linking a book to a Student.
- **Achievement**: An award or recognition associated with a Student.
- **Gallery_Album**: A named collection of school event photos with a cover image URL.
- **Calendar_Event**: A school-wide event such as a holiday, exam, or PTM.
- **Course**: A subject-level academic progress tracker (chapters, quizzes, DPP count, completion %).
- **AI_Session**: A conversation thread between a Student and the AI assistant.
- **Object_Storage**: An S3-compatible store for binary files (gallery images, homework attachments).

---

---

## Requirements

### Requirement 1: Application Bootstrap and Configuration

**User Story:** As a developer, I want the FastAPI application to start correctly with environment-driven configuration, so that I can deploy it in different environments without code changes.

#### Acceptance Criteria

1. THE API SHALL expose all routes under the `/api/v1/` URL prefix.
2. THE API SHALL read database connection strings, JWT secrets, CORS origins, and object storage credentials exclusively from environment variables or a `.env` file, with no hardcoded secrets.
3. WHEN the API starts, THE API SHALL configure CORS to allow requests from the configured frontend origin, permitting at minimum `GET`, `POST`, `PUT`, `PATCH`, `DELETE` methods and `Authorization`, `Content-Type` headers.
4. THE API SHALL return RFC 7807-compliant JSON error bodies for all 4xx and 5xx responses, including at minimum the fields `type`, `title`, `status`, and `detail`.
5. WHEN the API receives `GET /api/v1/health`, THE API SHALL return `200 OK` with a JSON object containing at minimum `{ "status": "ok", "version": "<app_version>" }`.
6. IF a required environment variable (e.g. `DATABASE_URL`, `JWT_SECRET`) is absent at startup, THEN THE API SHALL fail to start and log a descriptive error identifying the missing variable.

---

### Requirement 2: Database Schema and Migrations

**User Story:** As a developer, I want a fully normalised PostgreSQL schema with managed migrations, so that the database evolves safely alongside the codebase.

#### Acceptance Criteria

1. THE Migration_Tool SHALL manage all schema changes through versioned migration files; no DDL is applied outside Alembic.
2. THE ORM SHALL define models for all nineteen domains: users, students, teachers, parents, classes, grades, subjects, teacher_class_subject assignments, attendance_records, homework_assignments, homework_resources, leave_requests, fee_records, fee_transactions, circulars, circular_visibility, messages, message_threads, timetable_slots, reports, transport_routes, transport_stops, student_transport_assignments, library_books, library_records, achievements, gallery_albums, gallery_photos, calendar_events, and ai_sessions.
3. THE ORM SHALL enforce referential integrity through foreign-key constraints on all parent-child relationships described in the design overview.
4. THE ORM SHALL store all timestamps in UTC using `TIMESTAMP WITH TIME ZONE` columns.
5. WHEN a migration is run, THE Migration_Tool SHALL apply changes to the target database without data loss for non-destructive operations.

---

### Requirement 3: Authentication

**User Story:** As any user, I want to log in with my email and password and receive a token, so that I can securely access my personalised data.

#### Acceptance Criteria

1. WHEN a client sends `POST /api/v1/auth/login` with a valid email and password, THE Auth_Service SHALL return a `200 OK` response containing `access_token`, `refresh_token`, and a `user` object with `id`, `role`, `name`, and `email`.
2. WHEN a client sends `POST /api/v1/auth/login` with an unrecognised email or incorrect password, THE Auth_Service SHALL return a `401 Unauthorized` response.
3. THE Auth_Service SHALL hash all stored passwords using bcrypt before persisting them to the database.
4. THE Auth_Service SHALL sign Access_Tokens with a configurable secret, setting expiry to 15 minutes.
5. THE Auth_Service SHALL sign Refresh_Tokens with a configurable secret, setting expiry to 7 days.
6. WHEN a client sends `POST /api/v1/auth/refresh` with a valid, unexpired Refresh_Token, THE Auth_Service SHALL return a new Access_Token.
7. WHEN a client sends `POST /api/v1/auth/refresh` with an expired or malformed Refresh_Token, THE Auth_Service SHALL return a `401 Unauthorized` response.
8. WHEN a client sends `POST /api/v1/auth/logout` with a valid Access_Token, THE Auth_Service SHALL invalidate the associated Refresh_Token so it cannot be reused.
9. WHEN a protected route receives a request without an `Authorization: Bearer` header, THE API SHALL return `401 Unauthorized`.
10. WHEN a protected route receives a request with an expired or malformed Access_Token, THE API SHALL return `401 Unauthorized`.

---

### Requirement 4: Role-Based Access Control

**User Story:** As a school administrator, I want API endpoints to enforce role permissions, so that users can only access data they are authorised to see or modify.

#### Acceptance Criteria

1. THE API SHALL enforce RBAC on every non-authentication endpoint using a dependency injected from the decoded Access_Token.
2. WHEN a Student accesses an endpoint restricted to Teacher or Admin roles, THE API SHALL return `403 Forbidden`.
3. WHEN a Teacher accesses another Teacher's private data (e.g. a different teacher's private messages), THE API SHALL return `403 Forbidden`.
4. WHEN a Parent requests a Student's data that is not linked to that Parent, THE API SHALL return `403 Forbidden`.
5. THE API SHALL allow Admin role access to all domain endpoints unless explicitly restricted by the design.
6. THE API SHALL allow Student role access only to their own attendance, homework, reports, fees, leave requests, library records, achievements, transport assignment, timetable, messages, circulars, gallery, calendar, courses, and AI session data.
7. THE API SHALL allow Parent role access only to data belonging to Students linked to that Parent, plus messages and circulars addressed to the parent role.
8. THE API SHALL allow Teacher role access to class roster, subject data, homework management, attendance marking, timetable for their classes, messages, and circulars.

---

### Requirement 5: Student Profile

**User Story:** As a student, I want to retrieve my profile and summary data, so that the dashboard can display my personal information and academic snapshot.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/students/me`, THE API SHALL return a `200 OK` response containing `id`, `name`, `grade`, `rollNo`, `admissionNo`, `dob`, `bloodGroup`, `address`, `email`, `phone`, `house`, `photo`, `attendancePct`, `cgpa`, and `daysLeft` fields.
2. WHEN a Teacher or Admin sends `GET /api/v1/students/{student_id}`, THE API SHALL return the same student profile for the requested Student.
3. WHEN a Parent sends `GET /api/v1/students/{student_id}` for a linked Student, THE API SHALL return the student profile.
4. THE API SHALL include a `parent` sub-object containing `name`, `relation`, `email`, `phone`, `occupation`, and `verified` fields in the student profile response.
5. IF no student record is found for the requested `student_id`, THEN THE API SHALL return `404 Not Found`.

---

### Requirement 6: Courses and Academic Progress

**User Story:** As a student, I want to view my subject-wise academic progress, so that I can track chapter completion, quiz count, and DPP progress per subject.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/courses/me`, THE API SHALL return a list of Course objects each containing `id`, `name`, `chapters`, `quizzes`, `dpp`, `progress` (integer 0–100), `color`, and `icon`.
2. WHEN a Student sends `GET /api/v1/courses/{course_id}`, THE API SHALL return the Course object for the requested subject.
3. IF a course is requested that does not belong to the requesting Student's class, THEN THE API SHALL return `404 Not Found`.
4. WHEN a Teacher sends `GET /api/v1/courses?class_id={id}`, THE API SHALL return all courses for that Class with class-wide averages included.

---

### Requirement 7: Attendance

**User Story:** As a student or parent, I want to view attendance records and summaries, so that I can monitor my attendance percentage, streak, and monthly trends.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/attendance/me`, THE API SHALL return an object containing `present`, `absent`, `leave`, `total`, `streak`, a `monthly` array of `{ month, pct }` objects for the last 6 months, and a `recent` array of `{ date, status }` objects for the last 30 days.
2. WHEN a Parent sends `GET /api/v1/attendance/{student_id}`, THE API SHALL return the same attendance summary for the linked Student.
3. WHEN a Teacher sends `POST /api/v1/attendance`, THE API SHALL create one or more Attendance_Records for their Class on the given date and return `201 Created`.
4. WHEN a Teacher sends `GET /api/v1/attendance?class_id={id}&date={date}`, THE API SHALL return the attendance list for that Class on that date.
5. IF a Teacher attempts to submit attendance for a Class they are not assigned to, THEN THE API SHALL return `403 Forbidden`.
6. IF duplicate attendance records are submitted for the same Student on the same date, THEN THE API SHALL return `409 Conflict`.

---

### Requirement 8: Homework

**User Story:** As a student, I want to view my homework assignments with due dates and status, so that I can manage my workload; as a teacher, I want to create and manage assignments for my classes.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/homework/me`, THE API SHALL return a list of Homework_Assignment objects each containing `id`, `subject`, `title`, `assigned`, `due`, `status` (`pending`, `submitted`, `graded`, `overdue`), `grade` (if graded), and `resources` (count of attached files).
2. WHEN a Teacher sends `POST /api/v1/homework` with `title`, `subject_id`, `class_id`, and `due_date`, THE API SHALL create the Homework_Assignment, return `201 Created` with the created object.
3. WHEN a Teacher sends `PUT /api/v1/homework/{id}`, THE API SHALL update the assignment fields and return `200 OK`.
4. WHEN a Teacher sends `DELETE /api/v1/homework/{id}`, THE API SHALL soft-delete the assignment and return `204 No Content`.
5. IF a Teacher attempts to modify a Homework_Assignment they did not create, THEN THE API SHALL return `403 Forbidden`.
6. WHEN a Student sends `POST /api/v1/homework/{id}/submit`, THE API SHALL update the assignment status to `submitted` and return `200 OK`.
7. WHEN a Teacher sends `POST /api/v1/homework/{id}/grade` with a `grade` value, THE API SHALL update the assignment status to `graded`, record the grade, and return `200 OK`.
8. WHEN a Parent sends `GET /api/v1/homework/{student_id}`, THE API SHALL return the homework list for the linked Student.

---

### Requirement 9: Leave Requests

**User Story:** As a student, I want to submit leave requests and track their status, so that I can manage planned absences and see approval decisions.

#### Acceptance Criteria

1. WHEN a Student sends `POST /api/v1/leaves` with `from_date`, `to_date`, and `reason`, THE API SHALL create a Leave_Request with status `pending` and return `201 Created`.
2. WHEN a Student sends `GET /api/v1/leaves/me`, THE API SHALL return a list of Leave_Request objects each containing `id`, `from`, `to`, `reason`, `status` (`pending`, `approved`, `rejected`), and `appliedOn`.
3. WHEN a Teacher or Admin sends `PUT /api/v1/leaves/{id}/approve`, THE API SHALL update the Leave_Request status to `approved` and return `200 OK`.
4. WHEN a Teacher or Admin sends `PUT /api/v1/leaves/{id}/reject`, THE API SHALL update the Leave_Request status to `rejected` and return `200 OK`.
5. IF a Student attempts to cancel a Leave_Request that has already been approved or rejected, THEN THE API SHALL return `409 Conflict`.
6. WHEN a Teacher sends `GET /api/v1/leaves?class_id={id}`, THE API SHALL return all Leave_Requests for Students in that Class.

---

### Requirement 10: Reports and Marks

**User Story:** As a student or parent, I want to view term-wise report cards with subject marks, grades, and teacher remarks, so that I can track academic performance over time.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/reports/me`, THE API SHALL return an object containing `overallGrade`, `cgpa`, `rank`, `totalStudents`, a `subjects` array (each with `name`, `marks`, `grade`, `remark`), a `trend` array of `{ term, cgpa }` objects, and a `remarks` object with `positive` and `constructive` string arrays.
2. WHEN a Parent sends `GET /api/v1/reports/{student_id}`, THE API SHALL return the same report for the linked Student.
3. WHEN a Teacher or Admin sends `POST /api/v1/reports` with student, subject, term, marks, grade, and remark fields, THE API SHALL create the Report record and return `201 Created`.
4. WHEN a Teacher sends `PUT /api/v1/reports/{id}`, THE API SHALL update the Report record and return `200 OK`.
5. IF a Student requests a report for a term that does not exist, THEN THE API SHALL return `404 Not Found`.
6. WHEN an Admin sends `GET /api/v1/reports?class_id={id}&term={term}`, THE API SHALL return aggregated class-level report data including average CGPA and per-subject averages.

---

### Requirement 11: Fees

**User Story:** As a student or parent, I want to view fee structure, payment status, and transaction history, so that I can track outstanding dues and payment records.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/fees/me`, THE API SHALL return an object containing `totalAnnual`, `paid`, `due`, `nextDueDate`, a `structure` array of `{ label, amount }` objects, and a `transactions` array of `{ id, date, label, amount, method, status }` objects.
2. WHEN a Parent sends `GET /api/v1/fees/{student_id}`, THE API SHALL return the same fee summary for the linked Student.
3. WHEN an Admin sends `POST /api/v1/fees/transactions` with `student_id`, `amount`, `label`, and `method`, THE API SHALL create a Fee_Transaction record with status `success` and return `201 Created`.
4. THE API SHALL compute `paid`, `due`, and `nextDueDate` dynamically from the Fee_Record and Fee_Transaction data rather than storing them as static fields.
5. IF the `student_id` in a fee request is not linked to the requesting Parent, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 12: Timetable

**User Story:** As a student or teacher, I want to view the class weekly timetable, so that I can see subject periods across all days of the week.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/timetable/me`, THE API SHALL return an object containing a `days` array and a `periods` array, where each period has a `time` string and a `slots` array of subject names corresponding to each day.
2. WHEN a Teacher sends `GET /api/v1/timetable?class_id={id}`, THE API SHALL return the timetable for that Class.
3. WHEN an Admin sends `POST /api/v1/timetable`, THE API SHALL create one or more Timetable_Slot records and return `201 Created`.
4. WHEN an Admin sends `PUT /api/v1/timetable/{slot_id}`, THE API SHALL update the Timetable_Slot and return `200 OK`.
5. IF a Timetable_Slot creation would cause a scheduling conflict (same class, same day, same period), THEN THE API SHALL return `409 Conflict`.

---

### Requirement 13: Calendar and Events

**User Story:** As any user, I want to view upcoming school events, holidays, and exams, so that I can plan ahead for important dates.

#### Acceptance Criteria

1. WHEN any authenticated user sends `GET /api/v1/calendar`, THE API SHALL return a list of Calendar_Event objects each containing `id`, `title`, `date`, and `type` (e.g. `Holiday`, `Exam`, `Event`, `Meeting`).
2. WHEN an Admin sends `POST /api/v1/calendar` with `title`, `date`, and `type`, THE API SHALL create the Calendar_Event and return `201 Created`.
3. WHEN an Admin sends `PUT /api/v1/calendar/{id}`, THE API SHALL update the Calendar_Event and return `200 OK`.
4. WHEN an Admin sends `DELETE /api/v1/calendar/{id}`, THE API SHALL delete the Calendar_Event and return `204 No Content`.
5. IF a non-Admin user attempts to create, update, or delete a Calendar_Event, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 14: Circulars

**User Story:** As a student, teacher, or parent, I want to read school circulars and notices, so that I stay informed about school events and policy updates; as an admin or teacher, I want to post circulars targeted at specific roles.

#### Acceptance Criteria

1. WHEN any authenticated user sends `GET /api/v1/circulars`, THE API SHALL return only Circulars visible to that user's Role, each containing `id`, `title`, `category`, `date`, `pinned`, and `excerpt`.
2. WHEN an Admin or Teacher sends `POST /api/v1/circulars` with `title`, `category`, `excerpt`, `pinned`, and a `visible_to` array of roles, THE API SHALL create the Circular and return `201 Created`.
3. WHEN an Admin sends `PUT /api/v1/circulars/{id}`, THE API SHALL update the Circular and return `200 OK`.
4. WHEN an Admin sends `DELETE /api/v1/circulars/{id}`, THE API SHALL soft-delete the Circular and return `204 No Content`.
5. THE API SHALL return pinned Circulars before non-pinned Circulars in the response list, with both groups sorted by date descending.
6. IF a Student or Parent attempts to create a Circular, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 15: Messages

**User Story:** As any user, I want to send and receive messages in conversation threads, so that students, parents, teachers, and administrators can communicate directly within the portal.

#### Acceptance Criteria

1. WHEN any authenticated user sends `GET /api/v1/messages`, THE API SHALL return a list of message thread previews each containing `id`, `from` (sender name), `role` (sender role label), `subject`, `preview`, `time`, `unread`, and `avatar` initials.
2. WHEN any authenticated user sends `GET /api/v1/messages/{thread_id}`, THE API SHALL return the full message thread with all individual messages.
3. WHEN any authenticated user sends `POST /api/v1/messages` with `to_user_id`, `subject`, and `body`, THE API SHALL create a new Message thread and return `201 Created`.
4. WHEN any authenticated user sends `POST /api/v1/messages/{thread_id}/reply` with `body`, THE API SHALL append the reply to the thread and return `201 Created`.
5. WHEN a user reads a thread, THE API SHALL mark all messages in that thread as read for that user and return `200 OK` on `PUT /api/v1/messages/{thread_id}/read`.
6. IF a user attempts to access a message thread they are not a participant in, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 16: Transport

**User Story:** As a student or parent, I want to view transport route details, bus location, ETA, and driver contact, so that I know when the bus will arrive.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/transport/me`, THE API SHALL return an object containing `routeNo`, `driver`, `driverPhone`, `vehicle`, `attendant`, `status` (`en-route`, `at-school`, `idle`), `eta`, `lat`, `lng`, and a `stops` array of `{ name, time, passed }` objects.
2. WHEN a Parent sends `GET /api/v1/transport/{student_id}`, THE API SHALL return the same transport data for the linked Student.
3. WHEN an Admin sends `POST /api/v1/transport/routes`, THE API SHALL create a Transport_Route with its stops and return `201 Created`.
4. WHEN an Admin sends `POST /api/v1/transport/routes/{route_id}/assign` with a `student_id`, THE API SHALL create a student transport assignment and return `201 Created`.
5. IF a Student is not assigned to any transport route, THEN THE API SHALL return `404 Not Found` with a descriptive message.

---

### Requirement 17: Library

**User Story:** As a student, I want to view my currently issued books, overdue books with fines, and reading history, so that I can manage my library obligations.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/library/me`, THE API SHALL return an object containing an `issued` array of `{ id, title, author, issued, due }` objects, an `overdue` array of `{ id, title, author, issued, due, fine }` objects, and a `history` array of `{ id, title, author, issued, returned }` objects.
2. WHEN an Admin or Teacher sends `POST /api/v1/library/issue` with `student_id` and `book_id`, THE API SHALL create an active Library_Record and return `201 Created`.
3. WHEN an Admin or Teacher sends `POST /api/v1/library/return` with `record_id`, THE API SHALL mark the Library_Record as returned, calculate any fine, and return `200 OK`.
4. THE API SHALL compute overdue fines dynamically based on the number of days past the due date and a configurable daily fine rate.
5. IF a book is requested that does not exist in the catalogue, THEN THE API SHALL return `404 Not Found`.

---

### Requirement 18: Achievements

**User Story:** As a student, I want to view my awards and recognitions, so that I can see all my academic and extracurricular accomplishments in one place.

#### Acceptance Criteria

1. WHEN a Student sends `GET /api/v1/achievements/me`, THE API SHALL return a list of Achievement objects each containing `id`, `title`, `date`, and `category`.
2. WHEN an Admin or Teacher sends `POST /api/v1/achievements` with `student_id`, `title`, `date`, and `category`, THE API SHALL create the Achievement and return `201 Created`.
3. WHEN an Admin sends `DELETE /api/v1/achievements/{id}`, THE API SHALL delete the Achievement and return `204 No Content`.
4. IF a Student or Parent attempts to create or delete an Achievement, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 19: Gallery

**User Story:** As any user, I want to browse school event photo albums, so that I can view photos from school activities and events.

#### Acceptance Criteria

1. WHEN any authenticated user sends `GET /api/v1/gallery`, THE API SHALL return a list of Gallery_Album objects each containing `id`, `title`, `count`, and `cover` (a pre-signed URL or public URL for the cover image).
2. WHEN any authenticated user sends `GET /api/v1/gallery/{album_id}`, THE API SHALL return the Gallery_Album with a `photos` array of photo URLs.
3. WHEN an Admin sends `POST /api/v1/gallery/albums` with `title`, THE API SHALL create a new Gallery_Album and return `201 Created`.
4. WHEN an Admin sends `POST /api/v1/gallery/albums/{album_id}/photos` with an image file upload, THE API SHALL store the file in Object_Storage, record the URL in the database, and return `201 Created`.
5. IF a non-Admin user attempts to create an album or upload photos, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 20: AI Assistant

**User Story:** As a student, I want to send questions to an AI assistant and receive contextual academic help, so that I can get explanations and practice recommendations without leaving the portal.

#### Acceptance Criteria

1. WHEN a Student sends `POST /api/v1/ai/chat` with a `message` string, THE API SHALL forward the message to the configured AI provider, persist the exchange in an AI_Session, and return `200 OK` with the assistant's `response` text.
2. WHEN a Student sends `GET /api/v1/ai/chat/history`, THE API SHALL return the list of prior messages in the current AI_Session ordered chronologically, each with `id`, `role` (`user` or `assistant`), and `text`.
3. IF the AI provider returns an error or times out, THEN THE API SHALL return `502 Bad Gateway` with a descriptive error message.
4. IF a non-Student user attempts to access AI chat endpoints, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 21: Teacher — Class Roster and Subject Overview

**User Story:** As a teacher, I want to view my class roster with per-student performance indicators and subject-level class averages, so that I can identify students who need attention and track class-wide progress.

#### Acceptance Criteria

1. WHEN a Teacher sends `GET /api/v1/teachers/me/class`, THE API SHALL return a list of Student summaries for all Students in the Teacher's assigned Class, each containing `id`, `name`, `rollNo`, `attendancePct`, `cgpa`, `trend` (`improving`, `stable`, `declining`), and `performanceStatus` (`Excellent`, `Good`, `Average`, `Needs Attention`).
2. WHEN a Teacher sends `GET /api/v1/teachers/me/subjects`, THE API SHALL return a list of Subject objects assigned to that Teacher, each containing `id`, `name`, `classAverage`, `periodsPerWeek`, and `performanceClassification` (`Excellent`, `Good`, `Average`).
3. THE API SHALL support filtering the class roster by `performanceStatus` via a query parameter `?status=`.
4. THE API SHALL support searching the class roster by student name or roll number via a query parameter `?search=`.
5. IF a Teacher is not assigned to any class, THEN THE API SHALL return an empty list with `200 OK`.

---

### Requirement 22: Admin — Class Overview

**User Story:** As a school admin, I want to view a summary of all classes with performance metrics, so that I can monitor school-wide academic health.

#### Acceptance Criteria

1. WHEN an Admin sends `GET /api/v1/admin/classes`, THE API SHALL return a list of Class summaries each containing `id`, `name`, `avgCgpa`, `avgAttendancePct`, and `studentsNeedingAttention` count.
2. WHEN an Admin sends `GET /api/v1/admin/classes/{class_id}/students`, THE API SHALL return the full student list for that Class with individual performance data.
3. IF a non-Admin user accesses the admin class overview endpoints, THEN THE API SHALL return `403 Forbidden`.

---

### Requirement 23: Pydantic Schemas and Request/Response Contracts

**User Story:** As a frontend developer, I want all API request and response bodies to be validated and documented, so that integration with TanStack Query hooks is reliable and self-documenting.

#### Acceptance Criteria

1. THE API SHALL validate every incoming request body against the corresponding Pydantic_Schema, returning `422 Unprocessable Entity` with field-level error details when validation fails.
2. THE API SHALL serialise every response body using the corresponding Pydantic_Schema, ensuring no ORM model internals or passwords are exposed.
3. THE API SHALL generate an OpenAPI specification accessible at `/api/v1/docs` (Swagger UI) and `/api/v1/openapi.json`.
4. THE API SHALL use Pydantic v2 `model_config = ConfigDict(from_attributes=True)` on all response schemas to enable ORM-mode serialisation.
5. WHEN a request body contains fields not defined in the Pydantic_Schema, THE API SHALL ignore those fields without raising an error.

---

### Requirement 24: Frontend Integration Contract

**User Story:** As a frontend developer, I want the backend to maintain stable API contracts with the existing React/TanStack UI, so that only the data layer changes and no UI restructuring is required.

#### Acceptance Criteria

1. THE API SHALL return response shapes that are structurally identical to the corresponding objects exported from `src/lib/mock-data.ts`, ensuring no TanStack Query hook or UI component requires structural changes.
2. THE API SHALL prefix all routes with `/api/v1/` so the existing Vite/Nitro proxy rule (`/api/* → localhost:8000`) routes requests correctly without changes to the frontend proxy configuration.
3. THE API SHALL respond to all data-fetch endpoints within 500 ms under normal single-user load to maintain the perceived responsiveness of the existing mock-data experience.
4. WHEN the frontend sends a request with an expired Access_Token, THE API SHALL return `401 Unauthorized` so TanStack Query can trigger a token refresh and retry.
