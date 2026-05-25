/** @type {Readonly<{ cols: number, minCols: number, maxCols: number, defaultSpeedPreset: number, maxFastPlaybackMs: number }>} */
export const CONFIG = {
  cols: 20,
  minCols: 5,
  maxCols: 40,
  defaultSpeedPreset: 3,
  maxFastPlaybackMs: 9500,
};

/**
 * Target wall-clock time for a full playback run.
 * @type {Readonly<{ label: string, targetMs: number }[]>}
 */
export const SPEED_PRESETS = [
  { label: "Tutorial", tutorial: true },
  { label: "Very slow", targetMs: 90000 },
  { label: "Slow", targetMs: 45000 },
  { label: "Medium", targetMs: 20000 },
  { label: "Fast", targetMs: 12000 },
  { label: "Very fast", targetMs: CONFIG.maxFastPlaybackMs },
];

/**
 * @param {{ targetMs?: number, tutorial?: boolean }} preset
 * @param {number} animatedStepCount Compare/swap steps (not "done")
 * @returns {{ delayMs: number, stride: number, tutorial?: boolean }}
 */
export function getPlaybackSettings(preset, animatedStepCount) {
  if (preset.tutorial) {
    return { delayMs: 0, stride: 1, tutorial: true };
  }
  if (animatedStepCount <= 0) {
    return { delayMs: 16, stride: 1 };
  }

  const frameMs = 16;
  const frameBudget = Math.max(30, Math.floor(preset.targetMs / frameMs));
  const stride = Math.max(1, Math.ceil(animatedStepCount / frameBudget));
  const delayMs = Math.max(1, Math.floor(preset.targetMs / frameBudget));

  return { delayMs, stride };
}
