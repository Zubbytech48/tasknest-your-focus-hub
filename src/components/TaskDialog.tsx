import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORIES, toLocalInput, validateTask, type Priority, type Task, type TaskInput } from "@/lib/tasks-logic";

const priorities: { value: Priority; label: string; cls: string }[] = [
  { value: "low", label: "Low", cls: "data-[on=true]:bg-low/15 data-[on=true]:text-low data-[on=true]:border-low" },
  { value: "medium", label: "Medium", cls: "data-[on=true]:bg-medium/15 data-[on=true]:text-medium data-[on=true]:border-medium" },
  { value: "high", label: "High", cls: "data-[on=true]:bg-high/15 data-[on=true]:text-high data-[on=true]:border-high" },
];

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  defaultDate?: Date | null;
  onSubmit: (input: TaskInput) => Promise<unknown>;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setCategory(task?.category ?? "");
    if (task) setDue(toLocalInput(task.due_date));
    else if (defaultDate) {
      const d = new Date(defaultDate);
      d.setHours(9, 0, 0, 0);
      setDue(toLocalInput(d.toISOString()));
    } else setDue("");
  }, [open, task, defaultDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: TaskInput = { title, description, due_date: due || null, priority, category };
    const v = validateTask(input);
    if (!v.ok) return setError(v.error);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch {
      /* toast shown by mutation */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>{task ? "Update the details below." : "What do you want to get done?"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} autoFocus aria-invalid={!!error} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="t-desc" rows={3} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Due</Label>
              <Input id="t-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-cat">Category</Label>
              <Input id="t-cat" list="t-cats" maxLength={40} placeholder="e.g. Work" value={category} onChange={(e) => setCategory(e.target.value)} />
              <datalist id="t-cats">
                {CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Priority</legend>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  data-on={priority === p.value}
                  aria-pressed={priority === p.value}
                  onClick={() => setPriority(p.value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface ${p.cls}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending} className="rounded-xl shadow-glow">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
