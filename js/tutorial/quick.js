/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { cellPhrase } from "./helpers.js";

/**
 * @typedef {object} QuickStripState
 * @property {boolean} active In a Lomuto partition
 * @property {number} lo Range start (inclusive)
 * @property {number} hi Range end / pivot index (inclusive)
 * @property {number} pivotIndex
 * @property {number} storeIndex Next slot for values ≤ pivot
 * @property {number} scanIndex Cell last compared (or -1)
 * @property {number} lastPlacedIndex Pivot just fixed (-1 if none yet)
 * @property {number} rangeBottomIndex Start of active range on the grid (`lo`, left end of strip)
 * @property {boolean} complete Sort finished—no strip highlights
 */

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "All cells are sorted by hue.",
  };
}

/**
 * Replay partition bounds for the side strip (Lomuto, pivot at hi).
 *
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 */
export function trackQuickStep(step, ctx) {
  const state = /** @type {{
    pivotIndex: number,
    partitionStarted: boolean,
    lo: number,
    hi: number,
    storeIndex: number,
    scanIndex: number,
    active: boolean,
    lastPlacedIndex: number,
  }} */ (ctx.quick);

  if (step.type === STEP.DONE) {
    state.active = false;
    state.lastPlacedIndex = -1;
    state.scanIndex = -1;
    return;
  }

  if (step.type === STEP.COMPARE) {
    const pivot = step.j;
    if (!state.active || pivot !== state.pivotIndex) {
      state.lo = step.i;
      state.hi = pivot;
      state.pivotIndex = pivot;
      state.storeIndex = step.i;
      state.active = true;
    }
    state.scanIndex = step.i;
    return;
  }

  if (step.type === STEP.SWAP) {
    if (step.i === state.pivotIndex || step.j === state.pivotIndex) {
      state.lastPlacedIndex =
        step.i === state.pivotIndex ? step.j : step.i;
      state.active = false;
      state.scanIndex = -1;
      return;
    }
    state.storeIndex = step.j + 1;
  }
}

/**
 * @param {TutorialContext | null} ctx
 * @param {number} cellCount
 * @param {boolean} [sortComplete]
 * @returns {QuickStripState}
 */
export function getQuickStripState(ctx, cellCount, sortComplete = false) {
  if (sortComplete || !ctx) {
    return {
      active: false,
      complete: true,
      lo: 0,
      hi: -1,
      pivotIndex: -1,
      storeIndex: 0,
      scanIndex: -1,
      lastPlacedIndex: -1,
      rangeBottomIndex: -1,
      cellCount,
    };
  }

  const state = /** @type {{
    lo: number,
    hi: number,
    pivotIndex: number,
    storeIndex: number,
    scanIndex: number,
    active: boolean,
    lastPlacedIndex: number,
  }} */ (ctx.quick);

  const active = Boolean(state.active && state.hi >= 0);
  const lastPlacedIndex = state.lastPlacedIndex ?? -1;
  const lo = state.lo ?? 0;
  const hi = state.hi ?? -1;
  const rangeBottomIndex = active ? lo : -1;

  return {
    active,
    complete: false,
    lo,
    hi,
    pivotIndex: state.pivotIndex ?? -1,
    storeIndex: state.storeIndex ?? 0,
    scanIndex: state.scanIndex ?? -1,
    lastPlacedIndex,
    rangeBottomIndex,
    cellCount,
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  trackQuickStep(step, ctx);

  const state = /** @type {{ pivotIndex: number, partitionStarted: boolean }} */ (
    ctx.quick
  );

  if (step.type === STEP.COMPARE) {
    if (step.j !== state.pivotIndex) {
      state.pivotIndex = step.j;
      state.partitionStarted = false;
    }

    if (!state.partitionStarted) {
      state.partitionStarted = true;
      return {
        title: "Partition",
        body: `Pivot is ${cellPhrase(cells[step.j])}—cells are compared to it and smaller hues shift left.`,
        pause: true,
        focusIndex: step.j,
      };
    }

    return {
      title: "Compared",
      body: `Compared ${cellPhrase(cells[step.i])} to the pivot.`,
      pause: false,
    };
  }

  if (step.type === STEP.SWAP) {
    if (step.i !== state.pivotIndex && step.j !== state.pivotIndex) {
      return null;
    }

    state.partitionStarted = false;
    const placedIndex =
      step.i === state.pivotIndex ? step.j : step.i;

    return {
      title: "Placed",
      body: `${cellPhrase(cells[placedIndex])} is in its final position.`,
      pause: true,
      focusIndex: placedIndex,
    };
  }

  return null;
}
