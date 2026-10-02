import { z } from "zod";

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  category: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export type StatusFilter = "all" | "active" | "completed";
export type SortKey = "due_date" | "priority" | "created_at";

export const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
export const CATEGORIES = ["Work", "Personal", "Health", "Study", "Errands"] as const;

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .optional()
    .transform((v) => (v ? v : null)),
  due_date: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v).toISOString() : null))
    .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Invalid date"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z
    .string()
    .trim()
    .max(40, "Category is too long")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type TaskInput = z.input<typeof taskInputSchema>;
export type TaskPayload = z.output<typeof taskInputSchema>;

export function validateTask(input: TaskInput):
  | { ok: true; data: TaskPayload }
  | { ok: false; error: string } {
  const r = taskInputSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, error: r.error.issues[0]?.message ?? "Invalid task" };
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function filterTasks(
  tasks: Task[],
  opts: { status?: StatusFilter; search?: string; day?: Date | null },
): Task[] {
  const q = (opts.search ?? "").trim().toLowerCase();
  return tasks.filter((t) => {
    if (opts.status === "active" && t.completed) return false;
    if (opts.status === "completed" && !t.completed) return false;
    if (opts.day) {
      if (!t.due_date || !isSameDay(new Date(t.due_date), opts.day)) return false;
    }
    if (q) {
      const hay = `${t.title} ${t.description ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function sortTasks(tasks: Task[], key: SortKey): Task[] {
  const copy = [...tasks];
  copy.sort((a, b) => {
    if (key === "priority") {
      const d = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (d !== 0) return d;
    }
    if (key === "due_date") {
      if (a.due_date && b.due_date) {
        const d = Date.parse(a.due_date) - Date.parse(b.due_date);
        if (d !== 0) return d;
      } else if (a.due_date) return -1;
      else if (b.due_date) return 1;
    }
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
  return copy;
}

export function isOverdue(t: Task, now = new Date()) {
  return !t.completed && !!t.due_date && Date.parse(t.due_date) < now.getTime();
}

export function computeStats(tasks: Task[], now = new Date()) {
  const done = tasks.filter((t) => t.completed).length;
  const urgent = tasks.filter((t) => !t.completed && (t.priority === "high" || isOverdue(t, now))).length;
  return { total: tasks.length, done, pending: tasks.length - done, urgent };
}

/** Convert ISO to value accepted by <input type="datetime-local"> */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
