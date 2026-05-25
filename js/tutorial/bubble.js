/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { compareMessage, swapMessage } from "./helpers.js";

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "Bubble sort finished—every pass bubbled the largest remaining hue rightward. The grid is sorted by hue.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ pass: number, lastJ: number }} */ (ctx.bubble);

  if (step.type === STEP.COMPARE) {
    if (step.j < state.lastJ) state.pass += 1;
    state.lastJ = step.j;
    if (step.j !== 0) return null;

    const pass = state.pass;
    const base = compareMessage(cells, step.i, step.j);
    return {
      title: `Pass ${pass} — sweep started`,
      body: `${base.body} This pass started a left-to-right sweep; the sorted region grew from the right.`,
    };
  }

  if (step.type === STEP.SWAP) {
    return {
      title: "Out of order — swapped",
      body: `${swapMessage(cells, step.i, step.j).body} A larger hue bubbled toward the end of this pass.`,
    };
  }

  return null;
}
