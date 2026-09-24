import raw from "./samples.json";
import type { SamplesFile, SampleVideo } from "@/types";

export const samples = raw as unknown as SamplesFile;

export function getSample(name: string): SampleVideo | undefined {
  return samples[name];
}

export const sampleNames = Object.keys(samples);
