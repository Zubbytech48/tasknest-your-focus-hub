import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { focusApi, notesApi, tasksApi } from "@/lib/api";
import type { Task, TaskInput } from "@/lib/tasks-logic";

export const tasks = tasksApi(supabase);
export const notes = notesApi(supabase);
export const focus = focusApi(supabase);

export function useTasks() {
  return useQuery({ queryKey: ["tasks"], queryFn: tasks.list });
}

export function useTaskMutations() {
  const qc = useQueryClient();
  const onErr = (e: Error) => toast.error(e.message);
  const create = useMutation({
    mutationFn: (i: TaskInput) => tasks.create(i),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task created"); },
    onError: onErr,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) => tasks.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task updated"); },
    onError: onErr,
  });
  const toggle = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => tasks.setCompleted(id, completed),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) => old?.map((t) => (t.id === id ? { ...t, completed } : t)));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev); onErr(e); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => tasks.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["notes"] }); toast.success("Task deleted"); },
    onError: onErr,
  });
  return { create, update, toggle, remove };
}
