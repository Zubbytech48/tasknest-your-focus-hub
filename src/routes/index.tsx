import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, NotebookPen, Timer, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useGuestLogin } from "@/hooks/use-guest";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskNest — Plan, note and focus in one calm place" },
      { name: "description", content: "TaskNest combines a to-do list, autosaving notes and a Pomodoro focus timer." },
      { property: "og:title", content: "TaskNest — Plan, note and focus in one calm place" },
      { property: "og:description", content: "A to-do list, autosaving notes and a Pomodoro focus timer." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: CheckCircle2, title: "Tasks", text: "Priorities, categories, due dates, search and sorting." },
  { icon: NotebookPen, title: "Notes", text: "Autosaving notes you can link to any task." },
  { icon: Timer, title: "Focus", text: "25/5 Pomodoro sessions tracked every day." },
];

function Landing() {
  const guest = useGuestLogin();
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Sign in
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-12 sm:pt-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your calm daily planner</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-6xl">
          Plan the day. Capture the thought. Finish the thing.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          TaskNest keeps your tasks, notes and focus sessions together — so the only thing left is doing the work.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-2xl shadow-glow">
            <Link to="/auth">Create free account</Link>
          </Button>
          <Button size="lg" variant="secondary" className="rounded-2xl" onClick={guest.start} disabled={guest.loading}>
            {guest.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue as guest
          </Button>
        </div>
        <ul className="mt-16 grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="rounded-3xl border bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
