import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";

const PARTS = [
  {
    tag: "PART A",
    title: "Event detection",
    body: "Given a video, return every event as [start_sec, end_sec, label].",
    detail: "Scored by macro F1 over temporal IoU thresholds 0.3 / 0.5 / 0.7.",
    accent: "var(--teal)",
  },
  {
    tag: "PART B",
    title: "Accident anticipation",
    body: "At every frame, using only past frames, output the probability that an accident starts within the next 5 seconds.",
    detail: "Strictly causal: no future frames, no lookahead.",
    accent: "var(--lavender)",
  },
];

export function Problem() {
  return (
    <Section>
      <Reveal>
        <Eyebrow>PROBLEM</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          A city camera sees thousands of vehicles an hour. The dangerous moments last seconds.
        </h2>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="mt-5 max-w-2xl text-[var(--body)]">
          Operators cannot watch every feed, and by the time a crash is reported the footage has
          already scrolled past. The task splits into two halves.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {PARTS.map((p, i) => (
          <Reveal key={p.tag} delay={0.1 + i * 0.08}>
            <article className="glass hover-lift h-full p-8 md:p-10">
              <span className="mono-label" style={{ color: p.accent }}>
                {p.tag}
              </span>
              <h3 className="mt-4 text-2xl font-semibold md:text-3xl">{p.title}</h3>
              <p className="mt-4 text-[var(--body)]">{p.body}</p>
              <p className="mt-6 border-t border-border pt-5 font-mono text-xs leading-relaxed text-muted-foreground">
                {p.detail}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
