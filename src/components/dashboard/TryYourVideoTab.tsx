import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Download, RefreshCw, UploadCloud, X } from "lucide-react";
import { ControlRoom } from "@/components/control-room/ControlRoom";
import { API_BASE, UPLOAD_LIMITS, USE_MOCK } from "@/config";
import { buildMockResult } from "@/lib/mock-analysis";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types";

/** Mirrors the landing-page pipeline. */
const STAGES = ["Decode", "Detect", "Track", "Rules", "Risk"];
const MOCK_MS = 8000;
const isMock = () => USE_MOCK;

type Phase = "idle" | "working" | "done" | "error";

class Cancelled extends Error {}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this video file."));
    };
    v.src = url;
  });
}

function mmss(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Progress({
  fileName,
  progress,
  startedAt,
  onCancel,
}: {
  fileName: string;
  progress: number;
  startedAt: number;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const current = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));

  return (
    <div className="glass mx-auto max-w-2xl p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="mono-label text-teal-mid">ANALYZING</h3>
          <p className="mt-1 truncate font-mono text-xs text-[var(--body)]">{fileName}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-[#ff4d6d]"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <p className="font-mono text-4xl text-foreground sm:text-5xl" aria-live="polite">
          {Math.round(progress * 100)}%
        </p>
        <p className="font-mono text-xs text-muted-foreground">elapsed {mmss(now - startedAt)}</p>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--teal-dim)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <ol className="mt-8 grid grid-cols-5 gap-2">
        {STAGES.map((s, i) => {
          const done = i < current || progress >= 1;
          const on = i === current && progress < 1;
          return (
            <li key={s} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span
                  className={cn(
                    "absolute right-1/2 top-4 h-px w-full",
                    i <= current ? "bg-teal-mid" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border font-mono text-[11px]",
                  done && "border-teal-mid bg-teal-mid text-primary-foreground",
                  on && "border-teal bg-background text-teal shadow-[var(--shadow-glow)]",
                  !done && !on && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-2 font-mono text-[10px] sm:text-[11px]",
                  on ? "text-teal" : done ? "text-[var(--body)]" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function TryYourVideoTab({ onExploreSamples }: { onExploreSamples: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const lastFile = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);
  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const runMock = useCallback((duration: number, signal: AbortSignal) => {
    const start = performance.now();
    return new Promise<AnalysisResult>((resolve, reject) => {
      const tick = () => {
        if (signal.aborted) return reject(new Cancelled());
        const p = Math.min(1, (performance.now() - start) / MOCK_MS);
        setProgress(p);
        if (p < 1) requestAnimationFrame(tick);
        else resolve(buildMockResult(duration));
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const runReal = useCallback(async (file: File, signal: AbortSignal) => {
    const form = new FormData();
    form.append("video", file);
    const res = await fetch(`${API_BASE}/api/analyze`, { method: "POST", body: form, signal });
    if (!res.ok) throw new Error(`The analysis service rejected the upload (${res.status}).`);
    const { job_id: jobId } = (await res.json()) as { job_id: string };

    const started = Date.now();
    for (;;) {
      if (signal.aborted) throw new Cancelled();
      if (Date.now() - started > 10 * 60 * 1000) throw new Error("The analysis timed out.");
      await new Promise((r) => setTimeout(r, 2000));
      const jr = await fetch(`${API_BASE}/api/jobs/${jobId}`, { signal });
      if (!jr.ok) throw new Error(`Could not read the job status (${jr.status}).`);
      const job = (await jr.json()) as { status: string; progress: number; error?: string };
      setProgress(job.progress ?? 0);
      if (job.status === "error") throw new Error(job.error ?? "The analysis failed.");
      if (job.status === "done") break;
    }

    const rr = await fetch(`${API_BASE}/api/jobs/${jobId}/result`, { signal });
    if (!rr.ok) throw new Error(`Could not download the result (${rr.status}).`);
    return (await rr.json()) as AnalysisResult;
  }, []);

  const reset = useCallback(() => {
    abort.current?.abort();
    setObjectUrl(null);
    setResult(null);
    setPhase("idle");
    setProgress(0);
    setError(null);
    setFileName("");
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setError(null);
      setResult(null);
      setProgress(0);
      lastFile.current = file;
      setFileName(file.name);

      if (!file.name.toLowerCase().endsWith(".mp4") && file.type !== "video/mp4") {
        setPhase("error");
        setError("Only .mp4 files are accepted.");
        return;
      }
      if (file.size > UPLOAD_LIMITS.maxBytes) {
        setPhase("error");
        setError(
          `That file is ${(file.size / 1024 / 1024).toFixed(0)} MB — the limit is ${UPLOAD_LIMITS.maxBytes / 1024 / 1024} MB.`,
        );
        return;
      }

      try {
        const duration = await readDuration(file);
        if (duration > UPLOAD_LIMITS.maxSeconds) {
          setPhase("error");
          setError(
            `That clip is ${Math.round(duration)} s long — the limit is ${UPLOAD_LIMITS.maxSeconds / 60} minutes.`,
          );
          return;
        }
        setStartedAt(Date.now());
        setPhase("working");
        const r = isMock()
          ? await runMock(duration, ctrl.signal)
          : await runReal(file, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setObjectUrl(URL.createObjectURL(file));
        setResult(r);
        setPhase("done");
      } catch (e) {
        if (e instanceof Cancelled || (e instanceof DOMException && e.name === "AbortError"))
          return;
        setPhase("error");
        setError(e instanceof Error ? e.message : "Something went wrong during the analysis.");
      }
    },
    [runMock, runReal],
  );

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileName.replace(/\.mp4$/i, "")}_asila.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (phase === "done" && result) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">
            {fileName} · {result.events.length} events · {result.duration.toFixed(1)} s
            {isMock() && " · simulated result (demo mode)"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground transition-colors hover:border-teal-mid"
            >
              <Download className="h-3.5 w-3.5" /> JSON
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Analyze another
            </button>
          </div>
        </div>
        {result.scene_matched === false && (
          <div
            role="status"
            className="glass flex items-start gap-3 border-l-2 p-4"
            style={{ borderLeftColor: "#ffd23f" }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#ffd23f" }} />
            <p className="text-sm text-foreground">
              Camera not recognised: rules tied to this junction (lanes, stop line, signal,
              crossings) were disabled; only general events are reported.
            </p>
          </div>
        )}
        <ControlRoom
          key={objectUrl ?? fileName}
          result={result}
          title={`UPLOAD · ${fileName}`}
          src={result.annotated_video_url ?? objectUrl ?? undefined}
        />
      </div>
    );
  }

  if (phase === "working") {
    return (
      <Progress fileName={fileName} progress={progress} startedAt={startedAt} onCancel={reset} />
    );
  }

  const limits = [
    UPLOAD_LIMITS.accept,
    `up to ${UPLOAD_LIMITS.maxSeconds / 60} min`,
    `up to ${UPLOAD_LIMITS.maxBytes / 1024 / 1024} MB`,
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void analyze(f);
        }}
        className={cn(
          "glass relative flex min-h-[340px] flex-col items-center justify-center overflow-hidden border-dashed p-8 text-center transition-colors sm:min-h-[400px] sm:p-12",
          dragging && "border-teal bg-accent",
        )}
      >
        {/* Animated scanning grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 motion-reduce:hidden"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,194,188,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,194,188,0.08) 1px, transparent 1px), radial-gradient(ellipse at center, rgba(0,255,235,0.08), transparent 70%)",
            backgroundSize: "40px 40px, 40px 40px, 100% 100%",
            animation: "scan-grid 6s linear infinite",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-[rgba(0,255,235,0.08)] to-transparent motion-reduce:hidden"
          style={{ animation: "scan-line 4s linear infinite" }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-mid bg-background/60 shadow-[var(--shadow-glow)]">
            <UploadCloud className="h-6 w-6 text-teal" />
          </span>
          <h3 className="mt-5 text-xl font-semibold sm:text-2xl">Drop a traffic clip here</h3>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {limits.map((l) => (
              <span
                key={l}
                className="rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[11px] text-[var(--body)]"
              >
                {l}
              </span>
            ))}
          </div>
          <p className="mt-4 max-w-md text-sm text-[var(--body)]">
            {isMock()
              ? "Demo mode: your clip never leaves this browser and the result is simulated."
              : "Your clip is sent to our analysis server for processing and is not stored."}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
          >
            Browse files
          </button>
          <button
            type="button"
            onClick={onExploreSamples}
            className="mt-4 text-xs text-teal-mid underline-offset-4 hover:text-teal hover:underline"
          >
            No clip at hand? Explore the sample feeds
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,.mp4"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void analyze(f);
            e.target.value = "";
          }}
        />
      </div>

      {phase === "error" && error && (
        <div
          role="alert"
          className="glass mt-5 flex items-start gap-3 border-l-2 p-5"
          style={{ borderLeftColor: "#ff4d6d" }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#ff4d6d" }} />
          <div>
            <p className="text-sm text-foreground">{error}</p>
            <button
              type="button"
              onClick={() => lastFile.current && void analyze(lastFile.current)}
              className="mt-3 rounded-full border border-border px-4 py-1.5 text-xs text-foreground transition-colors hover:border-teal-mid"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
