"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Brain,
  Calculator,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  Globe2,
  Languages,
  Layers,
  ListChecks,
  Newspaper,
  Sparkles,
  Trophy,
  User,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";

const tracks = [
  { name: "IGCSE", icon: FlaskConical },
  { name: "AS / A Levels", icon: Brain },
  { name: "SAT", icon: Calculator },
  { name: "IELTS", icon: Languages },
  { name: "AP", icon: GraduationCap },
  { name: "HSK", icon: Globe2 },
];

const personaIcons = [
  { id: "student", icon: User, color: "bg-violet-100 text-violet-700" },
  { id: "tutor", icon: GraduationCap, color: "bg-teal-100 text-teal-700" },
] as const;

const factValues = { subjects: "40+", pastPapers: "10+ yrs", free: "$0" } as const;
const factOrder = ["subjects", "pastPapers", "free"] as const;

const featureIcons = [
  { id: "pastPapers", icon: BookOpen, href: "/dashboard/student/past-paper" },
  { id: "tutors", icon: Users, href: "/dashboard/student/tutors" },
  { id: "leaderboard", icon: Trophy, href: "/dashboard/student/leaderboard" },
  { id: "blog", icon: Newspaper, href: "/dashboard/student/blog" },
] as const;

const resourceIcons = [
  { id: "notes", icon: BookOpen },
  { id: "practice", icon: ListChecks },
  { id: "flashcards", icon: Layers },
] as const;

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-subtle bg-surface px-4 py-3 md:px-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-semibold text-ink md:gap-3">
          <Link href="#tracks" className="hidden rounded-full px-3 py-2 hover:bg-subtle/40 md:inline-flex">
            {t.home.nav.tracks}
          </Link>
          <Link
            href="#ai-marking"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-fuchsia-600 hover:bg-subtle/40 md:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" /> {t.home.nav.aiMarking}
          </Link>
          <Link href="#features" className="hidden rounded-full px-3 py-2 hover:bg-subtle/40 md:inline-flex">
            {t.home.nav.features}
          </Link>
          <Link href="#resources" className="hidden rounded-full px-3 py-2 hover:bg-subtle/40 md:inline-flex">
            {t.home.nav.resources}
          </Link>
          <LanguageSwitcher />
          <Link href="/login" className="rounded-full px-3 py-2 hover:bg-subtle/40">
            {t.home.nav.login}
          </Link>
          <LinkButton href="/signup" size="sm">
            {t.home.nav.startFree}
          </LinkButton>
        </nav>
      </header>

      <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {t.home.hero.badge}
          </span>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            {t.home.hero.title}
          </h1>
          <p className="max-w-lg text-lg text-ink-soft">{t.home.hero.subtitle}</p>
          <div className="flex flex-wrap items-center gap-4">
            <LinkButton href="/signup" size="lg">
              {t.home.hero.cta} <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <Link href="/login" className="text-sm font-semibold text-ink-soft hover:text-ink">
              {t.home.hero.loginPrompt} <span className="text-violet-600">{t.home.hero.loginLink}</span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            {factOrder.map((id) => (
              <div key={id}>
                <p className="font-heading text-2xl font-extrabold text-ink">{factValues[id]}</p>
                <p className="text-xs font-semibold text-ink-soft">{t.home.facts[id]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {personaIcons.map((persona) => (
            <Link key={persona.id} href="/signup">
              <Card className="flex h-full flex-col gap-4 p-5 transition hover:border-violet-300 hover:shadow-md">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${persona.color}`}>
                  <persona.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-ink">{t.home.personas[persona.id].title}</p>
                  <p className="text-sm text-ink-soft">{t.home.personas[persona.id].desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-ink-soft" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <section id="ai-marking" className="mx-auto mt-20 w-full max-w-6xl scroll-mt-24">
        <div className="relative overflow-hidden rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 px-6 py-12 text-white shadow-pop sm:px-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> {t.home.aiMarking.badge}
              </span>
              <h2 className="font-heading text-3xl font-extrabold leading-tight sm:text-4xl">{t.home.aiMarking.title}</h2>
              <p className="max-w-lg text-white/90">{t.home.aiMarking.desc}</p>
              <ul className="space-y-2 text-sm font-semibold">
                {[t.home.aiMarking.point1, t.home.aiMarking.point2, t.home.aiMarking.point3].map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-white" /> {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-violet-700 shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
              >
                {t.home.aiMarking.cta} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="float-slow rounded-3xl border-2 border-white/20 bg-white p-5 text-ink shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-extrabold uppercase text-violet-700">
                    <Bot className="h-3.5 w-3.5" /> {t.home.aiMarking.mockScored}
                  </span>
                  <span className="inline-flex h-9 items-center rounded-full bg-emerald-100 px-3 text-sm font-extrabold text-emerald-700">
                    {t.home.aiMarking.mockScore}
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold text-ink-soft">Q. {t.home.aiMarking.mockQuestion}</p>
                <div className="mt-3 space-y-2 rounded-2xl bg-subtle/40 p-3">
                  <div className="h-2 w-full rounded-full bg-subtle" />
                  <div className="h-2 w-5/6 rounded-full bg-subtle" />
                  <div className="h-2 w-2/3 rounded-full bg-subtle" />
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-2xl bg-violet-50 p-3">
                  <Wand2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
                  <p className="text-xs font-semibold text-violet-800">{t.home.aiMarking.mockFeedback}</p>
                </div>
              </div>
              <div className="float-slower absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-yellow-900 shadow-lg">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto mt-24 w-full max-w-6xl space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3">
          <Badge color="violet">{t.home.featuresHeading.badge}</Badge>
          <p className="text-ink-soft">{t.home.featuresHeading.subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureIcons.map((feature) => (
            <Link key={feature.id} href="/signup">
              <Card className="flex h-full flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-ink">{t.home.features[feature.id].title}</h3>
                <p className="text-sm text-ink-soft">{t.home.features[feature.id].desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="tracks" className="mx-auto mt-20 w-full max-w-6xl space-y-5 scroll-mt-24">
        <p className="text-center text-sm font-bold uppercase tracking-wide text-ink-soft">{t.home.tracksHeading}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {tracks.map((track) => (
            <div key={track.name} className="flex items-center gap-2.5 rounded-full border border-subtle bg-surface px-4 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <track.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-ink">{track.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="resources" className="mx-auto mt-20 w-full max-w-6xl space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3">
          <Badge color="violet">{t.home.resourcesHeading.badge}</Badge>
          <p className="text-ink-soft">{t.home.resourcesHeading.subtitle}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {resourceIcons.map((card) => (
            <Card key={card.id} className="flex flex-col gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <card.icon className="h-5 w-5" />
              </div>
              <Badge color="violet" className="w-fit">
                {t.home.resources[card.id].badge}
              </Badge>
              <h3 className="font-heading text-xl font-bold text-ink">{t.home.resources[card.id].title}</h3>
              <p className="text-ink-soft">{t.home.resources[card.id].desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl">
        <Card className="px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">{t.home.ctaSection.eyebrow}</p>
            <h3 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">{t.home.ctaSection.title}</h3>
            <p className="max-w-xl text-ink-soft">{t.home.ctaSection.desc}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href="/signup" size="lg">
                {t.home.ctaSection.createAccount} <ArrowRight className="h-5 w-5" />
              </LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">
                {t.home.ctaSection.login}
              </LinkButton>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
