/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { cellPhrase } from "./helpers.js";

const FINDING = "Finding final position…";

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
  if (step.type === STEP.COMPARE) {
    const left = cells[step.i];
    const right = cells[step.j];
    if (left && right && left.sortKey() <= right.sortKey()) {
      return {
        title: "In place",
        body: `${cellPhrase(right)} is now in its final position.`,
        pause: true,
      };
    }

    return {
      title: "Finding position",
      body: FINDING,
      pause: false,
    };
  }

  if (step.type === STEP.SWAP) {
    return {
      title: "Finding position",
      body: FINDING,
      pause: false,
    };
  }

  return null;
}
