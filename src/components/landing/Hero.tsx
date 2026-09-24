import { Link } from "@tanstack/react-router";
import { HeroCanvas } from "@/components/hero/HeroCanvas";
import { Counter } from "@/components/site/Counter";
import { Reveal } from "@/components/site/Reveal";
import { HERO_METRICS } from "@/config";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-end overflow-hidden px-5 pb-12 pt-28">
      <HeroCanvas />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(1,9,9,0.85) 0%, rgba(1,9,9,0.15) 35%, rgba(1,9,9,0.9) 88%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1200px]">
        <Reveal>
          <p className="mono-label text-teal-mid">WIUT HACKATHON 2026 // COMPUTER VISION</p>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.03] tracking-tight md:text-7xl">
            Traffic events, detected.
            <br />
            <span className="aurora-text">Accidents, anticipated.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--body)] md:text-lg">
            A fixed road camera, one detector, one tracker and a rule engine that understands the
            intersection: every violation reported as a precise time segment, and an alarm raised
            before a crash begins.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
            >
              Try the demo
            </Link>
            <a
              href="#approach"
              className="rounded-full border border-border px-7 py-3 text-sm font-semibold text-foreground transition-colors hover:border-teal-mid hover:bg-accent"
            >
              How it works
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-[var(--border)] md:grid-cols-4">
            {HERO_METRICS.map((m) => (
              <div key={m.label} className="bg-[var(--surface)] px-5 py-6 backdrop-blur-md">
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <Counter
                    value={m.value}
                    prefix={"prefix" in m ? m.prefix : ""}
                    suffix={m.suffix}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">{m.label}</p>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
