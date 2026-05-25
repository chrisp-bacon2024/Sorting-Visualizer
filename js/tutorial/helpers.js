/**
 * @typedef {object} TutorialMessage
 * @property {string} title
 * @property {string} body
 * @property {boolean} [pause] If false, show while the step plays and auto-advance (no Space).
 */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";

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
  if (step.type === STEP.COMPARE) return "Compared";
  if (step.type === STEP.SWAP) return "Swapped";
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
    title: "Compared",
    body: `Compared ${a} and ${b}. If ${a} had a larger hue than ${b}, they were out of place.`,
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
    title: "Swapped",
    body: `Swapped ${cellPhrase(cells[i])} and ${cellPhrase(cells[j])} so the larger hue moved toward its sorted position.`,
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
    body: "Press Space to play to the next tip.",
  };
}
