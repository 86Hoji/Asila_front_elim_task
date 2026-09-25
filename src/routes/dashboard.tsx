import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { SampleVideosTab } from "@/components/dashboard/SampleVideosTab";
import { TryYourVideoTab } from "@/components/dashboard/TryYourVideoTab";
import { OperatorTab } from "@/components/dashboard/OperatorTab";
import { cn } from "@/lib/utils";

const title = "ASILA Dashboard — live traffic event demo";
const description =
  "A traffic control room for our detector: replay the sample feeds on a live scene drawing with a risk gauge and event timeline, upload your own clip, or review the shift summary.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TABS = [
  { id: "samples", label: "Sample videos" },
  { id: "upload", label: "Try your video" },
  { id: "operator", label: "Operator view" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Dashboard() {
  const [tab, setTab] = useState<TabId>("samples");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (i: number, focus = false) => {
    const next = TABS[(i + TABS.length) % TABS.length]!;
    setTab(next.id);
    if (focus) tabRefs.current[(i + TABS.length) % TABS.length]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const keys: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowLeft: i - 1,
      Home: 0,
      End: TABS.length - 1,
    };
    const to = keys[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(to, true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <span className="text-base font-bold tracking-[0.18em] text-foreground">ASILA</span>
            <span className="mono-label hidden text-teal-mid sm:inline">CONTROL ROOM</span>
          </div>

          <div
            role="tablist"
            aria-label="Dashboard views"
            className="scrollbar-thin-teal flex gap-1 overflow-x-auto rounded-full border border-border p-1"
          >
            {TABS.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "flex-1 shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors md:flex-none",
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-5 md:py-8"
      >
        {tab === "samples" && <SampleVideosTab />}
        {tab === "upload" && <TryYourVideoTab onExploreSamples={() => select(0, true)} />}
        {tab === "operator" && <OperatorTab />}
      </main>
    </div>
  );
}
