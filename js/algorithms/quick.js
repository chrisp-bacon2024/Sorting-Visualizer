/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/**
 * Quick sort with Lomuto partition (last element as pivot).
 * Recursive and iterative versions produce the same compare/swap steps
 * when they use the same pivot rule and partition order.
 *
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* quickSort(cells, compare) {
  yield* quickSortRange(cells, 0, cells.length - 1, compare);
  yield { type: STEP.DONE };
}

/**
 * @param {Cell[]} cells
 * @param {number} lo
 * @param {number} hi
 * @param {CompareFn} compare
 */
function* quickSortRange(cells, lo, hi, compare) {
  if (lo >= hi) return;

  const pivotIndex = yield* partition(cells, lo, hi, compare);
  yield* quickSortRange(cells, lo, pivotIndex - 1, compare);
  yield* quickSortRange(cells, pivotIndex + 1, hi, compare);
}

/**
 * @param {Cell[]} cells
 * @param {number} lo
 * @param {number} hi
 * @param {CompareFn} compare
 * @returns {Generator<SortStep, number, unknown>}
 */
function* partition(cells, lo, hi, compare) {
  const pivotIndex = hi;
  let storeIndex = lo;

  for (let j = lo; j < hi; j++) {
    yield { type: STEP.COMPARE, i: j, j: pivotIndex };

    if (compare(cells[j], cells[pivotIndex]) <= 0) {
      if (j !== storeIndex) {
        yield { type: STEP.SWAP, i: j, j: storeIndex };
      }
      storeIndex++;
    }
  }

  if (storeIndex !== hi) {
    yield { type: STEP.SWAP, i: storeIndex, j: hi };
  }

  return storeIndex;
}
