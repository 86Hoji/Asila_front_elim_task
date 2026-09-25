import { Suspense, lazy, useEffect, useState } from "react";

const HeroScene = lazy(() => import("./HeroScene"));

function GradientFallback() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% 35%, rgba(0,194,188,0.18), transparent 65%), radial-gradient(ellipse 50% 40% at 70% 70%, rgba(199,125,255,0.10), transparent 70%)",
      }}
      aria-hidden
    />
  );
}

/** Lazily mounts the WebGL scene; falls back to a static gradient. */
export function HeroCanvas() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 640;
    if (reduced || lowPower) return;
    const id = window.setTimeout(() => setEnabled(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  if (!enabled) return <GradientFallback />;

  return (
    <Suspense fallback={<GradientFallback />}>
      <GradientFallback />
      <HeroScene />
    </Suspense>
  );
}
