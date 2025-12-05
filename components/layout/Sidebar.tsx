"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "Admin",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/note", label: "Notes" },
      { href: "/dashboard/flashcard", label: "Flashcards" },
      { href: "/dashboard/quiz", label: "Quizzes" },
      { href: "/dashboard/chapter", label: "Chapters" },
    ],
  },
  {
    title: "Student",
    items: [
      { href: "/dashboard/student/note", label: "Notes" },
      { href: "/dashboard/student/flashcard", label: "Flashcards" },
      { href: "/dashboard/student/quiz", label: "Quizzes" },
    ],
  },
  {
    title: "Teacher",
    items: [
      { href: "/dashboard/lesson", label: "Lessons" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white/90 px-4 py-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-neutral-950/70">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin</p>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Study Panel</h1>
      </div>
      <nav className="space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {section.title}
            </p>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active = item.href === "/dashboard" ? pathname === item.href : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100 ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-neutral-800"
                }`}
              >
                    <span className="pl-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
