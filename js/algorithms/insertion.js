/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/**
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* insertionSort(cells, compare) {
  const n = cells.length;

  for (let i = 1; i < n; i++) {
    let j = i;

    while (j > 0) {
      yield { type: STEP.COMPARE, i: j - 1, j };

      if (compare(cells[j - 1], cells[j]) <= 0) break;

      yield { type: STEP.SWAP, i: j - 1, j };
      j--;
    }
  }

  yield { type: STEP.DONE };
}
