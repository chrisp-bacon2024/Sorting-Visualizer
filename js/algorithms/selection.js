/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/**
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* selectionSort(cells, compare) {
  const n = cells.length;

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;

    for (let j = i + 1; j < n; j++) {
      yield { type: STEP.COMPARE, i: minIndex, j };

      if (compare(cells[j], cells[minIndex]) < 0) {
        minIndex = j;
      }
    }

    if (minIndex !== i) {
      yield { type: STEP.SWAP, i, j: minIndex };
    }
  }

  yield { type: STEP.DONE };
}
