/** @typedef {{ title: string, body: string }} TutorialMessage */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";

/** @type {Readonly<Record<string, { color: string, width: number }>>} */
export const TUTORIAL_HIGHLIGHT = {
  primary: { color: "#38bdf8", width: 3 },
  secondary: { color: "#f472b6", width: 3 },
};

/**
 * @param {number} hue
 * @returns {string}
 */
export function hueColorName(hue) {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  if (h < 20 || h >= 340) return "red";
  if (h < 50) return "orange";
  if (h < 75) return "yellow";
  if (h < 150) return "green";
  if (h < 190) return "teal";
  if (h < 220) return "cyan";
  if (h < 260) return "blue";
  if (h < 300) return "purple";
  return "pink";
}

/**
 * @param {Cell | undefined} cell
 * @returns {string}
 */
export function cellPhrase(cell) {
  if (!cell) return "a cell";
  return `the ${hueColorName(cell.hue)} cell`;
}

/**
 * @param {import('../algorithms/types.js').SortStep} step
 */
export function stepActionLabel(step) {
  if (step.type === STEP.COMPARE) return "Compare";
  if (step.type === STEP.SWAP) return "Swap";
  if (step.type === STEP.DONE) return "Done";
  return "Step";
}

/**
 * @param {Cell[]} cells
 * @param {number} i
 * @param {number} j
 * @returns {TutorialMessage}
 */
export function compareMessage(cells, i, j) {
  const a = cellPhrase(cells[i]);
  const b = cellPhrase(cells[j]);
  return {
    title: "Compare",
    body: `Comparing ${a} and ${b}. If ${a} has a larger hue than ${b}, they are out of place.`,
  };
}

/**
 * @param {Cell[]} cells
 * @param {number} i
 * @param {number} j
 * @returns {TutorialMessage}
 */
export function swapMessage(cells, i, j) {
  return {
    title: "Swap",
    body: `Swapping ${cellPhrase(cells[i])} and ${cellPhrase(cells[j])} so the larger hue moves toward its sorted position.`,
  };
}

/**
 * @param {Cell[]} cells
 * @param {import('../algorithms/types.js').SortStep} step
 * @returns {TutorialMessage}
 */
export function messageForStep(cells, step) {
  if (step.type === STEP.COMPARE) return compareMessage(cells, step.i, step.j);
  if (step.type === STEP.SWAP) return swapMessage(cells, step.i, step.j);
  return {
    title: "Step",
    body: "Press Space for the next step.",
  };
}
