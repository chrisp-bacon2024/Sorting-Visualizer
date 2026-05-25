/** @typedef {import('../model/grid.js').Grid} Grid */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../algorithms/types.js').SortGenerator} SortGenerator */
/** @typedef {{ hue: number, color: string }} CellSnapshot */
import { STEP } from "../algorithms/types.js";

/**
 * @typedef {{ snapshot: CellSnapshot[], steps: SortStep[], algorithmId: string }} SortRecording
 */

/**
 * @param {Grid} grid
 * @returns {CellSnapshot[]}
 */
export function captureGridState(grid) {
  return grid.cells.map((cell) => ({
    hue: cell.hue,
    color: cell.color,
  }));
}

/**
 * @param {Grid} grid
 * @param {CellSnapshot[]} snapshot
 */
export function restoreGridState(grid, snapshot) {
  snapshot.forEach((data, index) => {
    const cell = grid.cells[index];
    if (!cell) return;
    cell.hue = data.hue;
    cell.color = data.color;
  });
  grid.clearHighlights();
}

/**
 * @param {Grid} grid
 * @param {SortStep} step
 */
export function mutateStep(grid, step) {
  if (step.type === STEP.SWAP) {
    grid.swapCells(step.i, step.j);
  }
}

/**
 * @param {Grid} grid
 * @param {SortStep | null} step
 */
function showStepHighlight(grid, step) {
  grid.clearHighlights();
  if (!step) return;
  if (step.type === STEP.COMPARE || step.type === STEP.SWAP) {
    grid.highlightCell(step.i);
    grid.highlightCell(step.j);
  }
}

/**
 * @param {Grid} grid
 * @param {SortStep} step
 */
export function applySingleStep(grid, step) {
  if (step.type === STEP.SWAP) {
    mutateStep(grid, step);
  }
  showStepHighlight(grid, step);
}

/**
 * Advance playback from one index to another (for sequential/batched play).
 * @param {Grid} grid
 * @param {SortRecording} recording
 * @param {number} fromIndex
 * @param {number} toIndex
 */
export function seekForward(grid, recording, fromIndex, toIndex) {
  const clamped = Math.max(0, Math.min(toIndex, recording.steps.length));

  if (clamped <= fromIndex) {
    return seekToStep(grid, recording, clamped);
  }

  if (fromIndex === 0) {
    restoreGridState(grid, recording.snapshot);
  }

  for (let i = fromIndex; i < clamped; i++) {
    applySingleStep(grid, recording.steps[i]);
  }

  return clamped;
}

/**
 * Full rewind (for scrubbing). O(stepIndex) — use only when jumping.
 * @param {Grid} grid
 * @param {SortRecording} recording
 * @param {number} stepIndex Steps applied (0 = initial snapshot)
 */
export function seekToStep(grid, recording, stepIndex) {
  const clamped = Math.max(0, Math.min(stepIndex, recording.steps.length));
  restoreGridState(grid, recording.snapshot);

  for (let i = 0; i < clamped; i++) {
    mutateStep(grid, recording.steps[i]);
  }

  if (clamped === 0) {
    grid.clearHighlights();
  } else {
    showStepHighlight(grid, recording.steps[clamped - 1]);
  }

  return clamped;
}

/**
 * @param {Grid} grid
 * @param {SortGenerator} sortFn
 * @param {(a: import('../model/grid.js').Cell, b: import('../model/grid.js').Cell) => number} compare
 * @param {string} algorithmId
 * @returns {SortRecording}
 */
export function recordSort(grid, sortFn, compare, algorithmId) {
  const snapshot = captureGridState(grid);
  /** @type {SortStep[]} */
  const steps = [];

  const generator = sortFn(grid.cells, compare);
  let result = generator.next();

  while (!result.done) {
    steps.push(result.value);
    mutateStep(grid, result.value);
    result = generator.next();
  }

  restoreGridState(grid, snapshot);

  return { snapshot, steps, algorithmId };
}
