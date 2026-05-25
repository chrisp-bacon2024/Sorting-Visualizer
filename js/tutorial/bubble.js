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
 * @param {number} i
 * @param {number} j
 */
function compareLine(cells, i, j) {
  return `Compared ${cellPhrase(cells[i])} and ${cellPhrase(cells[j])}.`;
}

/**
 * @param {Cell[]} cells
 * @param {number} i
 * @param {number} j
 */
function swapLine(cells, i, j) {
  return `Swapped ${cellPhrase(cells[i])} and ${cellPhrase(cells[j])}.`;
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  const state = /** @type {{ pass: number, lastJ: number }} */ (ctx.bubble);

  if (step.type === STEP.COMPARE) {
    if (step.j < state.lastJ) state.pass += 1;
    state.lastJ = step.j;

    if (step.j === 0) {
      return {
        title: `Pass ${state.pass}`,
        body: `New pass—scanning neighbors left to right.`,
        pause: true,
      };
    }

    return {
      title: "Compare",
      body: compareLine(cells, step.i, step.j),
      pause: false,
    };
  }

  if (step.type === STEP.SWAP) {
    const n = cells.length;
    const finalSlot = n - state.pass;
    const placedAt = step.j;
    const outcome =
      placedAt === finalSlot
        ? "The larger hue is now in its final position."
        : "The larger hue is closer to its sorted position.";

    return {
      title: placedAt === finalSlot ? "In place" : "Swap",
      body: `${swapLine(cells, step.i, step.j)} ${outcome}`,
      pause: true,
    };
  }

  return null;
}
