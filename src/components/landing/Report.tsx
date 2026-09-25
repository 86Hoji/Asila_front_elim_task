import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { RESULTS } from "@/content/results";

const { scoreA, falseAlarms, runtime } = RESULTS;
const first = scoreA[0]!.value.toFixed(3);
const last = scoreA[scoreA.length - 1]!.value.toFixed(3);

const COLUMNS = [
  {
    title: "What worked",
    accent: "var(--teal)",
    items: [
      `A detector and a tracker plus rules on trajectories and scene geometry: Score A on our dev labels rose from ${first} to ${last} in three rule revisions.`,
      `Time-to-collision on the road plane for Part B: false alarms cut from ${falseAlarms.before[0]}-${falseAlarms.before[1]} to ${falseAlarms.after} in ${falseAlarms.minutes} minutes, strictly causal (enforced by a test).`,
      `Deterministic and offline: fixed stride per device, identical results across runs, ${runtime.min.toFixed(2)}-${runtime.max.toFixed(2)}× the video length against a ${runtime.limit}× limit.`,
    ],
  },
  {
    title: "What didn't",
    accent: "#ff8c42",
    items: [
      "The samples contain no real accident, so accident detection and the risk score are untested on a real crash.",
      "Recall is probably overestimated: our labels started from the rules' own candidates, so events the rules missed may be absent.",
      "Jaywalking remains hard to separate from people cutting corners.",
    ],
  },
  {
    title: "What we'd do next",
    accent: "var(--lavender)",
    items: [
      "Score the held-out videos and label every video end to end to measure recall properly.",
      "Test accident detection and risk on public crash footage (CADP).",
      "Finish the lane rules: illegal_turn and solid_line_crossing.",
      "Benchmark on T4-class hardware.",
    ],
  },
];

export function Report() {
  return (
    <Section id="report">
      <Reveal>
        <Eyebrow>TECHNICAL REPORT</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold md:text-5xl">An honest debrief.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {COLUMNS.map((col, i) => (
          <Reveal key={col.title} delay={0.06 * i}>
            <article className="glass hover-lift h-full p-7">
              <h3 className="text-xl font-semibold" style={{ color: col.accent }}>
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-sm text-[var(--body)]">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: col.accent }}
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
