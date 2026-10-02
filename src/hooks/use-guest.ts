import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createGuestAccount } from "@/lib/guest.functions";
import { tasksApi } from "@/lib/api";

function at(daysFromToday: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function useGuestLogin() {
  const [loading, setLoading] = useState(false);
  const create = useServerFn(createGuestAccount);
  const navigate = useNavigate();

  const start = async () => {
    setLoading(true);
    try {
      const creds = await create();
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) throw error;
      const api = tasksApi(supabase);
      await Promise.all([
        api.create({ title: "Morning meditation", description: "10 minutes mindfulness", priority: "low", category: "Health", due_date: at(0, 7) }),
        api.create({ title: "Team standup", description: "Daily sync with the team", priority: "medium", category: "Work", due_date: at(0, 10) }),
        api.create({ title: "Project deadline", description: "Submit deliverables", priority: "high", category: "Work", due_date: at(0, 16) }),
        api.create({ title: "Grocery run", priority: "low", category: "Errands", due_date: at(1, 18) }),
      ]).catch(() => undefined);
      toast.success("Welcome! You're exploring a demo account.");
      navigate({ to: "/tasks" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start demo");
    } finally {
      setLoading(false);
    }
  };
  return { start, loading };
}
