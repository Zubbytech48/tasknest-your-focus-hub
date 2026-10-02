import type { SupabaseClient } from "@supabase/supabase-js";
import { validateTask, type Task, type TaskInput } from "./tasks-logic";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  body: string;
  task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  minutes: number;
  completed_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function tasksApi(client: Client) {
  return {
    async list(): Promise<Task[]> {
      return unwrap(await client.from("tasks").select("*").order("created_at", { ascending: false }));
    },
    async create(input: TaskInput): Promise<Task> {
      const v = validateTask(input);
      if (!v.ok) throw new Error(v.error);
      return unwrap(await client.from("tasks").insert(v.data).select().single());
    },
    async update(id: string, input: TaskInput): Promise<Task> {
      const v = validateTask(input);
      if (!v.ok) throw new Error(v.error);
      return unwrap(await client.from("tasks").update(v.data).eq("id", id).select().single());
    },
    async setCompleted(id: string, completed: boolean): Promise<Task> {
      return unwrap(await client.from("tasks").update({ completed }).eq("id", id).select().single());
    },
    async remove(id: string): Promise<void> {
      const { error } = await client.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}

export interface NotePatch {
  title?: string;
  body?: string;
  task_id?: string | null;
}

export function notesApi(client: Client) {
  return {
    async list(): Promise<Note[]> {
      return unwrap(await client.from("notes").select("*").order("updated_at", { ascending: false }));
    },
    async create(patch: NotePatch = {}): Promise<Note> {
      return unwrap(await client.from("notes").insert({ title: "", body: "", ...patch }).select().single());
    },
    async save(id: string, patch: NotePatch): Promise<Note> {
      const clean: NotePatch = { ...patch };
      if (clean.title !== undefined) clean.title = clean.title.slice(0, 200);
      if (clean.body !== undefined) clean.body = clean.body.slice(0, 20000);
      return unwrap(await client.from("notes").update(clean).eq("id", id).select().single());
    },
    async remove(id: string): Promise<void> {
      const { error } = await client.from("notes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
  };
}

export function focusApi(client: Client) {
  return {
    async listSince(since: Date): Promise<FocusSession[]> {
      return unwrap(
        await client
          .from("focus_sessions")
          .select("*")
          .gte("completed_at", since.toISOString())
          .order("completed_at", { ascending: false }),
      );
    },
    async log(minutes: number, taskId: string | null): Promise<FocusSession> {
      if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 180) throw new Error("Invalid minutes");
      return unwrap(
        await client.from("focus_sessions").insert({ minutes, task_id: taskId }).select().single(),
      );
    },
  };
}

export function filterNotes(notes: Note[], search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(q));
}
