import { Github, Linkedin, Globe } from "lucide-react";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { TEAM } from "@/config";

export function Team() {
  return (
    <Section id="team">
      <Reveal>
        <Eyebrow>TEAM</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold md:text-5xl">Who built ASILA.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {TEAM.map((m, i) => (
          <Reveal key={m.name} delay={0.06 * i}>
            <article className="glass hover-lift flex h-full flex-col p-7">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-border font-mono text-base text-teal"
                  style={{ background: "var(--surface-raised)" }}
                  aria-hidden
                >
                  {m.initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-tight">{m.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>

              <p className="mono-label mt-7">WHO DID WHAT</p>
              <ul className="mt-3 space-y-2">
                {m.did.map((d, j) => (
                  <li key={j} className="flex gap-3 text-sm text-[var(--body)]">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-mid" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>

              <p className="mono-label mt-6">PREVIOUS PROJECTS</p>
              <p className="mt-2 text-sm text-[var(--body)]">{m.previous}</p>

              <div className="mt-auto flex gap-2 pt-7">
                {m.links.github && (
                  <a
                    href={m.links.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${m.name} on GitHub`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-teal-mid hover:text-teal"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {m.links.linkedin && (
                  <a
                    href={m.links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${m.name} on LinkedIn`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-teal-mid hover:text-teal"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {m.links.portfolio && (
                  <a
                    href={m.links.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${m.name} portfolio`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-teal-mid hover:text-teal"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
