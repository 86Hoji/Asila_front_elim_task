export function Eyebrow({ children }: { children: string }) {
  return (
    <p className="mono-label flex items-center gap-2 text-teal-mid">
      <span className="inline-block h-px w-6 bg-teal-dim" aria-hidden />
      {children}
    </p>
  );
}
