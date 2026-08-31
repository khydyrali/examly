"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Locale } from "@/components/providers/translations";

const options: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "mn", label: "MN" },
];

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-full border-2 border-subtle bg-surface p-0.5 text-xs font-extrabold ${className}`}
      role="group"
      aria-label={t.common.language}
    >
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLocale(option.code)}
          aria-pressed={locale === option.code}
          className={`rounded-full px-2.5 py-1.5 transition ${
            locale === option.code
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-pop"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
