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
    body: "Tim sort finished—natural runs were extended and merged until the grid is sorted by hue.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ inMerge: boolean, runKey: string }} */ (ctx.timsort);

  if (step.type === STEP.COMPARE) {
    const gap = Math.abs(step.i - step.j);
    if (gap <= 1) {
      const key = `run:${step.i}:${step.j}`;
      if (key === state.runKey) return null;
      state.runKey = key;
      state.inMerge = false;
      return {
        title: "Extend a run",
        body: `${compareMessage(cells, step.i, step.j).body} Tim sort checked whether adjacent cells continued an increasing run.`,
      };
    }
    if (!state.inMerge) {
      state.inMerge = true;
      return {
        title: "Merge runs",
        body: `${compareMessage(cells, step.i, step.j).body} Two sorted runs from the stack were merged like in merge sort.`,
      };
    }
    return null;
  }

  if (step.type === STEP.SWAP) {
    if (state.inMerge) {
      return {
        title: "Merge write",
        body: `${swapMessage(cells, step.i, step.j).body} The smaller leading hue is placed in ${cellPhrase(cells[step.j])}.`,
      };
    }
    return {
      title: "Fix short run",
      body: `${swapMessage(cells, step.i, step.j).body} A short run was lengthened by shifting hues left.`,
    };
  }

  return null;
}
