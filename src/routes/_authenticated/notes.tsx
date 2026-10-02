import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Check, CloudOff, Loader2, NotebookPen, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, ErrorState } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { notes as notesClient, useTasks } from "@/hooks/use-data";
import { filterNotes, type Note, type NotePatch } from "@/lib/api";
import { createAutosaver, type SaveStatus } from "@/lib/autosave";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Notes — TaskNest" },
      { name: "description", content: "Autosaving notes you can link to your tasks." },
      { property: "og:title", content: "Notes — TaskNest" },
      { property: "og:description", content: "Autosaving notes you can link to your tasks." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["notes"], queryFn: notesClient.list });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Note | null>(null);

  const create = useMutation({
    mutationFn: () => notesClient.create(),
    onSuccess: (n) => {
      qc.setQueryData<Note[]>(["notes"], (old) => [n, ...(old ?? [])]);
      setSelected(n.id);
      toast.success("Note created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => notesClient.remove(id),
    onSuccess: (_d, id) => {
      qc.setQueryData<Note[]>(["notes"], (old) => old?.filter((n) => n.id !== id));
      if (selected === id) setSelected(null);
      toast.success("Note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = useMemo(() => filterNotes(q.data ?? [], search), [q.data, search]);
  const current = q.data?.find((n) => n.id === selected) ?? null;

  return (
    <AppShell title="Notes">
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section aria-label="Notes list" className={cn(current && "hidden lg:block")}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input aria-label="Search notes" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl pl-9" />
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending} className="rounded-xl shadow-glow" aria-label="New note">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>
          <div className="mt-4">
            {q.isLoading ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : q.isError ? (
              <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
            ) : list.length === 0 ? (
              <EmptyState
                icon={NotebookPen}
                title={(q.data?.length ?? 0) === 0 ? "No notes yet" : "No matching notes"}
                text={(q.data?.length ?? 0) === 0 ? "Jot down ideas, meeting notes or anything on your mind." : "Try another search."}
                action={(q.data?.length ?? 0) === 0 ? <Button className="rounded-xl" onClick={() => create.mutate()}><Plus className="h-4 w-4" /> Write a note</Button> : undefined}
              />
            ) : (
              <ul className="space-y-2">
                {list.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(n.id)}
                      aria-current={selected === n.id}
                      className={cn("w-full rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/30", selected === n.id && "border-primary/60 bg-accent/40")}
                    >
                      <p className="truncate font-semibold">{n.title || "Untitled note"}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{n.body || "No content"}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Edited {formatDistanceToNow(new Date(n.updated_at), { addSuffix: true })}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Note editor" className={cn(!current && "hidden lg:block")}>
          {current ? (
            <NoteEditor key={current.id} note={current} onBack={() => setSelected(null)} onDelete={() => setToDelete(current)} />
          ) : (
            <div className="grid h-full min-h-72 place-items-center rounded-3xl border border-dashed text-sm text-muted-foreground">
              Select a note or create a new one.
            </div>
          )}
        </section>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title || "Untitled note"}" will be removed permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (toDelete) remove.mutate(toDelete.id); setToDelete(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map = {
    idle: { icon: Check, text: "All changes saved", cls: "text-muted-foreground" },
    saved: { icon: Check, text: "Saved", cls: "text-success" },
    pending: { icon: Loader2, text: "Editing…", cls: "text-muted-foreground" },
    saving: { icon: Loader2, text: "Saving…", cls: "text-muted-foreground" },
    error: { icon: CloudOff, text: "Couldn't save — retrying on next edit", cls: "text-destructive" },
  }[status];
  return (
    <span role="status" className={cn("inline-flex items-center gap-1.5 text-xs font-medium", map.cls)}>
      <map.icon className={cn("h-3.5 w-3.5", status === "saving" && "animate-spin")} aria-hidden="true" />
      {map.text}
    </span>
  );
}

function NoteEditor({ note, onBack, onDelete }: { note: Note; onBack: () => void; onDelete: () => void }) {
  const qc = useQueryClient();
  const tasksQ = useTasks();
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [taskId, setTaskId] = useState<string | null>(note.task_id);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saverRef = useRef<ReturnType<typeof createAutosaver<NotePatch>> | null>(null);

  if (!saverRef.current) {
    saverRef.current = createAutosaver<NotePatch>(
      async (patch) => {
        const saved = await notesClient.save(note.id, patch);
        qc.setQueryData<Note[]>(["notes"], (old) => old?.map((n) => (n.id === saved.id ? saved : n)));
      },
      { delay: 700, onStatus: setStatus },
    );
  }

  useEffect(() => {
    const s = saverRef.current;
    return () => { void s?.flush(); };
  }, []);

  const push = (patch: Partial<{ title: string; body: string; task_id: string | null }>) => {
    const next = { title, body, task_id: taskId, ...patch };
    saverRef.current?.schedule(next);
  };

  return (
    <div className="rounded-3xl border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden">
          <ArrowLeft className="h-4 w-4" /> All notes
        </button>
        <SaveIndicator status={status} />
        <button type="button" onClick={onDelete} aria-label="Delete note" className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input
        aria-label="Note title"
        placeholder="Untitled note"
        value={title}
        maxLength={200}
        onChange={(e) => { setTitle(e.target.value); push({ title: e.target.value }); }}
        className="mt-4 w-full bg-transparent font-display text-2xl font-bold outline-none placeholder:text-muted-foreground/60"
      />
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Linked task</span>
        <Select
          value={taskId ?? "none"}
          onValueChange={(v) => { const id = v === "none" ? null : v; setTaskId(id); push({ task_id: id }); }}
          disabled={tasksQ.isLoading}
        >
          <SelectTrigger aria-label="Link to task" className="h-8 w-auto max-w-64 rounded-lg text-xs"><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {(tasksQ.data ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <textarea
        aria-label="Note body"
        placeholder="Start writing…"
        value={body}
        maxLength={20000}
        onChange={(e) => { setBody(e.target.value); push({ body: e.target.value }); }}
        className="mt-4 min-h-[50vh] w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
