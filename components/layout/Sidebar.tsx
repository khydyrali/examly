"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Home,
  Layers,
  ListTree,
  Menu,
  ScrollText,
  X,
} from "lucide-react";
import { useSupabase } from "../providers/SupabaseProvider";
import { LogoMark } from "@/components/brand/Logo";

type IconName =
  | "home"
  | "note"
  | "flashcard"
  | "quiz"
  | "frq"
  | "chapter"
  | "student-note"
  | "student-flash"
  | "student-quiz"
  | "student-frq"
  | "student-exam"
  | "past-paper"
  | "lesson";

type NavItem = { href: string; label: string; icon: IconName };
type NavSection = { title: string; items: NavItem[] };

const icons: Record<IconName, typeof Home> = {
  home: Home,
  note: ScrollText,
  flashcard: Layers,
  quiz: FileQuestion,
  frq: ClipboardList,
  chapter: ListTree,
  "student-note": ScrollText,
  "student-flash": Layers,
  "student-quiz": FileQuestion,
  "student-frq": ClipboardList,
  "student-exam": GraduationCap,
  "past-paper": BookOpen,
  lesson: BookOpen,
};

const navSections: NavSection[] = [
  {
    title: "Admin",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/dashboard/note", label: "Notes", icon: "note" },
      { href: "/dashboard/flashcard", label: "Flashcards", icon: "flashcard" },
      { href: "/dashboard/quiz", label: "Quiz MCQ", icon: "quiz" },
      { href: "/dashboard/quiz-frq", label: "Quiz FRQ", icon: "frq" },
      { href: "/dashboard/chapter", label: "Chapters", icon: "chapter" },
    ],
  },
  {
    title: "Student",
    items: [
      { href: "/dashboard/student", label: "Dashboard", icon: "home" },
      { href: "/dashboard/student/note", label: "Notes", icon: "student-note" },
      { href: "/dashboard/student/flashcard", label: "Flashcards", icon: "student-flash" },
      { href: "/dashboard/student/quiz", label: "Exam Topical", icon: "student-quiz" },
      { href: "/dashboard/student/quiz-frq", label: "Free Response", icon: "student-frq" },
      { href: "/dashboard/student/mock-exam", label: "Mock Exams", icon: "student-exam" },
      { href: "/dashboard/student/past-paper", label: "Past Papers", icon: "past-paper" },
    ],
  },
  {
    title: "Teacher",
    items: [{ href: "/dashboard/lesson", label: "Lessons", icon: "lesson" }],
  },
];

function getUserRoleFromToken(token?: string | null) {
  if (!token || typeof window === "undefined") return null;
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = atob(padded);
    const claims = JSON.parse(decoded) as {
      user_role?: unknown;
      app_metadata?: { user_role?: unknown };
      user_metadata?: { user_role?: unknown };
    };
    const role = claims.user_role ?? claims.app_metadata?.user_role ?? claims.user_metadata?.user_role;
    return typeof role === "string" ? role : null;
  } catch (error) {
    console.warn("Failed to parse JWT for user role", error);
    return null;
  }
}

export function Sidebar() {
  const { session } = useSupabase();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const desktopWidthClass = collapsed ? "md:w-20" : "md:w-72";

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const userRole = useMemo(() => getUserRoleFromToken(session?.access_token), [session?.access_token]);
  const visibleNavSections = useMemo(() => {
    if (userRole === "admin") return navSections;
    if (userRole === "teacher") return navSections.filter((section) => section.title !== "Admin");
    if (userRole === "student") return navSections.filter((section) => section.title === "Student");
    return [];
  }, [userRole]);

  const sections = useMemo(
    () =>
      visibleNavSections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          const isExact = pathname === item.href;
          const isChild = pathname?.startsWith(`${item.href}/`);
          const isRootDashboard = item.href === "/dashboard" || item.href === "/dashboard/student";
          const active = isRootDashboard ? isExact : isExact || isChild;
          return { ...item, active };
        }),
      })),
    [pathname, visibleNavSections],
  );

  const linkBase = "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all duration-150";
  const iconWrapBase = "flex h-10 w-10 items-center justify-center rounded-xl";

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border-2 border-violet-100 bg-white text-violet-700 shadow-md md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {mobileOpen ? (
        <div className="fixed inset-0 z-30 bg-violet-950/30 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 transform border-r-2 border-violet-100 bg-white px-4 py-6 shadow-lg transition md:sticky md:top-0 md:h-screen md:translate-x-0 md:px-4 md:py-6 md:shadow-none dark:border-violet-900/40 dark:bg-surface ${desktopWidthClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex w-full flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
              <LogoMark className="h-11 w-11" />
              {!collapsed ? <h1 className="font-heading text-lg font-extrabold tracking-tight text-ink">Examly</h1> : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border-2 border-violet-100 bg-white text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:flex"
                aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                title={collapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-violet-100 bg-white text-violet-700 shadow-sm md:hidden"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav className="space-y-6 overflow-y-auto pb-6">
            {sections.map((section) => (
              <div key={section.title}>
                {!collapsed ? (
                  <p className="px-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft/70">{section.title}</p>
                ) : null}
                <div className="mt-2 space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = icons[item.icon] ?? Home;
                    const activeClasses = item.active
                      ? "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 text-white shadow-pop"
                      : "bg-white text-ink hover:bg-violet-50";
                    const iconClasses = item.active ? "text-white" : "text-violet-600";
                    return (
                      <Link key={item.href} href={item.href} onClick={handleNavClick} className={`${linkBase} ${activeClasses}`}>
                        <span className={`${iconWrapBase} ${iconClasses}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        {!collapsed ? <span className="pl-1">{item.label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
