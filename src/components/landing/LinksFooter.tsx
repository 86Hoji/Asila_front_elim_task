import { ArrowUpRight, FileJson, FileText, Github, Package } from "lucide-react";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { LINKS } from "@/config";

const ITEMS = [
  { icon: Github, title: "GitHub repository", href: LINKS.github },
  { icon: Package, title: "Model weights", href: LINKS.weights },
  { icon: FileJson, title: "predictions_samples.json", href: LINKS.predictions },
  { icon: FileText, title: "Technical report", href: LINKS.report },
];

export function LinksFooter() {
  return (
    <>
      <Section>
        <Reveal>
          <Eyebrow>DELIVERABLES</Eyebrow>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => {
            const pending = !item.href || item.href === "[TODO]";
            const Icon = item.icon;
            const content = (
              <>
                <Icon className="h-5 w-5 text-teal" />
                <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {pending ? "[TODO: link]" : "Open"}
                </p>
                {!pending && (
                  <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground" />
                )}
              </>
            );
            return (
              <Reveal key={item.title} delay={0.04 * i}>
                {pending ? (
                  <div className="glass relative h-full cursor-not-allowed p-6 opacity-70">
                    {content}
                  </div>
                ) : (
                  <a
                    href={item.href}
                    {...(item.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="glass hover-lift relative block h-full p-6"
                  >
                    {content}
                  </a>
                )}
              </Reveal>
            );
          })}
        </div>
      </Section>

      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-3 sm:flex-row">
          <span className="font-mono text-xs tracking-wider text-muted-foreground">
            ASILA · WIUT Hackathon 2026 · Computer Vision Track
          </span>
          <span className="mono-label">TASHKENT // FIXED CAMERA</span>
        </div>
      </footer>
    </>
  );
}
