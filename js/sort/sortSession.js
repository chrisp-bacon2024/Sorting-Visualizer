/** @typedef {import('../model/grid.js').Grid} Grid */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../algorithms/types.js').SortGenerator} SortGenerator */
/** @typedef {{ hue: number, color: string }} CellSnapshot */
import { STEP } from "../algorithms/types.js";

/** Minimum animated steps before building rewind checkpoints for scrubbing. */
const CHECKPOINT_MIN_STEPS = 400;

/**
 * @typedef {{
 *   snapshot: CellSnapshot[],
 *   steps: SortStep[],
 *   algorithmId: string,
 *   checkpoints?: CellSnapshot[][],
 *   checkpointInterval?: number,
 * }} SortRecording
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
    grid.highlightCell(step.i, "active");
    grid.highlightCell(step.j, "active");
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
 * Full rewind (for scrubbing). O(stepIndex) — use only when jumping.
 * @param {Grid} grid
 * @param {SortRecording} recording
 * @param {number} stepIndex Steps applied (0 = initial snapshot)
 */
export function seekToStep(grid, recording, stepIndex) {
  const clamped = Math.max(0, Math.min(stepIndex, recording.steps.length));
  const interval = recording.checkpointInterval ?? 0;
  const checkpoints = recording.checkpoints;

  if (
    clamped > 0 &&
    interval > 0 &&
    checkpoints &&
    checkpoints.length > 0
  ) {
    const checkpointIndex = Math.min(
      Math.floor(clamped / interval),
      checkpoints.length - 1
    );
    const startStep = checkpointIndex * interval;
    restoreGridState(grid, checkpoints[checkpointIndex]);
    for (let i = startStep; i < clamped; i++) {
      mutateStep(grid, recording.steps[i]);
    }
  } else {
    restoreGridState(grid, recording.snapshot);
    for (let i = 0; i < clamped; i++) {
      mutateStep(grid, recording.steps[i]);
    }
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
 * @param {CellSnapshot[]} snapshot
 * @param {SortStep[]} steps
 * @returns {{ checkpoints?: CellSnapshot[][], checkpointInterval: number }}
 */
function buildSeekCheckpoints(grid, snapshot, steps) {
  if (steps.length < CHECKPOINT_MIN_STEPS) {
    return { checkpointInterval: 0 };
  }

  const interval = Math.max(100, Math.floor(steps.length / 50));
  /** @type {CellSnapshot[][]} */
  const checkpoints = [snapshot];

  restoreGridState(grid, snapshot);
  for (let i = 0; i < steps.length; i++) {
    mutateStep(grid, steps[i]);
    if ((i + 1) % interval === 0) {
      checkpoints.push(captureGridState(grid));
    }
  }
  restoreGridState(grid, snapshot);

  return { checkpoints, checkpointInterval: interval };
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

  const { checkpoints, checkpointInterval } = buildSeekCheckpoints(
    grid,
    snapshot,
    steps
  );

  return {
    snapshot,
    steps,
    algorithmId,
    ...(checkpoints ? { checkpoints, checkpointInterval } : {}),
  };
}
