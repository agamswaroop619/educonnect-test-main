"""
Seed script — populates the database with sample data for all 19 domains.

Usage (from backend/ directory):
    python seed.py

Requires DATABASE_URL in .env
"""

import asyncio
import uuid
from datetime import date, datetime, time as dt_time, timedelta, timezone

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models import (
    AIMessage, AISession, AcademicYear, Achievement, Admin, AttendanceRecord,
    CircularVisibility, Class, Circular, Enrollment, Event, FeeStructure,
    FeeTransaction, GalleryAlbum, GalleryPhoto, Grade, Homework, HomeworkResource,
    LeaveRequest, LibraryBook, LibraryIssue, Message, Notification,
    Parent, RouteStop, School, Student, StudentParent,
    StudentTransport, Subject, SubjectProgress, Teacher,
    TeachingAssignment, Term, TimetableSlot, TransportLive, TransportRoute, User,
)
from app.services.auth_service import hash_password

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSession = async_sessionmaker(engine, expire_on_commit=False)


async def seed():
    async with AsyncSession() as db:

        # ── 1. School ────────────────────────────────────────────────────
        school = School(
            id=uuid.uuid4(),
            name="Scholarly International School",
            address="123 Education Lane, Mumbai 400001",
            contact_email="admin@scholarly.edu",
            contact_phone="+91-22-12345678",
        )
        db.add(school)
        await db.flush()

        # ── 2. Academic year ─────────────────────────────────────────────
        ay = AcademicYear(
            id=uuid.uuid4(),
            school_id=school.id,
            label="2025-26",
            start_date=date(2025, 6, 1),
            end_date=date(2026, 3, 31),
            is_current=True,
        )
        db.add(ay)
        await db.flush()

        # ── 3. Terms ─────────────────────────────────────────────────────
        t1 = Term(id=uuid.uuid4(), academic_year_id=ay.id, label="T1",
                  start_date=date(2025, 6, 1), end_date=date(2025, 9, 30))
        t2 = Term(id=uuid.uuid4(), academic_year_id=ay.id, label="T2",
                  start_date=date(2025, 10, 1), end_date=date(2025, 12, 31))
        t3 = Term(id=uuid.uuid4(), academic_year_id=ay.id, label="T3",
                  start_date=date(2026, 1, 1), end_date=date(2026, 3, 31))
        db.add_all([t1, t2, t3])
        await db.flush()

        # ── 4. Users ─────────────────────────────────────────────────────
        pw = hash_password("password123")
        u_student = User(id=uuid.uuid4(), email="student@scholarly.edu",
                         password_hash=pw, role="student")
        u_teacher = User(id=uuid.uuid4(), email="teacher@scholarly.edu",
                         password_hash=pw, role="teacher")
        u_parent  = User(id=uuid.uuid4(), email="parent@scholarly.edu",
                         password_hash=pw, role="parent")
        u_admin   = User(id=uuid.uuid4(), email="admin@scholarly.edu",
                         password_hash=pw, role="school_admin")
        db.add_all([u_student, u_teacher, u_parent, u_admin])
        await db.flush()

        # ── 5. Teacher profile ───────────────────────────────────────────
        teacher = Teacher(
            id=uuid.uuid4(), user_id=u_teacher.id, school_id=school.id,
            employee_id="T001", designation="Senior Teacher", department="Science",
        )
        db.add(teacher)
        await db.flush()

        # ── 6. Class (needs teacher.id) ───────────────────────────────────
        cls = Class(
            id=uuid.uuid4(), school_id=school.id, academic_year_id=ay.id,
            grade=10, section="A", name="Class 10-A", class_teacher_id=teacher.id,
        )
        db.add(cls)
        await db.flush()

        # ── 7. Student + Parent + Admin profiles ──────────────────────────
        student = Student(
            id=uuid.uuid4(), user_id=u_student.id, school_id=school.id,
            admission_no="ADM2025001", roll_no="10A01", class_id=cls.id,
            dob=date(2010, 5, 15), blood_group="O+", house="Blue",
            address="45 Student Street, Mumbai",
        )
        parent = Parent(id=uuid.uuid4(), user_id=u_parent.id,
                        occupation="Engineer", verified=True)
        admin  = Admin(id=uuid.uuid4(), user_id=u_admin.id,
                       school_id=school.id, title="Principal")
        db.add_all([student, parent, admin])
        await db.flush()

        # Student–parent link
        db.add(StudentParent(student_id=student.id, parent_id=parent.id,
                             relation="Father"))

        # ── 8. Subjects ───────────────────────────────────────────────────
        subj_data = [
            ("Mathematics",     "MATH", "#3B82F6", "calculator"),
            ("Science",         "SCI",  "#10B981", "flask"),
            ("English",         "ENG",  "#8B5CF6", "book"),
            ("History",         "HIST", "#F59E0B", "landmark"),
            ("Computer Science","CS",   "#EC4899", "monitor"),
        ]
        subjects = []
        for name, code, color, icon in subj_data:
            s = Subject(id=uuid.uuid4(), school_id=school.id,
                        name=name, code=code, color_hex=color, icon=icon)
            subjects.append(s)
            db.add(s)
        await db.flush()

        # ── 9. Enrollment + teaching assignments ──────────────────────────
        db.add(Enrollment(id=uuid.uuid4(), student_id=student.id,
                          class_id=cls.id, academic_year_id=ay.id))
        for s in subjects:
            db.add(TeachingAssignment(id=uuid.uuid4(), teacher_id=teacher.id,
                                      subject_id=s.id, class_id=cls.id,
                                      academic_year_id=ay.id))
        await db.flush()

        # ── 10. Attendance (last 30 school days) ──────────────────────────
        today = date.today()
        for i in range(30):
            d = today - timedelta(days=i)
            if d.weekday() < 6:
                db.add(AttendanceRecord(
                    id=uuid.uuid4(), student_id=student.id, class_id=cls.id,
                    date=d, status="present" if i % 7 != 0 else "absent",
                    marked_by=teacher.id, marked_at=datetime.now(timezone.utc),
                ))
        await db.flush()

        # ── 11. Homework ──────────────────────────────────────────────────
        hw = Homework(
            id=uuid.uuid4(), class_id=cls.id, subject_id=subjects[0].id,
            teacher_id=teacher.id, title="Chapter 5 Problems",
            description="Solve problems 1-20 from chapter 5.",
            assigned_date=today - timedelta(days=3),
            due_date=today + timedelta(days=4), max_marks=20,
        )
        db.add(hw)
        await db.flush()
        db.add(HomeworkResource(
            id=uuid.uuid4(), homework_id=hw.id,
            file_url="https://example.com/ch5.pdf",
            file_name="chapter5.pdf", file_size=204800,
        ))

        # ── 12. Grades (T1) ───────────────────────────────────────────────
        for s in subjects:
            db.add(Grade(
                id=uuid.uuid4(), student_id=student.id, subject_id=s.id,
                term_id=t1.id, marks_obtained=82.0, max_marks=100.0,
                grade_letter="A", remarks="Good performance.", teacher_id=teacher.id,
            ))

        # ── 13. Subject progress ──────────────────────────────────────────
        for s in subjects:
            db.add(SubjectProgress(
                id=uuid.uuid4(), student_id=student.id, subject_id=s.id,
                academic_year_id=ay.id,
                chapters_completed=6, total_chapters=10,
                quizzes_done=3, dpp_done=15,
            ))

        # ── 14. Fees ──────────────────────────────────────────────────────
        for label, amt, cat, due in [
            ("Tuition Fee",    45000, "tuition",     date(2025, 7, 15)),
            ("Development Fee", 5000, "development", date(2025, 7, 15)),
            ("Lab Fee",         3000, "lab",         date(2025, 8,  1)),
            ("Exam Fee",        2000, "exam",        date(2025, 9,  1)),
        ]:
            db.add(FeeStructure(id=uuid.uuid4(), class_id=cls.id,
                                academic_year_id=ay.id, label=label,
                                amount=amt, category=cat, due_date=due))
        db.add(FeeTransaction(
            id=uuid.uuid4(), student_id=student.id, label="Q1 Fees",
            amount=30000, payment_method="online", status="success",
            reference_id="TXN20250615001",
            paid_at=datetime(2025, 6, 15, tzinfo=timezone.utc),
        ))

        # ── 15. Timetable ─────────────────────────────────────────────────
        period_times = [
            (dt_time(8,  0), dt_time(8, 45)),
            (dt_time(8, 50), dt_time(9, 35)),
            (dt_time(9, 40), dt_time(10, 25)),
            (dt_time(10, 45), dt_time(11, 30)),
            (dt_time(11, 35), dt_time(12, 20)),
        ]
        for day in range(6):
            for period, (start, end) in enumerate(period_times, start=1):
                db.add(TimetableSlot(
                    id=uuid.uuid4(), class_id=cls.id,
                    subject_id=subjects[period % len(subjects)].id,
                    teacher_id=teacher.id, day_of_week=day, period_no=period,
                    start_time=start, end_time=end, academic_year_id=ay.id,
                ))

        # ── 16. Calendar events ───────────────────────────────────────────
        for title, edate, etype in [
            ("Summer Holidays",        date(2025, 6,  1), "Holiday"),
            ("Mid-Term Exams",         date(2025, 8, 15), "Exam"),
            ("Annual Sports Day",      date(2025, 9, 20), "Event"),
            ("Parent-Teacher Meeting", date(2025, 9, 28), "PTM"),
        ]:
            db.add(Event(id=uuid.uuid4(), school_id=school.id, title=title,
                         event_date=edate, event_type=etype))

        # ── 17. Leave request ─────────────────────────────────────────────
        db.add(LeaveRequest(
            id=uuid.uuid4(), student_id=student.id,
            from_date=today + timedelta(days=5),
            to_date=today + timedelta(days=7),
            reason="Family wedding",
        ))

        # ── 18. Circulars ─────────────────────────────────────────────────
        circ = Circular(
            id=uuid.uuid4(), school_id=school.id, author_id=u_admin.id,
            title="School Re-Opening Notice",
            body="School will re-open on June 10th for all students.",
            category="Academic", excerpt="School re-opens June 10th.", pinned=True,
        )
        db.add(circ)
        await db.flush()
        for role in ["student", "parent", "teacher", "school_admin"]:
            db.add(CircularVisibility(id=uuid.uuid4(),
                                      circular_id=circ.id, role=role))

        # ── 19. Messages ──────────────────────────────────────────────────
        db.add(Message(
            id=uuid.uuid4(), sender_id=u_teacher.id, recipient_id=u_student.id,
            subject="Homework reminder",
            body="Please submit Chapter 5 problems by Friday.",
        ))

        # ── 20. Transport ─────────────────────────────────────────────────
        route = TransportRoute(
            id=uuid.uuid4(), school_id=school.id, route_no="BUS-01",
            driver_name="Ramesh Kumar", driver_phone="+91-9876543210",
            vehicle_no="MH-01-AB-1234", attendant_name="Suresh Pal",
        )
        db.add(route)
        await db.flush()

        stops = []
        for i, sname in enumerate(["Main Gate", "Park Colony",
                                   "City Centre", "Railway Station"]):
            stop = RouteStop(id=uuid.uuid4(), route_id=route.id,
                             stop_name=sname, stop_order=i + 1,
                             scheduled_time=dt_time(7, 15 + i * 5))
            stops.append(stop)
            db.add(stop)
        await db.flush()

        db.add(StudentTransport(id=uuid.uuid4(), student_id=student.id,
                                 route_id=route.id, stop_id=stops[1].id,
                                 academic_year_id=ay.id))
        db.add(TransportLive(id=uuid.uuid4(), route_id=route.id,
                             lat=19.0760, lng=72.8777,
                             eta_minutes=12, status="en-route"))

        # ── 21. Library ───────────────────────────────────────────────────
        book = LibraryBook(
            id=uuid.uuid4(), school_id=school.id,
            title="Mathematics Textbook Grade 10", author="R.D. Sharma",
            isbn="978-81-xxx-0001", category="Textbook",
            total_copies=5, available_copies=4,
        )
        db.add(book)
        await db.flush()
        db.add(LibraryIssue(
            id=uuid.uuid4(), book_id=book.id, student_id=student.id,
            issued_date=today - timedelta(days=10),
            due_date=today + timedelta(days=4),
        ))

        # ── 22. Achievements ──────────────────────────────────────────────
        db.add(Achievement(
            id=uuid.uuid4(), student_id=student.id,
            title="First Prize — Inter-School Mathematics Olympiad",
            category="Academic", awarded_date=date(2025, 3, 15),
        ))

        # ── 23. Gallery ───────────────────────────────────────────────────
        album = GalleryAlbum(
            id=uuid.uuid4(), school_id=school.id,
            title="Annual Sports Day 2025",
            cover_url="https://example.com/sports-cover.jpg",
        )
        db.add(album)
        await db.flush()
        for i in range(3):
            db.add(GalleryPhoto(
                id=uuid.uuid4(), album_id=album.id,
                photo_url=f"https://example.com/sports-{i+1}.jpg",
                caption=f"Sports Day photo {i+1}", uploaded_by=u_admin.id,
            ))

        # ── 24. Notifications ─────────────────────────────────────────────
        db.add(Notification(
            id=uuid.uuid4(), user_id=u_student.id, type="homework",
            title="New Homework Assigned",
            body="Chapter 5 Problems assigned by Mathematics teacher.",
            action_url="/homework",
        ))

        # ── 25. AI session ────────────────────────────────────────────────
        ai_session = AISession(id=uuid.uuid4(), student_id=student.id)
        db.add(ai_session)
        await db.flush()
        db.add(AIMessage(id=uuid.uuid4(), session_id=ai_session.id,
                         role="user", text="Explain the Pythagorean theorem."))
        db.add(AIMessage(id=uuid.uuid4(), session_id=ai_session.id,
                         role="assistant",
                         text="In a right triangle, a² + b² = c²."))

        # ── Commit everything ─────────────────────────────────────────────
        await db.commit()
        print("\n✅ Seed complete!")
        print("   student@scholarly.edu  / password123")
        print("   teacher@scholarly.edu  / password123")
        print("   parent@scholarly.edu   / password123")
        print("   admin@scholarly.edu    / password123")


if __name__ == "__main__":
    asyncio.run(seed())
