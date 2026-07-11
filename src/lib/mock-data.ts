// Central mock data — consistent across all pages.

export const student = {
  id: "STU-1042",
  name: "Atam Swaroop",
  initials: "AS",
  grade: "Class 10 - Section B",
  rollNo: "23",
  admissionNo: "2019/145",
  dob: "12 Aug 2009",
  bloodGroup: "O+",
  address: "42, Rosewood Apartments, Sector 21, Noida",
  email: "atam.swaroop@school.edu",
  phone: "+91 98100 22331",
  house: "Sapphire",
  photo: "",
  daysLeft: 85,
  attendancePct: 92,
  cgpa: 8.7,
};

export const parent = {
  name: "Rajesh Swaroop",
  relation: "Father",
  email: "rajesh.swaroop@gmail.com",
  phone: "+91 98100 44112",
  occupation: "Architect",
  verified: true,
};

export type Subject = {
  id: string;
  name: string;
  chapters: number;
  quizzes: number;
  dpp?: number;
  progress: number;
  color: string;
  icon: string;
};

export const subjects: Subject[] = [
  { id: "math", name: "Maths", chapters: 12, quizzes: 13, dpp: 18, progress: 78, color: "#4f5eff", icon: "calculator" },
  { id: "bio", name: "Biology", chapters: 9, quizzes: 21, dpp: 12, progress: 65, color: "#22c55e", icon: "dna" },
  { id: "phy", name: "Physics", chapters: 10, quizzes: 15, dpp: 14, progress: 71, color: "#f97316", icon: "atom" },
  { id: "chem", name: "Chemistry", chapters: 11, quizzes: 17, dpp: 16, progress: 58, color: "#a855f7", icon: "flask-conical" },
  { id: "eng", name: "English", chapters: 8, quizzes: 9, dpp: 6, progress: 82, color: "#ec4899", icon: "book-open" },
  { id: "hist", name: "History", chapters: 7, quizzes: 8, progress: 60, color: "#0ea5e9", icon: "landmark" },
];

export const todaysTasks = [
  { id: 1, title: "DPP 13 - Maths", subject: "Maths", status: "pending" as const, due: "5:00 PM" },
  { id: 2, title: "DPP 9 - Physics", subject: "Physics", status: "pending" as const, due: "6:30 PM" },
  { id: 3, title: "Quiz 4 - Biology", subject: "Biology", status: "pending" as const, due: "8:00 PM" },
  { id: 4, title: "Quiz 3 - Biology", subject: "Biology", status: "overdue" as const, due: "Yesterday" },
  { id: 5, title: "DPP 12 - Chemistry", subject: "Chemistry", status: "overdue" as const, due: "Yesterday" },
  { id: 6, title: "Quiz 1 - Chemistry", subject: "Chemistry", status: "overdue" as const, due: "2 days ago" },
];

export const attendanceSummary = {
  present: 168,
  absent: 8,
  leave: 6,
  total: 182,
  streak: 14,
  monthly: [
    { month: "Jul", pct: 96 },
    { month: "Aug", pct: 93 },
    { month: "Sep", pct: 91 },
    { month: "Oct", pct: 89 },
    { month: "Nov", pct: 94 },
    { month: "Dec", pct: 92 },
  ],
  recent: [
    { date: "2026-07-10", status: "present" as const },
    { date: "2026-07-09", status: "present" as const },
    { date: "2026-07-08", status: "present" as const },
    { date: "2026-07-07", status: "leave" as const },
    { date: "2026-07-06", status: "present" as const },
    { date: "2026-07-05", status: "present" as const },
    { date: "2026-07-04", status: "absent" as const },
  ],
};

export const circulars = [
  { id: 1, title: "Annual Sports Day - Registrations Open", category: "Events", date: "2026-07-08", pinned: true, excerpt: "Register before 20 July for track & field events. Kits will be provided." },
  { id: 2, title: "Parent-Teacher Meeting Rescheduled", category: "Notice", date: "2026-07-05", pinned: false, excerpt: "PTM moved from 12 July to 19 July, 9AM-1PM in respective classrooms." },
  { id: 3, title: "Fee Reminder - Q2 Installment", category: "Finance", date: "2026-07-02", pinned: false, excerpt: "Second quarter fee due by 31 July. Pay via the Fees section to avoid late charges." },
  { id: 4, title: "Science Exhibition Winners", category: "Achievement", date: "2026-06-28", pinned: false, excerpt: "Congratulations to Class 10-B for winning first prize in the district-level science fair." },
  { id: 5, title: "Library - New Arrivals", category: "Library", date: "2026-06-25", pinned: false, excerpt: "50 new titles including AI & Robotics have been added to the school library." },
];

