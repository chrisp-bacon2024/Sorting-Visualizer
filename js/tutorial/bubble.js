/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";

const BUBBLING = {
  title: "Bubbling",
  body: "Larger hues swap to be higher in the array.",
};

const NO_SWAP_PASS = {
  title: "Sorted",
  body: "No swaps this pass—the grid is sorted by hue.",
};

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "All cells are sorted by hue.",
  };
}

/**
 * Last compare in a pass uses step.j === j_inner + 1 (see algorithms/bubble.js).
 * @param {number} n
 * @param {number} pass
 * @param {number} stepJ
 */
function isLastCompareOfPass(n, pass, stepJ) {
  return stepJ === n - pass;
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{
    pass: number,
    lastJ: number,
    swappedThisPass: boolean,
  }} */ (ctx.bubble);

  const n = cells.length;

  if (step.type === STEP.COMPARE) {
    if (step.j < state.lastJ) {
      state.pass += 1;
    }
    state.lastJ = step.j;

    if (step.i === 0) {
      state.swappedThisPass = false;
      return {
        title: `Pass ${state.pass}`,
        body: "Scanning neighbors left to right.",
        pause: true,
      };
    }

    if (isLastCompareOfPass(n, state.pass, step.j) && !state.swappedThisPass) {
      return { ...NO_SWAP_PASS, pause: true };
    }

    return { ...BUBBLING, pause: false };
  }

  if (step.type === STEP.SWAP) {
    state.swappedThisPass = true;
    return { ...BUBBLING, pause: false };
  }

  return null;
}
