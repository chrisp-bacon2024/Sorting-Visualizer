/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { swapMessage, cellPhrase } from "./helpers.js";

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "Heap sort finished—each extract moved the current maximum to the tail until the grid is sorted by hue.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ siftNoted: boolean }} */ (ctx.heap);

  if (step.type === STEP.SWAP) {
    if (step.i === 0 && step.j > 0) {
      state.siftNoted = false;
      return {
        title: "Extract maximum",
        body: `Swapping ${cellPhrase(cells[0])} and ${cellPhrase(cells[step.j])}—the largest hue moves to the end of the unsorted region into its final sorted spot.`,
      };
    }

    if (!state.siftNoted) {
      state.siftNoted = true;
      return {
        title: "Sift down",
        body: `${swapMessage(cells, step.i, step.j).body} The heap is restored so each parent is larger than its children.`,
      };
    }
    return null;
  }

  return null;
}
