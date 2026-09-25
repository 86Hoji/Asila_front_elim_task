import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, UploadCloud, AlertTriangle } from "lucide-react";
import { AnalysisView } from "./AnalysisView";
import { API_BASE, UPLOAD_LIMITS, USE_MOCK } from "@/config";
import { buildMockResult } from "@/lib/mock-analysis";
import type { AnalysisResult } from "@/types";

const STAGES = ["Uploading", "Detecting", "Tracking", "Applying rules", "Scoring risk"];

type Phase = "idle" | "working" | "done" | "error";

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

export function TryYourVideoTab() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const lastFile = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);

  useEffect(
    () => () => {
      cancelled.current = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const runMock = useCallback(async (duration: number) => {
    const start = performance.now();
    return new Promise<AnalysisResult>((resolve) => {
      const tick = () => {
        if (cancelled.current) return;
        const p = Math.min(1, (performance.now() - start) / 8000);
        setProgress(p);
        if (p < 1) requestAnimationFrame(tick);
        else resolve(buildMockResult(duration));
      };
      requestAnimationFrame(tick);
    });
  }, []);

  const runReal = useCallback(async (file: File) => {
    const form = new FormData();
    form.append("video", file);
    const res = await fetch(`${API_BASE}/api/analyze`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`The analysis service rejected the upload (${res.status}).`);
    const { job_id: jobId } = (await res.json()) as { job_id: string };

    const started = Date.now();
    for (;;) {
      if (Date.now() - started > 10 * 60 * 1000) throw new Error("The analysis timed out.");
      await new Promise((r) => setTimeout(r, 2000));
      const jr = await fetch(`${API_BASE}/api/jobs/${jobId}`);
      if (!jr.ok) throw new Error(`Could not read the job status (${jr.status}).`);
      const job = (await jr.json()) as { status: string; progress: number; error?: string };
      setProgress(job.progress ?? 0);
      if (job.status === "error") throw new Error(job.error ?? "The analysis failed.");
      if (job.status === "done") break;
    }

    const rr = await fetch(`${API_BASE}/api/jobs/${jobId}/result`);
    if (!rr.ok) throw new Error(`Could not download the result (${rr.status}).`);
    return (await rr.json()) as AnalysisResult;
  }, []);

  const analyze = useCallback(
    async (file: File) => {
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
        setError(`That file is ${(file.size / 1024 / 1024).toFixed(0)} MB — the limit is 200 MB.`);
        return;
      }

      setPhase("working");
      try {
        const duration = await readDuration(file);
        if (duration > UPLOAD_LIMITS.maxSeconds) {
          setPhase("error");
          setError(`That clip is ${Math.round(duration)}s long — the limit is 2 minutes.`);
          return;
        }
        const url = URL.createObjectURL(file);
        setObjectUrl(url);

        const useMock = USE_MOCK || !API_BASE;
        const r = useMock ? await runMock(duration) : await runReal(file);
        if (cancelled.current) return;
        setResult(r);
        setPhase("done");
      } catch (e) {
        setPhase("error");
        setError(e instanceof Error ? e.message : "Something went wrong during the analysis.");
      }
    },
    [runMock, runReal],
  );

  const reset = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setResult(null);
    setPhase("idle");
    setProgress(0);
    setError(null);
    setFileName("");
  };

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
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-muted-foreground">
            {fileName} · {result.events.length} events · {result.duration.toFixed(1)}s
            {(USE_MOCK || !API_BASE) && " · simulated result"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-foreground transition-colors hover:border-teal-mid"
            >
              <Download className="h-3.5 w-3.5" /> Download JSON
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Analyze another video
            </button>
          </div>
        </div>
        <AnalysisView
          result={result}
          mode="video"
          src={result.annotated_video_url ?? objectUrl ?? undefined}
        />
      </div>
    );
  }

  if (phase === "working") {
    const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length))]!;
    return (
      <div className="glass mx-auto max-w-xl p-8">
        <h3 className="mono-label text-teal-mid">ANALYZING // {fileName}</h3>
        <p className="mt-6 font-mono text-4xl text-foreground">{Math.round(progress * 100)}%</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--teal-dim)]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <ul className="mt-6 grid gap-2">
          {STAGES.map((s, i) => {
            const done = progress * STAGES.length > i + 1;
            const current = s === stage;
            return (
              <li
                key={s}
                className={`font-mono text-xs ${
                  current ? "text-teal" : done ? "text-[var(--body)]" : "text-muted-foreground"
                }`}
              >
                {done ? "✓" : current ? "›" : "·"} {s}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
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
        className={`glass flex flex-col items-center justify-center border-dashed p-12 text-center transition-colors ${
          dragging ? "border-teal bg-accent" : ""
        }`}
      >
        <UploadCloud className="h-8 w-8 text-teal" />
        <h3 className="mt-5 text-lg font-semibold">Drop an .mp4 here</h3>
        <p className="mt-2 text-sm text-[var(--body)]">
          Up to 2 minutes and 200 MB.{" "}
          {USE_MOCK || !API_BASE
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
