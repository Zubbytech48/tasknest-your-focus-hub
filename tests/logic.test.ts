import { describe, it, expect, vi } from "vitest";
import { validateTask, filterTasks, sortTasks, computeStats, type Task } from "../src/lib/tasks-logic";
import { createAutosaver } from "../src/lib/autosave";
import { initialTimer, timerReducer } from "../src/lib/timer";

const t = (o: Partial<Task>): Task => ({ id: "1", user_id: "u", title: "A", description: null, due_date: null, priority: "medium", category: null, completed: false, created_at: "2026-01-01T00:00:00Z", updated_at: "", ...o });

describe("tasks", () => {
  it("validates title", () => {
    expect(validateTask({ title: " " }).ok).toBe(false);
    expect(validateTask({ title: "x" }).ok).toBe(true);
  });
  it("filters/sorts/stats", () => {
    const list = [t({ id: "a", priority: "low" }), t({ id: "b", priority: "high", completed: true, title: "Find me" })];
    expect(filterTasks(list, { status: "active" }).map((x) => x.id)).toEqual(["a"]);
    expect(filterTasks(list, { search: "find" }).map((x) => x.id)).toEqual(["b"]);
    expect(sortTasks(list, "priority")[0]!.id).toBe("b");
    expect(computeStats(list)).toMatchObject({ total: 2, done: 1, pending: 1 });
  });
});

describe("autosave", () => {
  it("debounces to latest value", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue(undefined);
    const s = createAutosaver(save, { delay: 100 });
    s.schedule("a"); s.schedule("b");
    await vi.advanceTimersByTimeAsync(150);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("b");
    vi.useRealTimers();
  });
});

describe("timer", () => {
  it("runs, pauses, completes", () => {
    let s = timerReducer(initialTimer(), { type: "START", now: 0 });
    s = timerReducer(s, { type: "PAUSE", now: 60_000 });
    expect(s.remaining).toBe(1440);
    s = timerReducer(s, { type: "START", now: 0 });
    s = timerReducer(s, { type: "TICK", now: 1_500_000 });
    expect(s.completedFocus).toBe(1);
    expect(s.mode).toBe("break");
  });
});
