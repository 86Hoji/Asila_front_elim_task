import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { SampleVideosTab } from "@/components/dashboard/SampleVideosTab";
import { TryYourVideoTab } from "@/components/dashboard/TryYourVideoTab";
import { OperatorTab } from "@/components/dashboard/OperatorTab";
import { cn } from "@/lib/utils";

const title = "ASILA Dashboard — live traffic event demo";
const description =
  "Play back detected traffic violations on a scene schematic, watch the accident-risk curve, or upload your own clip and see the same analysis end to end.";

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <span className="text-base font-bold tracking-[0.18em] text-foreground">ASILA</span>
            <span className="mono-label hidden text-teal-mid sm:inline">LIVE DEMO</span>
          </div>

          <div
            role="tablist"
            aria-label="Dashboard views"
            className="scrollbar-thin-teal flex gap-1 overflow-x-auto rounded-full border border-border p-1"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
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

      <main className="mx-auto w-full max-w-[1400px] px-5 py-6 md:py-8">
        {tab === "samples" && <SampleVideosTab />}
        {tab === "upload" && <TryYourVideoTab />}
        {tab === "operator" && <OperatorTab />}
      </main>
    </div>
  );
}
