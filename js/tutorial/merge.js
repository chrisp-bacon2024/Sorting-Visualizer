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
    body: "Merge sort finished—sorted runs were merged until one hue-ordered sequence covers the grid.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ mergeKey: string }} */ (ctx.merge);

  if (step.type === STEP.COMPARE) {
    const key = `${Math.min(step.i, step.j)}:${Math.max(step.i, step.j)}`;
    if (key === state.mergeKey) return null;
    state.mergeKey = key;
    return {
      title: "Merge runs",
      body: `${compareMessage(cells, step.i, step.j).body} Two sorted sections were merged by taking the smaller leading hue.`,
    };
  }

  if (step.type === STEP.SWAP) {
    if (!state.mergeKey) return null;
    state.mergeKey = "";
    return {
      title: "Write merged cell",
      body: `${swapMessage(cells, step.i, step.j).body} The chosen hue was written into ${cellPhrase(cells[step.j])} as the merged output grew.`,
    };
  }

  return null;
}
