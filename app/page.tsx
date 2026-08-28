import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  FlaskConical,
  Globe2,
  GraduationCap,
  Languages,
  Layers,
  Rocket,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";

const tracks = [
  { name: "IGCSE", icon: FlaskConical, color: "from-violet-400 to-fuchsia-500", items: ["Bite-size topic notes", "Paper 1 & 2 style practice", "Maths, Physics, Chem, Bio"] },
  { name: "AS / A Levels", icon: Brain, color: "from-indigo-400 to-violet-600", items: ["Diagrams & worked examples", "Timed drills + mark schemes", "Essay scaffolds"] },
  { name: "SAT", icon: Calculator, color: "from-orange-400 to-amber-500", items: ["Math timing drills", "Evidence-based reading", "Score-style feedback"] },
  { name: "IELTS", icon: Languages, color: "from-rose-400 to-pink-500", items: ["Reading & listening sets", "Band-score feedback", "Task 1 / 2 writing prompts"] },
  { name: "AP", icon: Trophy, color: "from-emerald-400 to-teal-500", items: ["Unit-aligned flashcards", "FRQ practice with rubrics", "Progress by Big Idea"] },
  { name: "HSK", icon: Globe2, color: "from-cyan-400 to-sky-500", items: ["Level 1-6 vocab decks", "Listening + reading clozes", "Tone & character drills"] },
];