export const messages = [
  { id: 1, from: "Ms. Priya Nair", role: "Class Teacher", subject: "Maths", preview: "Atam has shown remarkable improvement in trigonometry this week.", time: "2h", unread: true, avatar: "PN" },
  { id: 2, from: "Mr. Arun Verma", role: "Physics Teacher", subject: "Physics", preview: "Please ensure Chapter 7 is revised before Monday's class test.", time: "5h", unread: true, avatar: "AV" },
  { id: 3, from: "Principal's Office", role: "Administration", subject: "PTM", preview: "You are cordially invited to the PTM on 19 July.", time: "1d", unread: false, avatar: "PO" },
  { id: 4, from: "Ms. Kavita Rao", role: "Biology Teacher", subject: "Biology", preview: "Practical file submission deadline extended to 15 July.", time: "2d", unread: false, avatar: "KR" },
  { id: 5, from: "Transport Desk", role: "Operations", subject: "Route 12", preview: "Bus route 12 will follow a diversion tomorrow due to road works.", time: "3d", unread: false, avatar: "TD" },
];

export const homework = [
  { id: 1, subject: "Maths", title: "Trigonometry - Exercise 8.4", assigned: "2026-07-08", due: "2026-07-11", status: "pending" as const, resources: 2 },
  { id: 2, subject: "Physics", title: "Numericals on Optics (Ch. 10)", assigned: "2026-07-07", due: "2026-07-10", status: "submitted" as const, resources: 1 },
  { id: 3, subject: "Biology", title: "Diagram - Human Digestive System", assigned: "2026-07-06", due: "2026-07-09", status: "graded" as const, grade: "A", resources: 3 },
  { id: 4, subject: "Chemistry", title: "Balancing Equations Worksheet", assigned: "2026-07-05", due: "2026-07-08", status: "overdue" as const, resources: 1 },
  { id: 5, subject: "English", title: "Essay - The Value of Discipline (400 words)", assigned: "2026-07-04", due: "2026-07-12", status: "pending" as const, resources: 0 },
];

export const timetable = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  periods: [
    { time: "08:00 - 08:45", slots: ["Maths", "Physics", "English", "Biology", "Chemistry", "History"] },
    { time: "08:50 - 09:35", slots: ["English", "Maths", "Chemistry", "Physics", "Biology", "PE"] },
    { time: "09:40 - 10:25", slots: ["Physics", "Biology", "Maths", "History", "English", "Maths"] },
    { time: "10:45 - 11:30", slots: ["Biology", "Chemistry", "History", "Maths", "Physics", "Art"] },
    { time: "11:35 - 12:20", slots: ["Chemistry", "English", "Biology", "Chemistry", "Maths", "Library"] },
    { time: "13:00 - 13:45", slots: ["History", "PE", "Physics", "English", "History", "-"] },
    { time: "13:50 - 14:35", slots: ["Art", "History", "PE", "Art", "Biology", "-"] },
  ],
};

export const reports = {
  overallGrade: "A",
  cgpa: 8.7,
  rank: 4,
  totalStudents: 42,
  subjects: [
    { name: "Maths", marks: 92, grade: "A+", remark: "Excellent problem-solving" },
    { name: "Physics", marks: 84, grade: "A", remark: "Strong conceptual clarity" },
    { name: "Chemistry", marks: 76, grade: "B+", remark: "Needs more practice with organic reactions" },
    { name: "Biology", marks: 88, grade: "A", remark: "Great practical work" },
    { name: "English", marks: 90, grade: "A+", remark: "Articulate written responses" },
    { name: "History", marks: 82, grade: "A", remark: "Improved essay structure" },
  ],
  trend: [
    { term: "T1", cgpa: 8.1 },
    { term: "T2", cgpa: 8.3 },
    { term: "T3", cgpa: 8.5 },
    { term: "T4", cgpa: 8.7 },
  ],
  remarks: {
    positive: ["Excellent leadership during group projects.", "Consistent improvement in analytical subjects."],
    constructive: ["Encourage more participation in oral discussions.", "Time management during practicals could improve."],
  },
};

