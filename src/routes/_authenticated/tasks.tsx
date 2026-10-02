import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, ListChecks, CheckCircle2, Clock3, Flame, Plus, Search } from "lucide-react";
import { AppShell, EmptyState, ErrorState } from "@/components/AppShell";
import { TaskCard } from "@/components/TaskCard";
import { TaskDialog } from "@/components/TaskDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTaskMutations, useTasks } from "@/hooks/use-data";
import { computeStats, filterTasks, isSameDay, sortTasks, type SortKey, type StatusFilter, type Task } from "@/lib/tasks-logic";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — TaskNest" },
      { name: "description", content: "Your tasks, priorities and plan for the day." },
      { property: "og:title", content: "Tasks — TaskNest" },
      { property: "og:description", content: "Your tasks, priorities and plan for the day." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const q = useTasks();
  const m = useTaskMutations();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("due_date");
  const [day, setDay] = useState<Date | null>(null);
  const [weekStart, setWeekStart] = useState(() => addDays(startOfDay(new Date()), -3));
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const all = q.data ?? [];
  const dayTasks = useMemo(() => filterTasks(all, { day }), [all, day]);
  const stats = computeStats(dayTasks);
  const visible = useMemo(
    () => sortTasks(filterTasks(all, { status, search, day }), sort),
    [all, status, search, day, sort],
  );
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const statCards = [
    { label: "Total", value: stats.total, icon: ListChecks, cls: "text-primary border-primary/25" },
    { label: "Done", value: stats.done, icon: CheckCircle2, cls: "text-success border-success/25" },
    { label: "Pending", value: stats.pending, icon: Clock3, cls: "text-medium border-medium/25" },
    { label: "Urgent", value: stats.urgent, icon: Flame, cls: "text-high border-high/25" },
  ];

  return (
    <AppShell>
      {/* Date strip */}
      <section aria-label="Choose a day" className="flex items-center gap-1">
        <button type="button" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))} className="grid h-10 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="grid flex-1 grid-cols-7 gap-1">
          {days.map((d) => {
            const active = day && isSameDay(d, day);
            const isToday = isSameDay(d, today);
            const has = all.some((t) => t.due_date && isSameDay(new Date(t.due_date), d));
            return (
              <button
                key={d.toISOString()}
                type="button"
                aria-pressed={!!active}
                aria-label={format(d, "EEEE d MMMM")}
                onClick={() => setDay(active ? null : d)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2 transition-all",
                  active ? "bg-accent" : "hover:bg-surface",
                )}
              >
                <span className={cn("text-xs font-semibold", active || isToday ? "text-primary" : "text-muted-foreground")}>{format(d, "EEEEE")}</span>
                <span className={cn("grid h-10 w-10 place-items-center rounded-full text-base font-semibold transition-all sm:h-11 sm:w-11", active && "bg-primary text-primary-foreground shadow-glow", !active && isToday && "ring-2 ring-primary/50")}>
                  {format(d, "d")}
                </span>
                <span className={cn("h-1.5 w-1.5 rounded-full", has ? "bg-foreground/70" : "bg-transparent")} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <button type="button" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))} className="grid h-10 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>

      {/* Stats */}
      <section aria-label="Summary" className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={cn("flex flex-col items-center rounded-2xl border bg-card px-1 py-4", s.cls)}>
            <s.icon className="h-5 w-5" aria-hidden="true" />
            <span className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">{q.isLoading ? "–" : s.value}</span>
            <span className="text-xs text-muted-foreground sm:text-sm">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{day ? (isSameDay(day, today) ? "Today's plan" : format(day, "EEEE's 'plan")) : "All tasks"}</h2>
        <Button onClick={() => setDialog({ open: true, task: null })} className="hidden rounded-xl shadow-glow md:inline-flex">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search tasks" placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl pl-9" />
        </div>
        <div role="tablist" aria-label="Filter by status" className="flex rounded-xl bg-surface p-1">
          {(["all", "active", "completed"] as const).map((s) => (
            <button key={s} role="tab" aria-selected={status === s} type="button" onClick={() => setStatus(s)}
              className={cn("flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors", status === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              {s}
            </button>
          ))}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger aria-label="Sort tasks" className="rounded-xl sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">Sort: Due date</SelectItem>
            <SelectItem value="priority">Sort: Priority</SelectItem>
            <SelectItem value="created_at">Sort: Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5" aria-live="polite">
        {q.isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : q.isError ? (
          <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={all.length === 0 ? "Your nest is empty" : "Nothing matches"}
            text={all.length === 0 ? "Add your first task and start shaping your day." : "Try a different filter, day or search."}
            action={<Button onClick={() => setDialog({ open: true, task: null })} className="rounded-xl"><Plus className="h-4 w-4" /> Add a task</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onToggle={() => m.toggle.mutate({ id: t.id, completed: !t.completed })}
                onEdit={() => setDialog({ open: true, task: t })}
                onDelete={() => setToDelete(t)}
              />
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        aria-label="Add task"
        onClick={() => setDialog({ open: true, task: null })}
        className="fixed bottom-24 right-5 z-40 grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform active:scale-95 md:hidden"
      >
        <Plus className="h-7 w-7" />
      </button>

      <TaskDialog
        open={dialog.open}
        task={dialog.task}
        defaultDate={day}
        pending={m.create.isPending || m.update.isPending}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        onSubmit={(input) => (dialog.task ? m.update.mutateAsync({ id: dialog.task.id, input }) : m.create.mutateAsync(input))}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" will be removed permanently. Linked notes are kept.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (toDelete) m.remove.mutate(toDelete.id); setToDelete(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
