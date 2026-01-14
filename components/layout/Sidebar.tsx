"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { useSupabase } from "../providers/SupabaseProvider";

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

const icons: Record<IconName, ReactNode> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M6 4h9l3 3v13H6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  flashcard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h10M7 14h6" strokeLinecap="round" />
    </svg>
  ),
  quiz: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M12 17h.01M9 9a3 3 0 1 1 5.2 2 3.5 3.5 0 0 0-1.2 2.6V14" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  frq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M7 4h10a1 1 0 0 1 1 1v14l-4-2-4 2-4-2V5a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chapter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M6 5h12M6 9h12M6 13h8M6 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "student-note": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M6 5h9l3 3v11H6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5v3h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 13h8M8 16h6" strokeLinecap="round" />
    </svg>
  ),
  "student-flash": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <rect x="3.5" y="6.5" width="17" height="11" rx="1.5" />
      <path d="M8 11h8M8 14h5" strokeLinecap="round" />
    </svg>
  ),
  "student-quiz": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 1 1 5.2 2 3.5 3.5 0 0 0-1.2 2.6V15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
  "student-frq": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M5 4h14a1 1 0 0 1 1 1v14l-5-3-5 3-5-3V5a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "student-exam": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M6 5h12a1 1 0 0 1 1 1v12l-4-2-3 2-3-2-3 2V6a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9h6M9 12h6M9 15h3" strokeLinecap="round" />
    </svg>
  ),
  "past-paper": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M7 4h7l3 3v13H7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4v3h3M9 12h6M9 15h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lesson: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M5 5h14v14H5z" />
      <path d="M9 9h6M9 13h6M9 17h3" strokeLinecap="round" />
    </svg>
  ),
};

const navSections: NavSection[] = [
  {
    title: "Admin",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" as IconName },
      { href: "/dashboard/note", label: "Notes", icon: "note" as IconName },
      { href: "/dashboard/flashcard", label: "Flashcards", icon: "flashcard" as IconName },
      { href: "/dashboard/quiz", label: "Quiz MCQ", icon: "quiz" as IconName },
      { href: "/dashboard/quiz-frq", label: "Quiz FRQ", icon: "frq" as IconName },
      { href: "/dashboard/chapter", label: "Chapters", icon: "chapter" as IconName },
    ],
  },
  {
    title: "Student",
    items: [
      { href: "/dashboard/student", label: "Dashboard", icon: "home" as IconName },
      { href: "/dashboard/student/note", label: "Notes", icon: "student-note" as IconName },
      { href: "/dashboard/student/flashcard", label: "Flashcards", icon: "student-flash" as IconName },
      { href: "/dashboard/student/quiz", label: "Exam Topical", icon: "student-quiz" as IconName },
      { href: "/dashboard/student/quiz-frq", label: "Free Response", icon: "student-frq" as IconName },
      { href: "/dashboard/student/mock-exam", label: "Mock Exams", icon: "student-exam" as IconName },
      { href: "/dashboard/student/past-paper", label: "Exam Past Paper", icon: "past-paper" as IconName },
    ],
  },
  {
    title: "Teacher",
    items: [{ href: "/dashboard/lesson", label: "Lessons", icon: "lesson" as IconName }],
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

  const desktopWidthClass = collapsed ? "md:w-20" : "md:w-64";

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const userRole = useMemo(() => getUserRoleFromToken(session?.access_token), [session?.access_token]);
  const visibleNavSections = useMemo(
    () => {
      if (userRole === "admin") return navSections;
      if (userRole === "teacher") return navSections.filter((section) => section.title !== "Admin");
      if (userRole === "student") return navSections.filter((section) => section.title === "Student");
      return [];
    },
    [userRole],
  );

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

  const linkBase =
    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150";
  const iconWrapBase = "flex h-10 w-10 items-center justify-center rounded-xl";
  const labelBase = "pl-1";

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 shadow md:hidden"
        aria-label="Open navigation"
      >
        <span className="sr-only">Open navigation</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-72 transform border-r border-gray-200 bg-white px-4 py-6 shadow-lg transition md:sticky md:top-0 md:h-screen md:translate-x-0 md:bg-white/90 md:px-4 md:py-6 md:shadow-sm dark:border-gray-800 dark:bg-neutral-950/90 ${desktopWidthClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex w-full flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-xl font-bold text-white shadow">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 12a7 7 0 0 1 14 0c0 4-3 7-7 7H8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 17c1.5 0 3-1 3-2.5S9.5 12 8 12s-3-1-3-2.5S6.5 7 8 7c1.2 0 2.3.5 3 1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {!collapsed ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Flex</p>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Study</h1>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 md:flex"
                aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                title={collapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {collapsed ? ">" : "<"}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 md:hidden"
                aria-label="Close navigation"
              >
                X
              </button>
            </div>
          </div>

          <nav className="space-y-6 overflow-y-auto pb-6">
            {sections.map((section) => (
              <div key={section.title}>
                {!collapsed ? (
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {section.title}
                  </p>
                ) : null}
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const iconNode = icons[item.icon] ?? <span className="text-xs font-bold">{item.label.slice(0, 1)}</span>;
                    const activeClasses = item.active
                      ? "bg-gradient-to-r from-blue-500/90 via-blue-500/80 to-indigo-500/80 text-white shadow"
                      : "bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800";
                    const iconClasses = item.active ? "text-white" : "text-gray-600 dark:text-gray-200";
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        className={`${linkBase} ${activeClasses}`}
                      >
                        <span className={`${iconWrapBase} ${iconClasses}`}>{iconNode}</span>
                        {!collapsed ? <span className={labelBase}>{item.label}</span> : null}
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