const subjectBubbles = [
  { name: "Physics", emoji: "⚡", color: "bg-violet-100 text-violet-700" },
  { name: "Chemistry", emoji: "🧪", color: "bg-teal-100 text-teal-700" },
  { name: "Biology", emoji: "🧬", color: "bg-emerald-100 text-emerald-700" },
  { name: "Maths", emoji: "📐", color: "bg-orange-100 text-orange-700" },
  { name: "English", emoji: "📚", color: "bg-rose-100 text-rose-700" },
  { name: "Computer Sci", emoji: "💻", color: "bg-sky-100 text-sky-700" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-24 pt-8 text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dots opacity-40" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-orange-200/50 blur-[110px]" />
        <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-teal-200/50 blur-[100px]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:px-6">
        <Logo markClassName="h-10 w-10" />
        <nav className="flex items-center gap-2 text-sm font-bold text-ink md:gap-3">
          <Link href="#tracks" className="hidden rounded-full px-3 py-2 hover:bg-violet-50 md:inline-flex">
            Tracks
          </Link>
          <Link href="#past-papers" className="hidden rounded-full px-3 py-2 hover:bg-violet-50 md:inline-flex">
            Past Papers
          </Link>
          <Link href="#resources" className="hidden rounded-full px-3 py-2 hover:bg-violet-50 md:inline-flex">
            Resources
          </Link>
          <Link href="/login" className="rounded-full px-3 py-2 hover:bg-violet-50">
            Log in
          </Link>
          <LinkButton href="/signup" size="sm">
            Start free <Sparkles className="h-4 w-4" />
          </LinkButton>
        </nav>
      </header>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-10">
        <div className="flex-1 space-y-6">
          <Badge color="violet" className="shadow-pop">
            IGCSE · AS &amp; A Levels · AP · SAT · IELTS · HSK
          </Badge>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
            Studying for exams,{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
              made fun
            </span>{" "}
            again.
          </h1>
          <p className="text-lg text-ink-soft sm:text-xl">
            Colorful notes, game-like practice, and a giant past papers library sorted by subject, year and
            session &mdash; everything a secondary or high school student needs to walk into exam day confident.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <LinkButton href="/signup" size="lg">
              Create free account <ArrowRight className="h-5 w-5" />
            </LinkButton>
            <LinkButton href="/login" variant="outline" size="lg">
              I already have an account
            </LinkButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjectBubbles.map((s) => (
              <span key={s.name} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-sm ${s.color}`}>
                <span aria-hidden="true">{s.emoji}</span>
                {s.name}
              </span>
            ))}
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3">
            {[
              { label: "Questions to practice", value: "182k+" },
              { label: "Avg. grade lift", value: "+1.6" },
              { label: "Past papers indexed", value: "3,000+" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`rounded-2xl px-3 py-3 text-white shadow-pop ${
                  i === 0 ? "bg-gradient-to-br from-violet-600 to-fuchsia-500" : i === 1 ? "bg-gradient-to-br from-orange-500 to-amber-400" : "bg-gradient-to-br from-teal-500 to-emerald-500"
                }`}
              >
                <p className="font-heading text-lg font-extrabold">{stat.value}</p>
                <p className="text-xs font-semibold text-white/90">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-x-10 top-4 -z-10 h-72 rounded-3xl bg-gradient-to-br from-violet-200/50 via-fuchsia-100 to-orange-100 blur-3xl" />
          <div className="float-slow absolute -left-4 -top-8 hidden sm:block">
            <LogoMark className="h-20 w-20 drop-shadow-xl" />
          </div>
          <Card className="p-5 shadow-xl shadow-violet-200/50">
            <div className="rounded-2xl border-2 border-violet-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live practice &middot; Physics
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-violet-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Topic</p>
                  <p className="font-heading text-lg font-bold text-ink">Electric circuits &amp; energy transfer</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Question 1 of 12 &middot; 2 marks &middot; Why does adding a resistor in parallel reduce total resistance?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-bold">
                  {["More current flows", "Voltage increases", "Resistances add", "Circuit overheats"].map((opt, idx) => (
                    <div
                      key={opt}
                      className={`rounded-xl border-2 px-3 py-3 transition ${
                        idx === 0
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                          : "border-violet-100 bg-white text-ink"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl bg-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Flashcards</p>
                  <p className="font-heading text-sm font-bold text-ink">Organic Chemistry &middot; AS</p>
                </div>
                <Badge color="orange">🔥 9 day streak</Badge>
              </div>
              <div className="grid gap-2 rounded-xl bg-white p-3 text-sm text-ink shadow-sm">
                <p className="font-bold">What makes a molecule optically active?</p>
                <p className="rounded-lg bg-violet-50 px-3 py-2 text-ink-soft">
                  It has a chiral center (four different groups), giving non-superimposable mirror images.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-ink-soft">
                <span>Next review in 8h</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-14 rounded-full bg-orange-100">
                    <div className="h-2 w-10 rounded-full bg-orange-500" />
                  </div>
                  <span className="font-bold text-orange-600">82%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section id="past-papers" className="mx-auto mt-24 w-full max-w-6xl">
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-500 p-8 text-white sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="!bg-white/20 !text-white">Every subject &middot; every year &middot; every session</Badge>
              <h2 className="font-heading text-3xl font-extrabold sm:text-4xl">A huge Past Papers library, organized just like you&apos;d expect.</h2>
              <p className="text-white/90">
                Pick a subject, then drill down by year and exam session (May/June, Oct/Nov, Feb/March) to find the
                exact paper you need &mdash; questions plus full mark schemes, browsable right in Examly.
              </p>
              <LinkButton href="/signup" variant="secondary" size="lg" className="!bg-white !text-violet-700 shadow-lg">
                Browse Past Papers <ArrowRight className="h-5 w-5" />
              </LinkButton>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {["Physics", "Chemistry", "Biology", "Maths", "Economics", "English"].map((subj) => (
                <div key={subj} className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                  <p className="font-heading font-bold">{subj}</p>
                  <p className="mt-1 text-xs text-white/80">2015 &ndash; 2025</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {["M/J", "O/N", "F/M"].map((s) => (
                      <span key={s} className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section id="tracks" className="mx-auto mt-20 w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Exam coverage</p>
            <h2 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">Built for the syllabi you sit.</h2>
            <p className="text-ink-soft">Clear, modern, organized by exam board &mdash; now with SAT, IELTS, and HSK too.</p>
          </div>
          <LinkButton href="/signup" size="sm" className="hidden md:inline-flex">
            Start now
          </LinkButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <Card key={track.name} className="group p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="font-heading text-xl font-bold text-ink">{track.name}</div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${track.color} text-white shadow-sm`}>
                  <track.icon className="h-5 w-5" />
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {track.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section id="resources" className="mx-auto mt-20 w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <Badge color="teal">What you get</Badge>
          <p className="text-ink-soft">Everything focused on learn &rarr; practice &rarr; ace it.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: "Smart notes", desc: "High-yield summaries with diagrams, mnemonics, and exam hints.", badge: "Bite-sized", icon: BookOpen, color: "from-violet-500 to-fuchsia-500" },
            { title: "Practice bank", desc: "Timed questions by topic with instant mark schemes, mirroring real papers.", badge: "Exam-style", icon: Rocket, color: "from-orange-500 to-amber-500" },
            { title: "Flashcards + streaks", desc: "Daily decks with streaks and adaptive spacing that lock facts in for good.", badge: "Memory-proof", icon: Layers, color: "from-teal-500 to-emerald-500" },
          ].map((card) => (
            <Card key={card.title} className="flex flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-md">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                <card.icon className="h-6 w-6" />
              </div>
              <Badge color="violet" className="w-fit">{card.badge}</Badge>
              <h3 className="font-heading text-xl font-bold text-ink">{card.title}</h3>
              <p className="text-ink-soft">{card.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto mt-20 w-full max-w-6xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-bold uppercase tracking-wide text-ink-soft">About us</p>
          <h2 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">Built by exam nerds, for exam takers.</h2>
          <p className="max-w-3xl text-ink-soft">
            We&apos;re former top scorers and teachers who sat these exact exams &mdash; IGCSE, A Levels, AP, SAT, IELTS,
            and HSK. Examly stays fun, exam-board aligned, and tested with real students.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Aisha Rahman", role: "Curriculum Lead · IGCSE / A Levels", note: "Ex-Cambridge examiner; Physics & Chem specialist.", color: "from-violet-400 to-fuchsia-500" },
            { name: "Liam Chen", role: "Assessment Lead · AP / SAT / HSK", note: "Built adaptive drills; HSK 6 certified.", color: "from-orange-400 to-amber-500" },
            { name: "Sofia Martinez", role: "Learning Science · IELTS / Writing", note: "IELTS band 8.5 coach & cognitive scientist.", color: "from-teal-400 to-emerald-500" },
          ].map((person) => (
            <Card key={person.name} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-heading font-bold text-ink">{person.name}</p>
                  <p className="text-sm font-semibold text-ink-soft">{person.role}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${person.color} text-white`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{person.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl">
        <Card className="overflow-hidden px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Ready?</p>
            <h3 className="font-heading text-2xl font-extrabold text-ink sm:text-3xl">Join Examly and get exam-ready, happily.</h3>
            <p className="max-w-xl text-ink-soft">Colorful, modern, and stress-free. Start free and keep your streak going.</p>
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
