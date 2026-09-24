import { useCallback, useEffect, useRef, useState } from "react";

export type Player = {
  currentTime: number;
  playing: boolean;
  speed: number;
  duration: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  setSpeed: (s: number) => void;
  /** Set by the video element when it reports time; avoids feedback loops. */
  reportTime: (t: number) => void;
};

/**
 * A single clock used by both the video player and the schematic renderer,
 * so the timeline, risk chart and event list behave identically in both modes.
 */
export function usePlayer(duration: number, virtual: boolean): Player {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const raf = useRef<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    setCurrentTime(0);
    setPlaying(false);
  }, [duration, virtual]);

  useEffect(() => {
    if (!virtual || !playing) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last.current) / 1000) * speed;
      last.current = now;
      setCurrentTime((t) => {
        const next = t + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [virtual, playing, speed, duration]);

  const seek = useCallback(
    (t: number) => setCurrentTime(Math.min(duration, Math.max(0, t))),
    [duration],
  );

  return {
    currentTime,
    playing,
    speed,
    duration,
    play: useCallback(() => setPlaying(true), []),
    pause: useCallback(() => setPlaying(false), []),
    toggle: useCallback(() => setPlaying((p) => !p), []),
    seek,
    setSpeed,
    reportTime: useCallback((t: number) => setCurrentTime(t), []),
  };
}
