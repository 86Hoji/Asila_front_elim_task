import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  id,
  children,
  className,
  glow = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full px-5 py-24 md:py-32 lg:py-40",
        glow && "section-glow",
        className,
      )}
    >
      <div className="relative mx-auto w-full max-w-[1200px]">{children}</div>
    </section>
  );
}
