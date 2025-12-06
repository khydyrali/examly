# Flex Mobile (Flutter)

Lightweight mobile app skeleton for Flex: walkthrough, sign-in/register, exam board selection, subjects, notes, flashcards, topic quizzes, and past exams.

## Quick start
1) Install Flutter (3.4+ recommended) and ensure `flutter doctor` passes.
2) Enable Supabase Google provider (same project as web) and add redirect: `flexmobile://login-callback` to allowed redirects.
3) From `flex-mobile/`, run with your Supabase keys (or set in VS Code launch):
```
flutter pub get
flutter run --dart-define=SUPABASE_URL=https://<project>.supabase.co --dart-define=SUPABASE_ANON_KEY=<anon> --dart-define=SUPABASE_REDIRECT_URI=flexmobile://login-callback
```

## Structure
- `lib/main.dart` — Supabase init + auth (email/password + Google), walkthrough, board/subject picker, tabbed views (notes, flashcards, quizzes, past exams) pulling from Supabase tables: `revision_notes`, `flashcards`, `quizzes`, `past_exams`.
- State uses `provider`; replace/expand with your models as needed.

## Next steps
- Fill Supabase tables or adjust table names/columns to match your schema.
- Add CRUD/editing and richer drill views; cache offline if needed.
