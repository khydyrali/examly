-- Revert quiz.subject_paper_id and quiz_frq.subject_paper_id back to plain
-- text paper columns. subject_paper stays (it still backs the per-subject,
-- per-season paper picker on the past-paper page), but the quiz/quiz_frq row
-- itself just stores the paper name as text again instead of an FK.
--
-- HOW TO RUN: paste this file into the Supabase Dashboard (Project -> SQL
-- Editor -> New query) and run it AFTER 20260904130000_subject_paper_and_quiz_fk.sql,
-- or `supabase db push` if linked via CLI. Safe to re-run, including against a
-- database where a partial run already dropped subject_paper_id on one table
-- but not the other -- every update that reads subject_paper_id checks the
-- column still exists first.

alter table public.quiz add column if not exists paper text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz' and column_name = 'subject_paper_id'
  ) then
    update public.quiz q
    set paper = sp.name
    from public.subject_paper sp
    where sp.id = q.subject_paper_id
      and q.paper is null;
  end if;
end $$;

alter table public.quiz drop column if exists subject_paper_id;

alter table public.quiz_frq add column if not exists paper text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quiz_frq' and column_name = 'subject_paper_id'
  ) then
    update public.quiz_frq q
    set paper = sp.name
    from public.subject_paper sp
    where sp.id = q.subject_paper_id
      and q.paper is null;
  end if;
end $$;

alter table public.quiz_frq drop column if exists subject_paper_id;
