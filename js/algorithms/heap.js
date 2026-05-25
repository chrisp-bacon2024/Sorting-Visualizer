/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/**
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* heapSort(cells, compare) {
  const n = cells.length;

  for (let start = Math.floor(n / 2) - 1; start >= 0; start--) {
    yield* heapify(cells, n, start, compare);
  }

  for (let end = n - 1; end > 0; end--) {
    yield { type: STEP.SWAP, i: 0, j: end };
    yield* heapify(cells, end, 0, compare);
  }

  yield { type: STEP.DONE };
}

/**
 * Max-heap sift-down for ascending sort (larger hues near root).
 *
 * @param {Cell[]} cells
 * @param {number} heapSize
 * @param {number} root
 * @param {CompareFn} compare
 */
function* heapify(cells, heapSize, root, compare) {
  let largest = root;

  while (true) {
    const left = 2 * largest + 1;
    const right = 2 * largest + 2;
    let next = largest;

    if (left < heapSize) {
      yield { type: STEP.COMPARE, i: left, j: next };
      if (compare(cells[left], cells[next]) > 0) next = left;
    }

    if (right < heapSize) {
      yield { type: STEP.COMPARE, i: right, j: next };
      if (compare(cells[right], cells[next]) > 0) next = right;
    }

    if (next === largest) break;

    yield { type: STEP.SWAP, i: largest, j: next };
    largest = next;
  }
}
