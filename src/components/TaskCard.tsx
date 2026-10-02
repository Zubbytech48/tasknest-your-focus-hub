import { Check, Clock, Pencil, Trash2, Tag, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { isOverdue, type Task } from "@/lib/tasks-logic";
import { cn } from "@/lib/utils";

const bar = { high: "bg-high", medium: "bg-medium", low: "bg-low" } as const;
const dot = { high: "text-high", medium: "text-medium", low: "text-low" } as const;

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(task);
  return (
    <li className="group relative flex gap-3 overflow-hidden rounded-2xl border bg-card p-4 pl-5 transition-all hover:border-primary/30">
      <span className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full", task.completed ? "bg-success" : bar[task.priority])} aria-hidden="true" />
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        onClick={onToggle}
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-all duration-200",
          task.completed ? "border-success bg-success text-primary-foreground" : "border-muted-foreground/40 hover:border-primary",
        )}
      >
        {task.completed && <Check key="c" className="h-4 w-4 animate-check-pop" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn("text-base font-semibold transition-colors", task.completed && "text-muted-foreground line-through")}>
            {task.title}
          </h3>
          <span className={cn("inline-flex shrink-0 items-center gap-1 text-xs font-semibold capitalize", dot[task.priority])}>
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> {task.priority}
          </span>
        </div>
        {task.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {task.category && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 font-medium text-accent-foreground">
              <Tag className="h-3 w-3" aria-hidden="true" /> {task.category}
            </span>
          )}
          {task.due_date && (
            <span className={cn("inline-flex items-center gap-1 text-muted-foreground", overdue && "font-medium text-high")}>
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {format(new Date(task.due_date), "EEE d MMM · h:mm a")}
              {overdue && " · overdue"}
            </span>
          )}
          <span className="ml-auto flex gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <button type="button" onClick={onEdit} aria-label={`Edit "${task.title}"`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} aria-label={`Delete "${task.title}"`} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </span>
        </div>
      </div>
    </li>
  );
}
