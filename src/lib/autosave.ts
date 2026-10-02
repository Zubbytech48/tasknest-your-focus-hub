export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Debounced autosaver. `schedule(value)` restarts the timer; the latest value
 * is persisted after `delay` ms. `flush()` saves immediately.
 */
export function createAutosaver<T>(
  save: (value: T) => Promise<void>,
  opts: { delay?: number; onStatus?: (s: SaveStatus) => void } = {},
) {
  const delay = opts.delay ?? 800;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;
  let inflight: Promise<void> = Promise.resolve();
  const emit = (s: SaveStatus) => opts.onStatus?.(s);

  const run = async () => {
    timer = null;
    if (!pending) return;
    const { value } = pending;
    pending = null;
    emit("saving");
    inflight = inflight.then(async () => {
      try {
        await save(value);
        emit(pending ? "pending" : "saved");
      } catch {
        emit("error");
      }
    });
    await inflight;
  };

  return {
    schedule(value: T) {
      pending = { value };
      emit("pending");
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, delay);
    },
    async flush() {
      if (timer) clearTimeout(timer);
      await run();
      await inflight;
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
    hasPending() {
      return pending !== null;
    },
  };
}
