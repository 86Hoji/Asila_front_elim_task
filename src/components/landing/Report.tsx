import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";

const COLUMNS = [
  {
    title: "What worked",
    accent: "var(--teal)",
    items: ["[TODO] bullet", "[TODO] bullet", "[TODO] bullet"],
  },
  {
    title: "What didn't",
    accent: "#ff8c42",
    items: ["[TODO] bullet", "[TODO] bullet", "[TODO] bullet"],
  },
  {
    title: "What we'd do next",
    accent: "var(--lavender)",
    items: ["[TODO] bullet", "[TODO] bullet", "[TODO] bullet"],
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
