import Link from "next/link";
import {
  ArrowRight,
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
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";

const tracks = [
  { name: "IGCSE", icon: FlaskConical },
  { name: "AS / A Levels", icon: Brain },
  { name: "SAT", icon: Calculator },
  { name: "IELTS", icon: Languages },
  { name: "AP", icon: GraduationCap },
  { name: "HSK", icon: Globe2 },
];

const personas = [
  { title: "I'm a student", desc: "Sign up to start practicing", icon: User, color: "bg-violet-100 text-violet-700" },
  { title: "I'm a tutor", desc: "Post notes and manage your profile", icon: GraduationCap, color: "bg-teal-100 text-teal-700" },
];

const quickFacts = [
  { label: "Subjects covered", value: "40+" },
  { label: "Past paper sessions", value: "10+ yrs" },
  { label: "Free to start", value: "$0" },
];

const features = [
  { title: "Past Papers", desc: "Every subject, sorted by year and exam session.", icon: BookOpen, href: "/dashboard/student/past-paper" },
  { title: "Find a Tutor", desc: "Browse real tutors by subject, price and availability.", icon: Users, href: "/dashboard/student/tutors" },
  { title: "Leaderboard", desc: "Earn points and streaks as you study, and see how you rank.", icon: Trophy, href: "/dashboard/student/leaderboard" },
  { title: "Blog", desc: "Study tips and exam strategy posted by our tutors.", icon: Newspaper, href: "/dashboard/student/blog" },
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-8 text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-subtle bg-surface px-4 py-3 md:px-6">
        <Logo />
        <nav className="flex items-center gap-2 text-sm font-semibold text-ink md:gap-3">
          <Link href="#tracks" className="hidden rounded-full px-3 py-2 hover:bg-subtle/40 md:inline-flex">
            Tracks
          </Link>
          <Link href="#features" className="hidden rounded-full px-3 py-2 hover:bg-subtle/40 md:inline-flex">
            Features
          </Link>
          <Link href="#resources" className="hidden rounded-full px-3 py-2 hover:bg-subtle/40 md:inline-flex">
            Resources
          </Link>
          <Link href="/login" className="rounded-full px-3 py-2 hover:bg-subtle/40">
            Log in
          </Link>
          <LinkButton href="/signup" size="sm">
            Start free
          </LinkButton>
        </nav>
      </header>

      <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            IGCSE &middot; A Levels &middot; AP &middot; SAT &middot; IELTS &middot; HSK
          </span>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Exam practice, organized the way you&apos;ll actually use it.
          </h1>
          <p className="max-w-lg text-lg text-ink-soft">
            Notes, topical questions, and a past papers library sorted by subject, year and session &mdash; built
            for students studying online, at their own pace.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <LinkButton href="/signup" size="lg">
              Create free account <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <Link href="/login" className="text-sm font-semibold text-ink-soft hover:text-ink">
              Already have an account? <span className="text-violet-600">Log in</span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            {quickFacts.map((fact) => (
              <div key={fact.label}>
                <p className="font-heading text-2xl font-extrabold text-ink">{fact.value}</p>
                <p className="text-xs font-semibold text-ink-soft">{fact.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {personas.map((persona) => (
            <Link key={persona.title} href="/signup">
              <Card className="flex h-full flex-col gap-4 p-5 transition hover:border-violet-300 hover:shadow-md">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${persona.color}`}>
                  <persona.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-ink">{persona.title}</p>
                  <p className="text-sm text-ink-soft">{persona.desc}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-ink-soft" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <section id="features" className="mx-auto mt-24 w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <Badge color="violet">More than practice questions</Badge>
          <p className="text-ink-soft">Everything a student needs, in one account.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.title} href="/signup">
              <Card className="flex h-full flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-ink">{feature.title}</h3>
                <p className="text-sm text-ink-soft">{feature.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="tracks" className="mx-auto mt-20 w-full max-w-6xl space-y-5">
        <p className="text-center text-sm font-bold uppercase tracking-wide text-ink-soft">Built for the syllabi you sit</p>
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

      <section id="resources" className="mx-auto mt-20 w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <Badge color="violet">What you get</Badge>
          <p className="text-ink-soft">Everything focused on learn &rarr; practice &rarr; ace it.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Smart notes", desc: "High-yield summaries with diagrams, mnemonics, and exam hints.", badge: "Bite-sized", icon: BookOpen },
            { title: "Practice bank", desc: "Timed questions by topic with instant mark schemes, mirroring real papers.", badge: "Exam-style", icon: ListChecks },
            { title: "Flashcards + streaks", desc: "Daily decks with streaks and adaptive spacing that lock facts in for good.", badge: "Memory-proof", icon: Layers },
          ].map((card) => (
            <Card key={card.title} className="flex flex-col gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <card.icon className="h-5 w-5" />
              </div>
              <Badge color="violet" className="w-fit">{card.badge}</Badge>
              <h3 className="font-heading text-xl font-bold text-ink">{card.title}</h3>
              <p className="text-ink-soft">{card.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl">
        <Card className="px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Ready?</p>
            <h3 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">Join Examly and get exam-ready.</h3>
            <p className="max-w-xl text-ink-soft">Modern and stress-free. Start free and keep your streak going.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href="/signup" size="lg">
                Create account <ArrowRight className="h-5 w-5" />
              </LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">
                Log in
              </LinkButton>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