export const fees = {
  totalAnnual: 148000,
  paid: 98000,
  due: 50000,
  nextDueDate: "2026-07-31",
  structure: [
    { label: "Tuition Fee", amount: 96000 },
    { label: "Development Fee", amount: 18000 },
    { label: "Transport Fee", amount: 22000 },
    { label: "Lab & Library", amount: 8000 },
    { label: "Exam Fee", amount: 4000 },
  ],
  transactions: [
    { id: "TXN-2298", date: "2026-06-01", label: "Q1 Installment", amount: 37000, method: "UPI", status: "success" as const },
    { id: "TXN-2201", date: "2026-04-05", label: "Admission renewal", amount: 61000, method: "Card", status: "success" as const },
    { id: "TXN-2140", date: "2026-01-15", label: "Transport top-up", amount: 5500, method: "NetBanking", status: "success" as const },
  ],
};

export const leaves = [
  { id: 1, from: "2026-07-15", to: "2026-07-16", reason: "Family function", status: "approved" as const, appliedOn: "2026-07-02" },
  { id: 2, from: "2026-06-22", to: "2026-06-22", reason: "Medical - fever", status: "approved" as const, appliedOn: "2026-06-22" },
  { id: 3, from: "2026-05-30", to: "2026-06-01", reason: "Out of station", status: "rejected" as const, appliedOn: "2026-05-28" },
  { id: 4, from: "2026-08-05", to: "2026-08-05", reason: "Cousin's wedding", status: "pending" as const, appliedOn: "2026-07-09" },
];

export const library = {
  issued: [
    { id: "B-2201", title: "A Brief History of Time", author: "Stephen Hawking", issued: "2026-07-01", due: "2026-07-15" },
    { id: "B-1104", title: "The Selfish Gene", author: "Richard Dawkins", issued: "2026-06-28", due: "2026-07-12" },
  ],
  overdue: [
    { id: "B-3388", title: "Sapiens", author: "Yuval Noah Harari", issued: "2026-06-15", due: "2026-06-30", fine: 30 },
  ],
  history: [
    { id: "B-2140", title: "Cosmos", author: "Carl Sagan", issued: "2026-05-10", returned: "2026-05-24" },
    { id: "B-2098", title: "The Alchemist", author: "Paulo Coelho", issued: "2026-04-05", returned: "2026-04-18" },
  ],
};

export const events = [
  { id: 1, title: "Independence Day Celebration", date: "2026-08-15", type: "Holiday" },
  { id: 2, title: "Half-Yearly Exams Begin", date: "2026-09-12", type: "Exam" },
  { id: 3, title: "Annual Sports Day", date: "2026-11-05", type: "Event" },
  { id: 4, title: "Diwali Break", date: "2026-11-01", type: "Holiday" },
  { id: 5, title: "Parent-Teacher Meeting", date: "2026-07-19", type: "Meeting" },
  { id: 6, title: "Science Exhibition", date: "2026-08-24", type: "Event" },
];

export const achievements = [
  { id: 1, title: "1st Prize - District Science Fair", date: "2026-06-24", category: "Academic" },
  { id: 2, title: "Gold - Inter-school Chess Championship", date: "2026-05-10", category: "Sports" },
  { id: 3, title: "Best Speaker - MUN 2026", date: "2026-03-18", category: "Debate" },
  { id: 4, title: "Perfect Attendance - Term 2", date: "2026-02-28", category: "Discipline" },
];

export const gallery = [
  { id: 1, title: "Annual Day 2025", count: 42, cover: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800" },
  { id: 2, title: "Science Fair", count: 28, cover: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800" },
  { id: 3, title: "Sports Meet", count: 65, cover: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=800" },
  { id: 4, title: "Cultural Fest", count: 51, cover: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800" },
  { id: 5, title: "Field Trip - Museum", count: 33, cover: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800" },
  { id: 6, title: "Investiture Ceremony", count: 22, cover: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800" },
];

export const transport = {
  routeNo: "R-12",
  driver: "Suresh Kumar",
  driverPhone: "+91 98207 55112",
  vehicle: "UP-16-AB-2019",
  attendant: "Meena Devi",
  status: "en-route" as const,
  eta: "07:42 AM",
  lat: 28.5355,
  lng: 77.391,
  stops: [
    { name: "Depot", time: "06:45", passed: true },
    { name: "Sector 18", time: "06:58", passed: true },
    { name: "Rosewood Apts (Pick-up)", time: "07:12", passed: true },
    { name: "Sector 25", time: "07:26", passed: false },
    { name: "School Gate", time: "07:42", passed: false },
  ],
};

export const aiConversations = [
  { id: 1, role: "user" as const, text: "Explain the concept of refraction with a real-life example." },
  { id: 2, role: "assistant" as const, text: "Refraction is the bending of light as it moves from one medium to another. A great real-life example: when you place a straw in a glass of water, the straw looks broken at the surface — that's refraction in action. Want me to break down the formula or try a practice problem?" },
];
