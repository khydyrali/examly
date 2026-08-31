-- Enable Row Level Security on every table used by the app, and add policies
-- matching how the app actually queries them.
--
-- WHY: an anonymous-key probe against this project confirmed the following
-- tables currently return data (or would accept writes) to ANY unauthenticated
-- request, with no login required:
--   student_flashcard   (847 rows readable)
--   exam                (4 rows readable)
--   exam_questions      (317 rows readable -- includes the `answer` column)
--   exam_students       (10 rows readable -- other students' scores)
--   student_exam_answer (554 rows readable -- other students' answers)
-- subject/program/chapter/note/flashcard/quiz/quiz_frq/year/season/paper
-- already returned 0 rows to the anon key, which is consistent with RLS
-- already blocking anonymous access there -- this migration still enables
-- RLS + explicit policies on them for defense in depth, in case that was
-- luck rather than policy.
--
-- HOW TO RUN: paste this whole file into the Supabase Dashboard
-- (Project -> SQL Editor -> New query) and run it, or `supabase db push`
-- if you've linked this repo to the project with the CLI.
--
-- ASSUMPTION TO VERIFY: the app decodes a custom `user_role` claim from the
-- JWT (checking app_metadata, then user_metadata, then a top-level claim --
-- see components/auth/AuthGuard.tsx). The helper function below mirrors that
-- exact lookup so "admin" policies match what the app itself treats as admin.
-- If your admin role is granted differently, adjust current_user_role().

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'user_role',
    auth.jwt() -> 'user_metadata' ->> 'user_role',
    auth.jwt() ->> 'user_role'
  );
$$;

-- ---------------------------------------------------------------------------
-- Content / reference tables: any signed-in user can read, only admins write.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'program', 'subject', 'chapter', 'year', 'season', 'paper',
    'note', 'flashcard', 'quiz', 'quiz_frq', 'exam', 'exam_questions'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_select_authenticated', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true);',
      t || '_select_authenticated', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_admin_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.current_user_role() = ''admin'') with check (public.current_user_role() = ''admin'');',
      t || '_admin_write', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Student-owned tables: a student can only see/write their own rows.
-- Cast both sides to text so this works whether student_id is uuid or text.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['student_flashcard', 'student_exam_answer', 'exam_students']
  loop
    execute format('alter table public.%I enable row level security;', t);

    execute format('drop policy if exists %I on public.%I;', t || '_own_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (student_id::text = auth.uid()::text);',
      t || '_own_select', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_own_insert', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (student_id::text = auth.uid()::text);',
      t || '_own_insert', t
    );

    execute format('drop policy if exists %I on public.%I;', t || '_own_update', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (student_id::text = auth.uid()::text) with check (student_id::text = auth.uid()::text);',
      t || '_own_update', t
    );

    -- Admins can read every student's rows (handy for future grading/analytics
    -- UI). No admin write policy is added on purpose -- nothing in the app
    -- writes these on a student's behalf today.
    execute format('drop policy if exists %I on public.%I;', t || '_admin_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_user_role() = ''admin'');',
      t || '_admin_select', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles: the anon key currently can't even see this table exists (good
-- sign), but add row-level scoping for authenticated users too.
-- VERIFY the primary key column name below before running -- this assumes
-- `id` references auth.users.id, which is the standard Supabase pattern.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles enable row level security;';

    execute 'drop policy if exists profiles_own_select on public.profiles;';
    execute 'create policy profiles_own_select on public.profiles for select to authenticated using (id::text = auth.uid()::text);';

    execute 'drop policy if exists profiles_own_update on public.profiles;';
    execute 'create policy profiles_own_update on public.profiles for update to authenticated using (id::text = auth.uid()::text) with check (id::text = auth.uid()::text);';

    execute 'drop policy if exists profiles_admin_select on public.profiles;';
    execute 'create policy profiles_admin_select on public.profiles for select to authenticated using (public.current_user_role() = ''admin'');';
  end if;
end $$;
