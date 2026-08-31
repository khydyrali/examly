-- Adds schema + RLS for three new features:
--   1. Blog (tutors author posts; students read + like)
--   2. Tutor directory (tutors = the existing "teacher" role; students search them)
--   3. Leaderboard (auto-computed points + streaks from existing student activity)
--
-- HOW TO RUN: paste into Supabase Dashboard -> SQL Editor -> Run, or
-- `supabase db push` if this repo is linked via the CLI.
--
-- This file re-defines current_user_role() defensively (create or replace)
-- so it's self-contained even if you haven't run the earlier RLS migration
-- (20260829004438_enable_rls_and_policies.sql) in this session.
--
-- STORAGE NOTE: blog cover images and tutor avatars reuse the same storage
-- buckets/pattern already used by SubjectManager/ResourceManager (`main`
-- and `public`). If uploads fail with a permissions error, your storage
-- bucket policies (separate from table RLS, under Storage -> Policies) may
-- need to allow `authenticated` uploads -- that's outside what this file can
-- change since it only touches Postgres table/function grants.

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

-- ===========================================================================
-- 1. Blog
-- ===========================================================================
create table if not exists public.blog_post (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  cover_image text,
  content text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.blog_like (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_post(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.blog_post enable row level security;
alter table public.blog_like enable row level security;

drop policy if exists blog_post_select on public.blog_post;
create policy blog_post_select on public.blog_post
  for select to authenticated
  using (
    status = 'published'
    or author_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

drop policy if exists blog_post_author_write on public.blog_post;
create policy blog_post_author_write on public.blog_post
  for all to authenticated
  using (
    (author_id = auth.uid() and public.current_user_role() in ('teacher', 'admin'))
    or public.current_user_role() = 'admin'
  )
  with check (
    (author_id = auth.uid() and public.current_user_role() in ('teacher', 'admin'))
    or public.current_user_role() = 'admin'
  );

drop policy if exists blog_like_select on public.blog_like;
create policy blog_like_select on public.blog_like
  for select to authenticated using (true);

drop policy if exists blog_like_own_write on public.blog_like;
create policy blog_like_own_write on public.blog_like
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Lets any authenticated reader bump the view counter on a published post
-- without granting them UPDATE on blog_post directly.
create or replace function public.increment_blog_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_post
  set view_count = view_count + 1
  where id = p_post_id and status = 'published';
$$;

grant execute on function public.increment_blog_view(uuid) to authenticated;

-- ===========================================================================
-- 2. Tutor directory (tutors = users with user_role 'teacher')
-- ===========================================================================
create table if not exists public.tutor_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  experience_years integer,
  hourly_price numeric,
  currency text not null default 'USD',
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutor_subject (
  tutor_id uuid not null references public.tutor_profile(id) on delete cascade,
  subject_id bigint not null references public.subject(id) on delete cascade,
  primary key (tutor_id, subject_id)
);

alter table public.tutor_profile enable row level security;
alter table public.tutor_subject enable row level security;

drop policy if exists tutor_profile_select on public.tutor_profile;
create policy tutor_profile_select on public.tutor_profile
  for select to authenticated using (true);

drop policy if exists tutor_profile_own_write on public.tutor_profile;
create policy tutor_profile_own_write on public.tutor_profile
  for all to authenticated
  using (
    (id = auth.uid() and public.current_user_role() in ('teacher', 'admin'))
    or public.current_user_role() = 'admin'
  )
  with check (
    (id = auth.uid() and public.current_user_role() in ('teacher', 'admin'))
    or public.current_user_role() = 'admin'
  );

drop policy if exists tutor_subject_select on public.tutor_subject;
create policy tutor_subject_select on public.tutor_subject
  for select to authenticated using (true);

drop policy if exists tutor_subject_own_write on public.tutor_subject;
create policy tutor_subject_own_write on public.tutor_subject
  for all to authenticated
  using (
    exists (select 1 from public.tutor_profile tp where tp.id = tutor_subject.tutor_id and tp.id = auth.uid())
    or public.current_user_role() = 'admin'
  )
  with check (
    exists (select 1 from public.tutor_profile tp where tp.id = tutor_subject.tutor_id and tp.id = auth.uid())
    or public.current_user_role() = 'admin'
  );

-- ===========================================================================
-- 3. Leaderboard: two small tracking tables + a security-definer function
--    that aggregates points/streaks WITHOUT exposing the raw per-student
--    rows (those stay locked to their own owner via RLS below).
-- ===========================================================================
create table if not exists public.student_quiz_attempt (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  quiz_id bigint not null references public.quiz(id) on delete cascade,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.student_activity_log (
  student_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  primary key (student_id, activity_date)
);

alter table public.student_quiz_attempt enable row level security;
alter table public.student_activity_log enable row level security;

drop policy if exists student_quiz_attempt_own on public.student_quiz_attempt;
create policy student_quiz_attempt_own on public.student_quiz_attempt
  for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists student_activity_log_own on public.student_activity_log;
create policy student_activity_log_own on public.student_activity_log
  for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create or replace function public.compute_streak(p_student_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  d date := current_date;
  streak integer := 0;
begin
  loop
    exit when not exists (
      select 1 from public.student_activity_log
      where student_id = p_student_id and activity_date = d
    );
    streak := streak + 1;
    d := d - 1;
  end loop;
  return streak;
end;
$$;

grant execute on function public.compute_streak(uuid) to authenticated;

-- Points formula: 5 pts / mastered flashcard, 2 pts / correct topical-quiz
-- answer, plus (sum of submitted mock exam percentages) / 10. Adjust the
-- weights below if you want a different balance.
create or replace function public.get_leaderboard(limit_count integer default 200)
returns table (
  student_id uuid,
  display_name text,
  points bigint,
  streak_days integer,
  rank bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with mastered as (
    select student_flashcard.student_id, count(*) as cnt
    from public.student_flashcard
    where status = 'mastered'
    group by student_flashcard.student_id
  ),
  quiz_correct as (
    select student_quiz_attempt.student_id, count(*) filter (where is_correct) as cnt
    from public.student_quiz_attempt
    group by student_quiz_attempt.student_id
  ),
  exam_pts as (
    select exam_students.student_id, coalesce(sum(percentage), 0) as pct_sum
    from public.exam_students
    where is_submit = true
    group by exam_students.student_id
  ),
  totals as (
    select
      coalesce(m.student_id, q.student_id, e.student_id) as student_id,
      (coalesce(m.cnt, 0) * 5 + coalesce(q.cnt, 0) * 2 + coalesce(e.pct_sum, 0) / 10)::bigint as points
    from mastered m
    full outer join quiz_correct q on q.student_id = m.student_id
    full outer join exam_pts e on e.student_id = coalesce(m.student_id, q.student_id)
  )
  select
    t.student_id,
    coalesce(nullif(split_part(u.email, '@', 1), ''), 'Student') as display_name,
    t.points,
    public.compute_streak(t.student_id) as streak_days,
    rank() over (order by t.points desc) as rank
  from totals t
  join auth.users u on u.id = t.student_id
  where t.points > 0
  order by t.points desc
  limit limit_count;
$$;

grant execute on function public.get_leaderboard(integer) to authenticated;
