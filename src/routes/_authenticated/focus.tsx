import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useReducer, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { Pause, Play, RotateCcw, Timer, Flame } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ErrorState } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { focus as focusClient, useTasks } from "@/hooks/use-data";
import { DURATIONS, formatTime, initialTimer, timerReducer, type TimerMode } from "@/lib/timer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({
    meta: [
      { title: "Focus — TaskNest" },
      { name: "description", content: "Pomodoro focus timer with daily session tracking." },
      { property: "og:title", content: "Focus — TaskNest" },
      { property: "og:description", content: "Pomodoro focus timer with daily session tracking." },
    ],
  }),
  component: FocusPage,
});

function FocusPage() {
  const qc = useQueryClient();
  const [state, dispatch] = useReducer(timerReducer, undefined, () => initialTimer());
  const [taskId, setTaskId] = useState<string | null>(null);
  const tasksQ = useTasks();
  const since = startOfDay(new Date());
  const sessionsQ = useQuery({ queryKey: ["focus", since.toISOString()], queryFn: () => focusClient.listSince(since) });
  const log = useMutation({
    mutationFn: (v: { taskId: string | null }) => focusClient.log(DURATIONS.focus / 60, v.taskId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["focus"] }); toast.success("Focus session complete — take a break!"); },
    onError: (e: Error) => toast.error(`Session not saved: ${e.message}`),
  });

  useEffect(() => {
    if (state.status !== "running") return;
    const id = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), 250);
    return () => clearInterval(id);
  }, [state.status]);

  const lastCompleted = useRef(0);
  useEffect(() => {
    if (state.completedFocus > lastCompleted.current) {
      lastCompleted.current = state.completedFocus;
      log.mutate({ taskId });
    }
  }, [state.completedFocus, taskId, log]);

  useEffect(() => {
    document.title = state.status === "running" ? `${formatTime(state.remaining)} · Focus — TaskNest` : "Focus — TaskNest";
  }, [state.remaining, state.status]);

  const total = DURATIONS[state.mode];
  const progress = 1 - state.remaining / total;
  const R = 120;
  const C = 2 * Math.PI * R;
  const sessions = sessionsQ.data ?? [];
  const minutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const taskTitle = (id: string | null) => tasksQ.data?.find((t) => t.id === id)?.title;
  const activeTasks = (tasksQ.data ?? []).filter((t) => !t.completed);

  return (
    <AppShell title="Focus">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Pomodoro timer" className="flex flex-col items-center rounded-3xl border bg-card p-6 sm:p-10">
          <div role="tablist" aria-label="Timer mode" className="flex rounded-xl bg-surface p-1">
            {(["focus", "break"] as TimerMode[]).map((m) => (
              <button key={m} role="tab" type="button" aria-selected={state.mode === m} onClick={() => dispatch({ type: "SET_MODE", mode: m })}
                className={cn("rounded-lg px-5 py-1.5 text-sm font-medium capitalize transition-colors", state.mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {m === "focus" ? "Focus · 25" : "Break · 5"}
              </button>
            ))}
          </div>

          <div className="relative mt-8 aspect-square w-full max-w-72">
            <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="140" cy="140" r={R} fill="none" strokeWidth="14" className="stroke-surface" />
              <circle cx="140" cy="140" r={R} fill="none" strokeWidth="14" strokeLinecap="round"
                className={cn("transition-[stroke-dashoffset] duration-300", state.mode === "focus" ? "stroke-primary" : "stroke-success")}
                strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-6xl font-bold tabular-nums" role="timer" aria-live="off">{formatTime(state.remaining)}</span>
              <span className="mt-1 text-sm capitalize text-muted-foreground">{state.status === "idle" ? `Ready to ${state.mode}` : state.status === "paused" ? "Paused" : state.mode === "focus" ? "Focusing" : "On a break"}</span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button type="button" onClick={() => dispatch({ type: "RESET" })} aria-label="Reset timer" className="grid h-12 w-12 place-items-center rounded-full bg-surface text-foreground hover:bg-muted">
              <RotateCcw className="h-5 w-5" />
            </button>
            {state.status === "running" ? (
              <button type="button" onClick={() => dispatch({ type: "PAUSE", now: Date.now() })} aria-label="Pause timer" className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform active:scale-95">
                <Pause className="h-7 w-7" />
              </button>
            ) : (
              <button type="button" onClick={() => dispatch({ type: "START", now: Date.now() })} aria-label={state.status === "paused" ? "Resume timer" : "Start timer"} className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform active:scale-95">
                <Play className="ml-1 h-7 w-7" />
              </button>
            )}
            <span className="h-12 w-12" aria-hidden="true" />
          </div>

          <div className="mt-8 w-full max-w-sm">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="focus-task">Focusing on</label>
            <Select value={taskId ?? "none"} onValueChange={(v) => setTaskId(v === "none" ? null : v)} disabled={tasksQ.isLoading}>
              <SelectTrigger id="focus-task" className="mt-1 rounded-xl"><SelectValue placeholder="No specific task" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific task</SelectItem>
                {activeTasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {!tasksQ.isLoading && activeTasks.length === 0 && <p className="mt-2 text-xs text-muted-foreground">No active tasks — you can still focus freely.</p>}
          </div>
        </section>

        <aside aria-label="Today's focus" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-primary/25 bg-card p-4 text-center">
              <Timer className="mx-auto h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-2 font-display text-3xl font-bold">{sessionsQ.isLoading ? "–" : minutes}</p>
              <p className="text-xs text-muted-foreground">Minutes today</p>
            </div>
            <div className="rounded-2xl border border-high/25 bg-card p-4 text-center">
              <Flame className="mx-auto h-5 w-5 text-high" aria-hidden="true" />
              <p className="mt-2 font-display text-3xl font-bold">{sessionsQ.isLoading ? "–" : sessions.length}</p>
              <p className="text-xs text-muted-foreground">Sessions today</p>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <h2 className="text-sm font-semibold">Today's sessions</h2>
            <div className="mt-3">
              {sessionsQ.isLoading ? (
                <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
              ) : sessionsQ.isError ? (
                <ErrorState message={(sessionsQ.error as Error).message} onRetry={() => sessionsQ.refetch()} />
              ) : sessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No sessions yet. Start your first 25 minutes!</p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">{taskTitle(s.task_id) ?? "Free focus"}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{s.minutes}m · {format(new Date(s.completed_at), "h:mm a")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
