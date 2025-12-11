"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navSections = [
  {
    title: "Admin",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "🧭" },
      { href: "/dashboard/note", label: "Notes", icon: "🗒" },
      { href: "/dashboard/flashcard", label: "Flashcards", icon: "🧠" },
      { href: "/dashboard/quiz", label: "Quiz MCQ", icon: "🎯" },
      { href: "/dashboard/quiz-frq", label: "Quiz FRQ", icon: "📝" },
      { href: "/dashboard/chapter", label: "Chapters", icon: "🗂" },
    ],
  },
  {
    title: "Student",
    items: [
      { href: "/dashboard/student/note", label: "Notes", icon: "📘" },
      { href: "/dashboard/student/flashcard", label: "Flashcards", icon: "💡" },
      { href: "/dashboard/student/quiz", label: "Exam Topical", icon: "📍" },
      { href: "/dashboard/student/quiz-frq", label: "Free Response", icon: "🧾" },
      { href: "/dashboard/student/past-paper", label: "Exam Past Paper", icon: "📜" },
    ],
  },
  {
    title: "Teacher",
    items: [
      { href: "/dashboard/lesson", label: "Lessons", icon: "📚" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative sticky top-0 h-screen shrink-0 overflow-y-auto border-r border-gray-200 bg-white/90 px-4 py-6 shadow-sm backdrop-blur transition-all duration-200 dark:border-gray-800 dark:bg-neutral-950/70 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-2xl text-white shadow-lg">
            🎓
          </div>
          {!collapsed ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Admin</p>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Study Panel</h1>
            </div>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className={`absolute top-6 -right-4 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-200 ${
          collapsed ? "rotate-180" : ""
        }`}
        aria-label="Toggle navigation"
        title={collapsed ? "Expand menu" : "Collapse menu"}
      >
        ‹
      </button>
      <nav className="space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {section.title}
              </p>
            ) : null}
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const isExact = pathname === item.href;
                const isChild = pathname?.startsWith(`${item.href}/`);
                const active = item.href === "/dashboard" ? isExact : isExact || isChild;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-gradient-to-r from-blue-500/90 via-blue-500/80 to-indigo-500/80 text-white shadow"
                        : "text-gray-700 hover:bg-gray-100 hover:shadow-sm dark:text-gray-200 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl ${
                        active ? "bg-white/20" : "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-200"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed ? <span className="pl-1">{item.label}</span> : null}
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
