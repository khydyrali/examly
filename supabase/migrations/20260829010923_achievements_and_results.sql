-- Adds:
--   1. student_result -- self-reported exam results (e.g. "Math AA HL: 7",
--      "IGCSE Physics: A*"). Subject label and grade are both free text since
--      real qualifications/grading scales vary too much to constrain to the
--      app's internal `subject` table. Private to the student who added it
--      and deliberately NOT part of the leaderboard points formula, since
--      it's self-reported and unverified.
--   2. get_my_stats() -- a stats function the achievements page uses to
--      compute which badges are unlocked (badges themselves are just a
--      static list in the frontend, derived from these numbers -- no
--      separate "badges" table needed).
--
-- HOW TO RUN: paste into Supabase Dashboard -> SQL Editor -> Run. Requires
-- the two earlier migrations (RLS policies, then blog/tutors/leaderboard)
-- to already be applied, since it reuses current_user_role() and reads
-- student_flashcard / student_quiz_attempt / exam_students / compute_streak.

create table if not exists public.student_result (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  subject_label text not null,
  grade text not null,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.student_result enable row level security;

drop policy if exists student_result_own on public.student_result;
create policy student_result_own on public.student_result
  for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create or replace function public.get_my_stats()
returns table (
  mastered_count bigint,
  quiz_correct_count bigint,
  exams_submitted_count bigint,
  best_exam_percent integer,
  points bigint,
  streak_days integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.student_flashcard where student_id::text = auth.uid()::text and status = 'mastered'),
    (select count(*) from public.student_quiz_attempt where student_id = auth.uid() and is_correct),
    (select count(*) from public.exam_students where student_id::text = auth.uid()::text and is_submit),
    (select coalesce(max(percentage), 0)::integer from public.exam_students where student_id::text = auth.uid()::text and is_submit),
    (
      select (coalesce(m.cnt, 0) * 5 + coalesce(q.cnt, 0) * 2 + coalesce(e.pct_sum, 0) / 10)::bigint
      from
        (select count(*) as cnt from public.student_flashcard where student_id::text = auth.uid()::text and status = 'mastered') m,
        (select count(*) filter (where is_correct) as cnt from public.student_quiz_attempt where student_id = auth.uid()) q,
        (select coalesce(sum(percentage), 0) as pct_sum from public.exam_students where student_id::text = auth.uid()::text and is_submit) e
    ),
    public.compute_streak(auth.uid());
$$;

grant execute on function public.get_my_stats() to authenticated;
