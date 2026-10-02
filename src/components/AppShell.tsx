import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ListChecks, NotebookPen, Timer, Moon, Sun, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { Logo } from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/focus", label: "Focus", icon: Timer },
] as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const { theme, toggle } = useTheme();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isGuest = !!user.user_metadata?.["is_guest"];
  const name = isGuest ? "Guest" : (user.email?.split("@")[0] ?? "there");
  const initials = name.slice(0, 2).toUpperCase();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-dvh bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r p-5 md:flex">
        <Link to="/tasks" aria-label="TaskNest">
          <Logo />
        </Link>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "!bg-accent !text-accent-foreground" }}
            >
              <n.icon className="h-5 w-5" aria-hidden="true" />
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 pb-2 pt-6 md:px-10 md:pt-10">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{greeting()},</p>
            <h1 className="truncate text-2xl font-bold capitalize sm:text-3xl">{title ?? name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-11 w-11 place-items-center rounded-full bg-surface text-foreground transition-colors hover:bg-muted"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="grid h-11 w-11 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-glow"
              >
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {isGuest ? "Demo guest account" : user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-5 pb-32 pt-4 md:px-10 md:pb-12">{children}</main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-1 rounded-3xl border bg-card/95 p-1.5 backdrop-blur md:hidden"
      >
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-medium text-muted-foreground"
            activeProps={{ className: "!bg-accent !text-accent-foreground" }}
          >
            <n.icon className="h-5 w-5" aria-hidden="true" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: typeof ListChecks; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-center">
      <p className="font-medium text-destructive">Couldn't load your data</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-medium hover:bg-muted">
        Try again
      </button>
    </div>
  );
}
