export type TimerMode = "focus" | "break";
export type TimerStatus = "idle" | "running" | "paused";

export const DURATIONS: Record<TimerMode, number> = { focus: 25 * 60, break: 5 * 60 };

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  /** seconds remaining */
  remaining: number;
  /** epoch ms when the running phase ends */
  endsAt: number | null;
  /** increments each time a focus phase completes */
  completedFocus: number;
}

export type TimerAction =
  | { type: "START"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESET" }
  | { type: "SET_MODE"; mode: TimerMode }
  | { type: "TICK"; now: number };

export function initialTimer(mode: TimerMode = "focus"): TimerState {
  return { mode, status: "idle", remaining: DURATIONS[mode], endsAt: null, completedFocus: 0 };
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "START":
      if (state.status === "running") return state;
      return { ...state, status: "running", endsAt: action.now + state.remaining * 1000 };
    case "PAUSE":
      if (state.status !== "running" || state.endsAt === null) return state;
      return {
        ...state,
        status: "paused",
        remaining: Math.max(0, Math.ceil((state.endsAt - action.now) / 1000)),
        endsAt: null,
      };
    case "RESET":
      return { ...state, status: "idle", remaining: DURATIONS[state.mode], endsAt: null };
    case "SET_MODE":
      return { ...state, mode: action.mode, status: "idle", remaining: DURATIONS[action.mode], endsAt: null };
    case "TICK": {
      if (state.status !== "running" || state.endsAt === null) return state;
      const remaining = Math.max(0, Math.ceil((state.endsAt - action.now) / 1000));
      if (remaining > 0) return remaining === state.remaining ? state : { ...state, remaining };
      // Phase complete → switch mode automatically, idle.
      const next: TimerMode = state.mode === "focus" ? "break" : "focus";
      return {
        mode: next,
        status: "idle",
        remaining: DURATIONS[next],
        endsAt: null,
        completedFocus: state.completedFocus + (state.mode === "focus" ? 1 : 0),
      };
    }
  }
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
