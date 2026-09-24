import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { Pipeline } from "@/components/landing/Pipeline";
import { DataSection } from "@/components/landing/DataSection";
import { Results } from "@/components/landing/Results";
import { Report } from "@/components/landing/Report";
import { Team } from "@/components/landing/Team";
import { LinksFooter } from "@/components/landing/LinksFooter";

const title = "ASILA — Traffic events, detected. Accidents, anticipated.";
const description =
  "ASILA watches a fixed Tashkent CCTV camera: every traffic violation reported as a precise time segment, and an accident alarm raised seconds before impact. WIUT Hackathon 2026, Computer Vision track.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Pipeline />
        <DataSection />
        <Results />
        <Report />
        <Team />
        <LinksFooter />
      </main>
    </div>
  );
}
