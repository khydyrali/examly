# FlexPrep — Study Hub (Next.js + Supabase)

Modern study/landing experience for IGCSE, AS/A Levels, and AP. Includes Supabase auth with email/password, Google login, signup, and full password reset flow.

## Getting started
1) Copy env vars and fill from Supabase:
```
cp .env.example .env.local
```
Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2) Install deps and run dev:
```
npm install
npm run dev
```
Visit `http://localhost:3000`.

## Auth + Supabase setup
- **Email/password & Google**: Enable Google provider in Supabase. Use your site URL as an auth redirect (e.g., `http://localhost:3000` for local). The app uses Supabase client-side auth for login, signup, Google OAuth, and password reset.
- **Password reset flow**: `/forgot-password` sends a reset link that redirects to `/reset-password`, where users set a new password (`supabase.auth.updateUser`). Ensure the redirect URL is allowed in Supabase.
- **Env vars**: Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` available. For production, set them in your hosting provider.

## Key routes
- `/` — landing page focused on study benefits.
- `/signup` — email/Google signup.
- `/login` — email/Google login.
- `/forgot-password` — request reset link.
- `/reset-password` — set a new password after email link.
- `/dashboard` — protected content (gated by `AuthGuard`).

## App structure
- `app/page.tsx` — landing page.
- `app/(auth)/*` — auth flows (login, signup, forgot password, reset password).
- `app/(protected)/*` — gated content with `AuthGuard`.
- `components/providers/SupabaseProvider` — Supabase client/session context.

## Notes
- Lock down your Supabase tables with RLS to the roles/users you want.
- Update CTA links or copy to fit your brand; visuals are intentionally concise and study-focused. 
