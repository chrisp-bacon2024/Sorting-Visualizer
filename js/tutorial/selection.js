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
 * @param {Cell[]} cells
 * @param {number} anchorIndex
 * @returns {TutorialMessage}
 */
function scanningMessage(cells, anchorIndex) {
  return {
    title: "Scanning",
    body: `Scanning for a smaller hue than ${cellPhrase(cells[anchorIndex])}.`,
    pause: false,
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
    if (step.j === step.i + 1) {
      state.passStart = step.i;
    }
    if (state.passStart < 0) return null;
    return scanningMessage(cells, state.passStart);
  }

  if (step.type === STEP.SWAP) {
    return {
      title: "Placed",
      body: `${cellPhrase(cells[step.i])} is in its sorted position.`,
      focusIndex: step.i,
    };
  }

  return null;
}
