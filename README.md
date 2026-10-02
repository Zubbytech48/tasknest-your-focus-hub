# TaskNest
Tasks, autosaving notes and a Pomodoro focus timer.

**Features:** task CRUD with priority/category/due date, search, filter, sort, day strip & stats; notes with debounced autosave and task linking; 25/5 focus timer with daily session tracking; email/password auth + guest demo; light/dark mode.

**Stack:** TanStack Start, React, TypeScript, Tailwind CSS, Lovable Cloud (database + auth), Vitest.

**Setup:** `bun install && bun run dev`. Env vars (auto-provided by Lovable Cloud): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, server-side `SUPABASE_SERVICE_ROLE_KEY` (guest accounts).

**Tests:** `bunx vitest run`
