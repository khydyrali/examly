# Study Admin (Next.js + Supabase)

Admin UI for managing quizzes, flashcards, and revision notes. Built with Next.js App Router, Tailwind CSS, and Supabase auth + database.

## Quick start

1) Copy env vars:
```
cp .env.example .env.local
```
Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project.

2) Install deps and run:
```
npm install
npm run dev
```
Visit `http://localhost:3000`. Use `/login` to sign in with an email/password user from Supabase.

## Supabase setup

Create these tables (plus default `created_at` timestamps and `id uuid primary key default gen_random_uuid()`):
```sql
-- quizzes
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject text,
  difficulty text,
  tags text,
  created_at timestamptz default now()
);

-- flashcards
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  front text not null,
  back text not null,
  subject text,
  tags text,
  created_at timestamptz default now()
);

-- revision notes
create table if not exists public.revision_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  subject text,
  tags text,
  created_at timestamptz default now()
);
```

### Auth / RLS
- Use Supabase email/password auth to sign in.
- Keep the anon key client-side. Lock tables with RLS so only your admin role/user can read/write:
```sql
alter table public.quizzes enable row level security;
alter table public.flashcards enable row level security;
alter table public.revision_notes enable row level security;

create policy "Admins can manage quizzes" on public.quizzes for all using (auth.uid() = auth.uid()) with check (auth.uid() = auth.uid());
create policy "Admins can manage flashcards" on public.flashcards for all using (auth.uid() = auth.uid()) with check (auth.uid() = auth.uid());
create policy "Admins can manage revision_notes" on public.revision_notes for all using (auth.uid() = auth.uid()) with check (auth.uid() = auth.uid());
```
Replace with tighter checks (e.g., restrict to an `is_admin` flag on `auth.users` or a join table).

## App structure
- `app/page.tsx` – landing page.
- `app/(auth)/login` – Supabase email/password sign-in.
- `app/(protected)/layout.tsx` – session guard + top nav.
- `app/(protected)/dashboard` – CRUD panels for quizzes, flashcards, revision notes.
- `components/providers/SupabaseProvider` – supabase client + session context.
- `components/admin/ResourceManager` – reusable CRUD widget per table.

## Usage notes
- The dashboard runs client-side CRUD against Supabase. Ensure RLS allows your signed-in admin user.
- To change fields, edit the `fields` config in `app/(protected)/dashboard/page.tsx`.
- To add more resource types, reuse `ResourceManager` with a new table and field list.

## Scripts
- `npm run dev` – start dev server
- `npm run lint` – lint with next/eslint
