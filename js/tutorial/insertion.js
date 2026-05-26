/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import { hueColorName } from "./helpers.js";

const FINDING = "Finding its place in the sorted prefix…";

/**
 * @param {Cell} cell
 * @returns {TutorialMessage}
 */
function insertedMessage(cell) {
  const color = hueColorName(cell.hue);
  return {
    title: "Inserted",
    body: `The ${color} cell's hue is greater than any cells that are before it. It has finished inserting.`,
    pause: true,
    focusIndex: cell.index,
  };
}

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
      return insertedMessage(right);
    }

    return {
      title: "Finding place",
      body: FINDING,
      pause: false,
    };
  }

  if (step.type === STEP.SWAP) {
    // After swapping into index 0, the inner loop exits without a final compare
    // (while j > 0), so the inserted tip must come from this swap step instead.
    if (step.i === 0) {
      const cell = cells[0];
      if (cell) return insertedMessage(cell);
    }

    return {
      title: "Finding place",
      body: FINDING,
      pause: false,
    };
  }

  return null;
}
