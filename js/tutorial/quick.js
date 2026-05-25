/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { cellPhrase } from "./helpers.js";

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "All cells are sorted by hue.",
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
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
