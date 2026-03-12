import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-sky-50 px-4 pb-20 pt-10 text-gray-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-indigo-200/50 blur-[110px]" />
        <div className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-200/50 blur-[90px]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full bg-white/70 px-4 py-4 shadow-sm backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30">
            FP
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">FlexPrep</p>
            <p className="text-xs text-slate-500">Study. Faster. Confident.</p>
          </div>
        </div>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <Link href="#tracks" className="hidden rounded-full px-3 py-2 hover:bg-slate-100 md:inline-flex">
            Tracks
          </Link>
          <Link href="#resources" className="hidden rounded-full px-3 py-2 hover:bg-slate-100 md:inline-flex">
            Resources
          </Link>
          <Link href="/login" className="rounded-full px-3 py-2 hover:bg-slate-100">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white shadow-md shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Start free
          </Link>
        </nav>
      </header>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-md shadow-slate-900/15">
            IGCSE / AS & A Levels / AP / SAT / IELTS
          </span>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            Modern study hub for exam boards you actually take.
          </h1>
          <p className="text-lg text-slate-700 sm:text-xl">
            Concise notes, exam-style practice, and flashcards built to mirror what appears on papers and test sections - from IGCSE/A Levels to AP, SAT, and IELTS.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              I already have an account
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              "Exam-board aligned summaries",
              "Timed practice with instant marking",
              "SAT math + evidence-based reading drills",
              "Track weak spots by topic",
              "HSK vocab + listening drills",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-100/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {item}
              </span>
            ))}
          </div>
          <div className="grid max-w-xl grid-cols-3 gap-3 rounded-2xl border border-white/30 bg-white/60 p-4 shadow-sm backdrop-blur sm:grid-cols-3">
            {[
              { label: "Questions practiced", value: "182k+" },
              { label: "Avg. grade lift", value: "+1.6" },
              { label: "Study streaks", value: "12 days" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 px-3 py-3 text-white shadow-sm shadow-slate-900/20">
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-xs text-slate-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-x-10 top-4 -z-10 h-72 rounded-3xl bg-gradient-to-br from-indigo-200/40 via-sky-100 to-emerald-100 blur-3xl" />
          <div className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-xl shadow-sky-200/40 backdrop-blur">
            <div className="rounded-2xl border border-slate-100 bg-white/95 px-5 py-4 text-slate-900 shadow-md shadow-slate-200/70">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live practice · Physics
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm shadow-slate-200/50">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Topic</p>
                  <p className="text-lg font-semibold text-slate-900">Electric circuits & energy transfer</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Question 1 of 12 - 2 marks - Explain why adding another resistor in parallel reduces total resistance.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                  {["More current flows", "Voltage increases", "Resistances add", "Circuit overheats"].map((opt, idx) => (
                    <div
                      key={opt}
                      className={`rounded-xl border px-3 py-3 transition ${
                        idx === 0
                          ? "border-emerald-300/70 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100/80"
                          : "border-slate-200 bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-inner shadow-slate-100/70 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Flashcards</p>
                  <p className="text-sm font-semibold text-slate-900">Organic Chemistry - AS</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Streak 9 days</span>
              </div>
              <div className="grid gap-2 rounded-xl border border-slate-100 bg-white/90 p-3 text-sm text-slate-800 shadow-sm">
                <p className="font-semibold text-slate-900">What makes a molecule optically active?</p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700 shadow-sm">
                  It must contain a chiral center (four different groups attached), causing non-superimposable mirror images.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Next spaced review in 8h</span>
                <div className="flex gap-2">
                  <div className="h-2 w-14 rounded-full bg-emerald-100">
                    <div className="h-2 w-10 rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-semibold text-emerald-700">82%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="tracks" className="mx-auto mt-20 w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-700">Exam coverage</p>
            <h2 className="text-2xl font-bold text-slate-900">Built for the syllabi you sit.</h2>
            <p className="text-slate-600">Short, modern, clearly organized by exam board and paper style - now with SAT, IELTS, and HSK coverage.</p>
          </div>
          <Link href="/signup" className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 md:inline-flex">
            Start now
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "IGCSE",
              accent: "from-sky-400 to-sky-600",
              items: ["Concise topic notes", "Structured by paper 1/2", "Past paper style Qs", "Maths, Physics, Chem, Bio"],
            },
            {
              name: "AS/A Levels",
              accent: "from-indigo-400 to-indigo-600",
              items: ["Analysis-first explanations", "Diagrams & worked examples", "Timed drills with marking schemes", "Essay scaffolds"],
            },
            {
              name: "SAT",
              accent: "from-amber-400 to-orange-500",
              items: ["Math section timing drills", "Evidence-based reading practice", "Writing & language error-spotting", "Score-style feedback"],
            },
            {
              name: "IELTS",
              accent: "from-rose-400 to-pink-500",
              items: ["Academic & General reading sets", "Listening scripts and clips", "Band-score style feedback", "Task 1/2 writing prompts"],
            },
            {
              name: "AP",
              accent: "from-emerald-400 to-emerald-600",
              items: ["Unit-aligned flashcards", "FRQ practice with rubrics", "Checkpoint quizzes", "Progress by Big Idea"],
            },
            {
              name: "HSK",
              accent: "from-emerald-300 to-cyan-500",
              items: ["Level 1-6 vocab decks", "Listening scripts and clips", "Reading clozes and short answers", "Tone + character drills"],
            },
          ].map((track) => (
            <div key={track.name} className="group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg">
              <div className={`absolute inset-x-0 -top-16 h-32 bg-gradient-to-b ${track.accent} opacity-20 blur-3xl transition group-hover:opacity-45`} />
              <div className="relative flex items-center justify-between">
                <div className="text-2xl font-bold text-slate-900">{track.name}</div>
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${track.accent} opacity-80`} />
              </div>
              <ul className="relative mt-4 space-y-2 text-sm text-slate-700">
                {track.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="resources" className="mx-auto mt-16 w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">What you get</div>
          <p className="text-slate-600">Everything focused on learn &rarr; test &rarr; improve.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Smart notes",
              desc: "High-yield summaries with diagrams, mnemonics, and exam hints so you remember the right details.",
              badge: "Bite-sized",
            },
            {
              title: "Practice bank",
              desc: "Timed questions by topic with instant marking schemes to mirror real papers - including SAT sections and IELTS tasks.",
              badge: "Exam-style",
            },
            {
              title: "Flashcards + spaced repetition",
              desc: "Daily decks with streaks, confidence ratings, and adaptive spacing to lock facts in long-term memory.",
              badge: "Memory-proof",
            },
          ].map((card) => (
            <div key={card.title} className="flex flex-col gap-3 rounded-2xl border border-slate-100/80 bg-white/80 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md">
              <span className="w-fit rounded-full bg-slate-900/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {card.badge}
              </span>
              <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
              <p className="text-slate-600">{card.desc}</p>
              <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-slate-900">
                <span>See a sample</span>
                <span aria-hidden="true">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto mt-16 w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">About us</p>
            <h2 className="text-2xl font-bold text-slate-900">Built by exam nerds for exam takers.</h2>
            <p className="max-w-3xl text-slate-600">
              We’re a small team of former top scorers and teachers who have sat the same exams-IGCSE, A Levels, AP, SAT, IELTS, and HSK.
              FlexPrep stays concise, exam-board aligned, and stress-tested with real students.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              {["Board-aligned syllabi", "Real past-paper patterns", "Fast feedback loops", "No filler, just recall power"].map((pill) => (
                <span key={pill} className="rounded-full bg-slate-100 px-3 py-2 text-slate-800">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Aisha Rahman", role: "Curriculum Lead · IGCSE / A Levels", note: "Ex-Cambridge examiner; Physics & Chem specialist." },
            { name: "Liam Chen", role: "Assessment Lead · AP / SAT / HSK", note: "Built adaptive drills; HSK 6 certified; AP Calc/Physics tutor." },
            { name: "Sofia Martinez", role: "Learning Science · IELTS / Writing", note: "Applied cognitive science; IELTS band 8.5 coach." },
          ].map((person) => (
            <div key={person.name} className="rounded-2xl border border-slate-100/80 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{person.name}</p>
                  <p className="text-sm font-medium text-slate-600">{person.role}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 opacity-80" />
              </div>
              <p className="mt-3 text-sm text-slate-700">{person.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-100/80 bg-white/90 px-6 py-10 text-slate-900 shadow-lg backdrop-blur sm:px-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Stay exam-ready</p>
            <h3 className="text-3xl font-bold">Weekly study plan, auto-built from your gaps.</h3>
            <p className="text-lg text-slate-700">
              FlexPrep looks at your weakest topics and builds a plan with notes, practice sets, and flashcards so you actually improve.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              {["Adapts to marks", "Reminder nudges", "Paper-style mocks", "Lightweight, no fluff"].map((pill) => (
                <span key={pill} className="rounded-full bg-slate-100 px-3 py-2 text-slate-800">
                  {pill}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">
                Start free plan
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5">
                Continue progress
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl border border-slate-100 bg-white/85 p-5 shadow-inner shadow-slate-100/60 backdrop-blur">
            <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="space-y-4 text-sm text-slate-800">
              <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Today</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">On track</span>
                </div>
                <ul className="mt-3 space-y-2">
                  {[
                    "Chemistry - Redox basics (15m notes + 10 Qs)",
                    "Biology - Enzyme kinetics flashcards",
                    "Maths - Mechanics mock (30 min)",
                  ].map((task) => (
                    <li key={task} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white/90 p-4 shadow-inner">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Focus areas</p>
                <div className="mt-3 space-y-3">
                  {[
                    { label: "Vectors & kinematics", pct: 76 },
                    { label: "Organic mechanisms", pct: 62 },
                    { label: "Cell respiration", pct: 84 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-slate-700">
                        <span>{item.label}</span>
                        <span>{item.pct}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 w-full max-w-6xl rounded-3xl border border-slate-100/80 bg-white/80 px-6 py-8 shadow-sm backdrop-blur sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Ready?</p>
            <h3 className="text-2xl font-bold text-slate-900">Join FlexPrep and get exam-ready faster.</h3>
            <p className="text-slate-600">Short, modern, clearly about study. Start free and keep your streak.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">
              Create account
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5">
              Log in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
