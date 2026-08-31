"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function AuthLayout({
  eyebrow,
  title,
  description,
  bullets,
  bulletColor = "bg-emerald-400",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  bulletColor?: string;
  children: ReactNode;
}) {
  const { t } = useLanguage();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-40" />
      <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 -z-10 h-80 w-80 rounded-full bg-orange-200/50 blur-[110px]" />

      <div className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border-2 border-subtle bg-surface/90 p-6 shadow-2xl backdrop-blur sm:p-8 lg:grid-cols-[1fr,420px] lg:p-10">
        <div className="flex flex-col justify-center space-y-5">
          <div className="flex items-center justify-between">
            <Logo markClassName="h-10 w-10" />
            <LanguageSwitcher />
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-subtle-strong px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </span>
          <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
          <p className="text-ink-soft">{description}</p>
          <ul className="space-y-2 text-sm font-semibold text-ink">
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${bulletColor}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="float-slower hidden pt-4 lg:block">
            <LogoMark className="h-16 w-16 opacity-80" />
          </div>
          <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-violet-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> {t.auth.backToHome}
          </Link>
        </div>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </main>
  );
}
