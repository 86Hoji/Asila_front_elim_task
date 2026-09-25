import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function Counter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  // Server and first client render show the real value, so the number is never wrong
  // without JavaScript; the count-up only runs once the counter is in view.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduced) return;
    const start = performance.now();
    const dur = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value]);

  return (
    <span ref={ref} className="font-mono text-3xl text-foreground md:text-4xl">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
