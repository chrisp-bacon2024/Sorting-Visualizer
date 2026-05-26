import { STEP } from "./algorithms/types.js";

/**
 * @typedef {import('./sort/sortSession.js').SortRecording} SortRecording
 * @typedef {{ recording: SortRecording, steps: number, recordMs: number, timRecordingVersion?: number }} AlgoBenchmarkResult
 */

/**
 * Compare/swap steps only (excludes the final "done" marker).
 * @param {SortRecording} recording
 */
export function animatedStepCount(recording) {
  return recording.steps.filter((step) => step.type !== STEP.DONE).length;
}

/**
 * @param {SortRecording} recording
 * @param {number} internalIndex
 */
export function toDisplayPlaybackIndex(recording, internalIndex) {
  const total = animatedStepCount(recording);
  if (internalIndex >= recording.steps.length) return total;
  return Math.min(internalIndex, total);
}

/**
 * @param {SortRecording} recording
 * @param {number} displayIndex
 */
export function toInternalPlaybackIndex(recording, displayIndex) {
  const total = animatedStepCount(recording);
  if (displayIndex >= total) return recording.steps.length;
  return displayIndex;
}
/**
 * @param {number} ms
 */
export function formatRecordMs(ms) {
  if (ms > 999) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${ms} ms`;
}

/**
 * @param {number} steps
 * @param {number} recordMs
 */
export function formatAlgoStats(steps, recordMs) {
  return `${steps.toLocaleString()} steps · ${formatRecordMs(recordMs)}`;
}

/**
 * @param {string} label
 * @param {AlgoBenchmarkResult | undefined} result
 */
export function formatAlgoOptionLabel(label, result) {
  if (!result) return label;
  return `${label} (${formatAlgoStats(result.steps, result.recordMs)})`;
}

/**
 * @param {number} displayIndex
 * @param {number} totalSteps
 * @param {number | undefined} recordMs
 */
export function formatPlaybackLabel(displayIndex, totalSteps, recordMs) {
  const steps = `${displayIndex.toLocaleString()} / ${totalSteps.toLocaleString()}`;
  if (recordMs == null) return steps;
  return `${steps} · ${formatRecordMs(recordMs)}`;
}
