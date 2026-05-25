/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { compareMessage, swapMessage, cellPhrase } from "./helpers.js";

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "Selection sort finished—each pass placed the next-smallest hue on the left until the grid is sorted.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ passStart: number }} */ (ctx.selection);

  if (step.type === STEP.COMPARE) {
    if (step.j !== step.i + 1) return null;
    state.passStart = step.i;
    const base = compareMessage(cells, step.i, step.j);
    return {
      title: `Scan from ${cellPhrase(cells[step.i])}`,
      body: `${base.body} The algorithm scanned the rest of the grid for the smallest hue to place here.`,
    };
  }

  if (step.type === STEP.SWAP) {
    state.passStart += 1;
    return {
      title: "Place next smallest",
      body: `${swapMessage(cells, step.i, step.j).body} The minimum was placed in ${cellPhrase(cells[step.i])}, extending the sorted left region.`,
    };
  }

  return null;
}
