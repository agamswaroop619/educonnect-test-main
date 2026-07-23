"""
ORM model registry — import all models here so Alembic autogenerate can discover them.
"""

from app.models.base import Base, TimestampMixin, new_uuid  # noqa: F401
from app.models.auth import User, RefreshToken, UserRole  # noqa: F401
from app.models.school import (  # noqa: F401
    School, AcademicYear, Term, Class, Subject, Enrollment, TeachingAssignment
)
from app.models.people import Student, Teacher, Parent, Admin, StudentParent  # noqa: F401
from app.models.academics import (  # noqa: F401
    Homework, HomeworkResource, Submission, Grade, SubjectProgress, SubmissionStatus
)
from app.models.attendance import AttendanceRecord, AttendanceStatus  # noqa: F401
from app.models.finance import (  # noqa: F401
    FeeStructure, FeeTransaction, FeeCategory, PaymentMethod, TransactionStatus
)
from app.models.communication import (  # noqa: F401
    Message, Circular, CircularVisibility, Notification
)
from app.models.scheduling import (  # noqa: F401
    TimetableSlot, Event, LeaveRequest, EventType, LeaveStatus
)
from app.models.library import LibraryBook, LibraryIssue  # noqa: F401
from app.models.transport import (  # noqa: F401
    TransportRoute, RouteStop, StudentTransport, TransportLive
)
from app.models.content import (  # noqa: F401
    Achievement, GalleryAlbum, GalleryPhoto, AchievementCategory
)
from app.models.ai import AISession, AIMessage, AIRole  # noqa: F401
