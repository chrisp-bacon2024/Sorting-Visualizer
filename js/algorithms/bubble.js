/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/**
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* bubbleSort(cells, compare) {
  const n = cells.length;

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;

    for (let j = 0; j < n - i - 1; j++) {
      yield { type: STEP.COMPARE, i: j, j: j + 1 };

      if (compare(cells[j], cells[j + 1]) > 0) {
        yield { type: STEP.SWAP, i: j, j: j + 1 };
        swapped = true;
      }
    }

    if (!swapped) break;
  }

  yield { type: STEP.DONE };
}
