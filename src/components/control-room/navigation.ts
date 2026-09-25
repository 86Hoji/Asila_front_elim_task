import { useCallback, useEffect, useState } from "react";
import { RISK_THRESHOLD } from "@/config";
import { riskAt, type Model } from "./analysis";
import { useTimeSelector, type PlayerStore } from "./player-store";

export function nextEventStart(model: Model, t: number) {
  return model.starts.find((s) => s > t + 0.05);
}

export function prevEventStart(model: Model, t: number) {
  let prev: number | undefined;
  for (const s of model.starts) {
    if (s < t - 0.5) prev = s;
    else break;
  }
  return prev;
}

/** Global keyboard shortcuts for a control-room view. */
export function useShortcuts(store: PlayerStore, model: Model) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      const interactive = !!el?.closest("button, a, [role=tab], [role=button]");
      const t = store.getTime();
      switch (e.key) {
        case " ":
          if (interactive) return;
          e.preventDefault();
          store.toggle();
          break;
        case "ArrowLeft":
          if (el?.closest("[role=tablist]")) return;
          e.preventDefault();
          store.skip(-5);
          break;
        case "ArrowRight":
          if (el?.closest("[role=tablist]")) return;
          e.preventDefault();
          store.skip(5);
          break;
        case "j":
        case "J":
          store.seek(prevEventStart(model, t) ?? 0);
          break;
        case "k":
        case "K": {
          const s = nextEventStart(model, t);
          if (s !== undefined) store.seek(s);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, model]);
}

/** Counts entries into the ALARM state, for the flash. */
export function useAlarmEntries(store: PlayerStore, model: Model) {
  const select = useCallback((t: number) => riskAt(model.risk, t) >= RISK_THRESHOLD, [model]);
  const alarm = useTimeSelector(store, select);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (alarm) setN((x) => x + 1);
  }, [alarm]);
  return n;
}
