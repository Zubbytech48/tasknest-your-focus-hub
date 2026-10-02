<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# TaskNest — Agent Guide
**Overview:** To-dos + autosaving Notes + Pomodoro Focus. Email auth + guest demo.
**Stack:** TanStack Start, React 19, TS, Tailwind v4, shadcn, TanStack Query, Lovable Cloud, Vitest.
**Folders:** `src/routes` (protected pages in `_authenticated/`), `src/components`, `src/lib` (pure logic, `api.ts`, `*.functions.ts`), `src/hooks`, `tests/`.
**Naming:** PascalCase components, `use-*.ts` hooks, snake_case plural tables.
**Style:** strict TS; semantic color tokens only; loading/empty/error states on every view; toasts on mutations.
**Architecture:** logic pure in `src/lib`; data via injectable `tasksApi/notesApi/focusApi`; RLS `auth.uid() = user_id` on all tables; admin client only inside server handlers.
**Testing:** `bunx vitest run`. Policy: "Write a test for every API endpoint you create and always validate that these endpoints are working before marking a feature complete."
