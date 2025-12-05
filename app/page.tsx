import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16">
      <div className="max-w-3xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Supabase Admin</p>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
          Manage quizzes, flashcards, and revision notes in one dashboard
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Secure admin UI built with Next.js App Router + Tailwind, authenticated via Supabase email/password. Use it to curate study content without touching SQL.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Sign in to admin
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 dark:border-gray-700 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:text-blue-300"
          >
            Go to dashboard
          </Link>
        </div>
        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-neutral-900/80 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Supabase auth</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email/password sign-in with session guard.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">CRUD for study data</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Quizzes, flashcards, and revision notes editors.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">Supabase tables</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Connect via public URL/anon key and RLS.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
