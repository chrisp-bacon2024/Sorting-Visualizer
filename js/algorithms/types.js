/** @typedef {import('../model/grid.js').Cell} Cell */

export const STEP = {
  COMPARE: "compare",
  SWAP: "swap",
  DONE: "done",
};

/**
 * @typedef {{ type: typeof STEP.COMPARE, i: number, j: number }} CompareStep
 * @typedef {{ type: typeof STEP.SWAP, i: number, j: number }} SwapStep
 * @typedef {{ type: typeof STEP.DONE }} DoneStep
 * @typedef {CompareStep | SwapStep | DoneStep} SortStep
 */

/**
 * @typedef {(a: Cell, b: Cell) => number} CompareFn
 * @typedef {(cells: Cell[], compare: CompareFn) => Generator<SortStep, void, unknown>} SortGenerator
 */
