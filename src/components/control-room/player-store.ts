import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type PlayerControls = {
  playing: boolean;
  speed: number;
  loop: boolean;
  duration: number;
};

type Listener = () => void;

/**
 * The single playback clock for a control-room view.
 *
 * Time lives outside React. Components that must follow the playhead subscribe
 * with `usePlayerTime` / `useTimeSelector`; everything else only re-renders when
 * the controls (play, speed, loop) change. In video mode the <video> element is
 * the source of truth and the store mirrors it once per animation frame.
 */
export class PlayerStore {
  private time = 0;
  private controls: PlayerControls;
  private timeListeners = new Set<Listener>();
  private controlListeners = new Set<Listener>();
  private raf = 0;
  private last = 0;
  private media: HTMLVideoElement | null = null;

  constructor(duration: number) {
    this.controls = { playing: false, speed: 1, loop: false, duration };
  }

  /* ---- subscriptions ---- */

  getTime = () => this.time;
  getControls = () => this.controls;

  subscribeTime = (fn: Listener) => {
    this.timeListeners.add(fn);
    return () => {
      this.timeListeners.delete(fn);
    };
  };

  subscribeControls = (fn: Listener) => {
    this.controlListeners.add(fn);
    return () => {
      this.controlListeners.delete(fn);
    };
  };

  private emitTime() {
    for (const fn of this.timeListeners) fn();
  }

  private setControls(patch: Partial<PlayerControls>) {
    this.controls = { ...this.controls, ...patch };
    for (const fn of this.controlListeners) fn();
  }

  /* ---- media ---- */

  attachMedia = (el: HTMLVideoElement | null) => {
    if (this.media === el) return;
    this.media = el;
    if (el) {
      el.playbackRate = this.controls.speed;
      el.loop = false;
      el.currentTime = this.time;
      if (Number.isFinite(el.duration) && el.duration > 0 && !this.controls.duration) {
        this.setControls({ duration: el.duration });
      }
    }
  };

  /** Called by the video element's `ended` event. */
  handleMediaEnded = () => {
    if (this.controls.loop) {
      this.seek(0);
      void this.media?.play().catch(() => this.pause());
    } else {
      this.pause();
      this.setTime(this.controls.duration);
    }
  };

  /* ---- transport ---- */

  private setTime(t: number) {
    if (t === this.time) return;
    this.time = t;
    this.emitTime();
  }

  seek = (t: number) => {
    const clamped = Math.min(this.controls.duration, Math.max(0, t));
    if (this.media) this.media.currentTime = clamped;
    this.setTime(clamped);
  };

  skip = (dt: number) => this.seek(this.time + dt);

  play = () => {
    if (this.controls.playing) return;
    if (this.time >= this.controls.duration - 0.05) this.seek(0);
    this.setControls({ playing: true });
    if (this.media) void this.media.play().catch(() => this.pause());
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  };

  pause = () => {
    cancelAnimationFrame(this.raf);
    this.media?.pause();
    if (this.controls.playing) this.setControls({ playing: false });
  };

  toggle = () => (this.controls.playing ? this.pause() : this.play());

  setSpeed = (speed: number) => {
    if (this.media) this.media.playbackRate = speed;
    this.setControls({ speed });
  };

  toggleLoop = () => this.setControls({ loop: !this.controls.loop });

  setDuration = (duration: number) => {
    if (duration > 0 && duration !== this.controls.duration) this.setControls({ duration });
  };

  private tick = (now: number) => {
    if (!this.controls.playing) return;
    const { duration, speed, loop } = this.controls;
    if (this.media) {
      this.setTime(Math.min(duration, this.media.currentTime));
    } else {
      const dt = Math.min(0.25, (now - this.last) / 1000) * speed;
      let next = this.time + dt;
      if (next >= duration) {
        if (loop) next = 0;
        else {
          this.setTime(duration);
          this.pause();
          return;
        }
      }
      this.setTime(next);
    }
    this.last = now;
    this.raf = requestAnimationFrame(this.tick);
  };

  /** Stops playback. Listeners are left alone: React unsubscribes them itself. */
  destroy() {
    this.pause();
  }
}

/** One store per mounted view. Key the view by feed/clip to get a fresh clock. */
export function usePlayerStore(duration: number) {
  const [store] = useState(() => new PlayerStore(duration));
  useEffect(() => () => store.destroy(), [store]);
  return store;
}

/** Re-renders on every clock tick. Only for tiny components (clock, gauge). */
export function usePlayerTime(store: PlayerStore) {
  return useSyncExternalStore(store.subscribeTime, store.getTime, store.getTime);
}

/**
 * Re-renders only when `select(time)` changes. `select` must return a primitive
 * (number / string / boolean) so equality is by value.
 */
export function useTimeSelector<T extends string | number | boolean>(
  store: PlayerStore,
  select: (t: number) => T,
) {
  const get = useCallback(() => select(store.getTime()), [store, select]);
  return useSyncExternalStore(store.subscribeTime, get, get);
}

export function usePlayerControls(store: PlayerStore) {
  return useSyncExternalStore(store.subscribeControls, store.getControls, store.getControls);
}

/** Runs `fn(time)` on every clock change without re-rendering (for imperative DOM updates). */
export function useTimeEffect(store: PlayerStore, fn: (t: number) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    ref.current(store.getTime());
    return store.subscribeTime(() => ref.current(store.getTime()));
  }, [store]);
}
