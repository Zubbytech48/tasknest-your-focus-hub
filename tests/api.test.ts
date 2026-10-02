import { describe, it, expect, vi } from "vitest";
import { tasksApi, notesApi, focusApi } from "../src/lib/api";

function mockClient(result: unknown = { data: { id: "1" }, error: null }) {
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "eq", "gte", "order", "single"]) chain[m] = vi.fn(() => chain);
  (chain as { then: unknown }).then = (r: (v: unknown) => unknown) => Promise.resolve(result).then(r);
  return { from: vi.fn(() => chain), chain } as never as { from: ReturnType<typeof vi.fn>; chain: Record<string, ReturnType<typeof vi.fn>> };
}

describe("api endpoints", () => {
  it("tasks CRUD", async () => {
    const c = mockClient();
    const api = tasksApi(c as never);
    await expect(api.create({ title: "x" })).resolves.toEqual({ id: "1" });
    await expect(api.create({ title: "" })).rejects.toThrow();
    await api.update("1", { title: "y" });
    await api.setCompleted("1", true);
    await api.remove("1");
    expect(c.chain.eq).toHaveBeenCalledWith("id", "1");
  });
  it("surfaces errors", async () => {
    const c = mockClient({ data: null, error: { message: "boom" } });
    await expect(tasksApi(c as never).list()).rejects.toThrow("boom");
  });
  it("notes and focus", async () => {
    const c = mockClient();
    await notesApi(c as never).save("1", { title: "a".repeat(300) });
    expect(c.chain.update.mock.calls[0][0].title.length).toBe(200);
    await expect(focusApi(c as never).log(0, null)).rejects.toThrow();
    await expect(focusApi(c as never).log(25, null)).resolves.toBeTruthy();
  });
});
