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
    body: "Quick sort finished—partitions placed each pivot in its final spot until the whole grid is sorted.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ pivot: number, partitionStarted: boolean }} */ (
    ctx.quick
  );

  if (step.type === STEP.COMPARE) {
    if (step.j !== state.pivot) {
      state.pivot = step.j;
      state.partitionStarted = false;
    }
    if (!state.partitionStarted) {
      state.partitionStarted = true;
      const pivotPhrase = cellPhrase(cells[state.pivot]);
      return {
        title: "Partition",
        body: `${compareMessage(cells, step.i, step.j).body} Cells are compared to the pivot ${pivotPhrase} to decide which side they belong on.`,
      };
    }
    return null;
  }

  if (step.type === STEP.SWAP) {
    state.partitionStarted = false;
    if (step.i !== state.pivot && step.j !== state.pivot) return null;
    return {
      title: "Pivot in place",
      body: `${swapMessage(cells, step.i, step.j).body} The pivot is now where everything left is smaller and everything right is larger.`,
    };
  }

  return null;
}
