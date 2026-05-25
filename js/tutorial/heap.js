/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { cellPhrase } from "./helpers.js";

const BUILDING =
  "Arranging the grid into a max-heap—each parent larger than its children.";
const RESTORING =
  "Fixing the heap so the largest remaining hue is back at the root.";

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "Array is fully sorted.",
  };
}

/**
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 */
function initHeapState(ctx, cells) {
  const state = /** @type {{ heapEnd: number, buildDone: boolean }} */ (ctx.heap);
  if (state.heapEnd < 0) {
    state.heapEnd = cells.length - 1;
  }
}

/**
 * Active heap size for tree view (indices 0 … size − 1).
 *
 * @param {TutorialContext} ctx
 * @param {number} cellCount
 * @returns {number}
 */
export function getHeapSize(ctx, cellCount) {
  const state = /** @type {{ heapEnd: number, buildDone: boolean }} */ (ctx.heap);
  if (state.heapEnd < 0) {
    state.heapEnd = cellCount - 1;
  }
  return state.heapEnd + 1;
}

/**
 * Pause before each extract—the heap is valid, swap has not run yet.
 *
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function getBeforeStep(step, ctx, cells) {
  const state = /** @type {{ heapEnd: number, buildDone: boolean }} */ (ctx.heap);
  initHeapState(ctx, cells);

  if (step.type !== STEP.SWAP || step.i !== 0 || step.j !== state.heapEnd) return null;

  return {
    title: "Heap ready",
    body: "Max-heap is built—each parent is larger than its children.",
    focusIndex: 0,
  };
}

/**
 * @param {boolean} building
 * @returns {TutorialMessage}
 */
function heapWorkMessage(building) {
  return {
    title: building ? "Building" : "Restoring",
    body: building ? BUILDING : RESTORING,
    pause: false,
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ heapEnd: number, buildDone: boolean }} */ (ctx.heap);
  initHeapState(ctx, cells);

  if (step.type === STEP.COMPARE) {
    return heapWorkMessage(!state.buildDone);
  }

  if (step.type === STEP.SWAP) {
    if (step.i === 0 && step.j === state.heapEnd) {
      state.buildDone = true;
      state.heapEnd -= 1;
      return {
        title: "Placed",
        body: `Swapped the root with the heap's last cell—${cellPhrase(cells[step.j])} is in its sorted position.`,
        focusIndex: step.j,
      };
    }

    return heapWorkMessage(!state.buildDone);
  }

  return null;
}
