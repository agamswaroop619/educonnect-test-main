import {
  Home, Calendar, GraduationCap, BookOpen, MessageSquare, Newspaper,
  BarChart3, ClipboardCheck, Wallet, FileText, Library, CalendarDays,
  Trophy, Image as ImageIcon, Bus, Sparkles, Settings, User, Users,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Home", icon: Home },
      { to: "/class", label: "Class", icon: Users },
      { to: "/messages", label: "Messages", icon: MessageSquare },
      { to: "/circulars", label: "Circulars", icon: Newspaper },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/courses", label: "Courses", icon: GraduationCap },
      { to: "/homework", label: "Homework", icon: BookOpen },
      { to: "/timetable", label: "Timetable", icon: Calendar },
      { to: "/reports", label: "Report Card", icon: BarChart3 },
      { to: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/fees", label: "Fees", icon: Wallet },
      { to: "/leave", label: "Leave", icon: FileText },
      { to: "/library", label: "Library", icon: Library },
      { to: "/transport", label: "Transport", icon: Bus },
    ],
  },
  {
    label: "Life",
    items: [
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
      { to: "/achievements", label: "Achievements", icon: Trophy },
      { to: "/gallery", label: "Gallery", icon: ImageIcon },
      { to: "/profile", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

// Bottom nav (mobile) — condensed
export const MOBILE_TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/attendance", label: "Attend", icon: ClipboardCheck },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/messages", label: "Chat", icon: MessageSquare },
  { to: "/profile", label: "Me", icon: User },
] as const;
