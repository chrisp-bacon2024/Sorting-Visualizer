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
    body: "Insertion sort finished—the left prefix is fully sorted and every cell was placed in hue order.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ activeJ: number }} */ (ctx.insertion);

  if (step.type === STEP.COMPARE) {
    if (step.j !== state.activeJ) {
      state.activeJ = step.j;
      const base = compareMessage(cells, step.i, step.j);
      return {
        title: "Insert into sorted section",
        body: `${base.body} ${cellPhrase(cells[step.j])} was pulled left into the sorted prefix.`,
      };
    }
    return null;
  }

  if (step.type === STEP.SWAP) {
    return {
      title: "Shift left",
      body: `${swapMessage(cells, step.i, step.j).body} It was still too large for that slot, so it shifted one step left.`,
    };
  }

  return null;
}
