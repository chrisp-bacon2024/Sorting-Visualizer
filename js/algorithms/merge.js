/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/**
 * Merge sort uses an auxiliary buffer, then swaps cells into place so the
 * visual grid stays aligned with the model array.
 *
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* mergeSort(cells, compare) {
  const aux = cells.slice();
  yield* mergeSortRange(cells, aux, 0, cells.length - 1, compare);
  yield { type: STEP.DONE };
}

/**
 * @param {Cell[]} cells
 * @param {Cell[]} aux
 * @param {number} lo
 * @param {number} hi
 * @param {CompareFn} compare
 */
function* mergeSortRange(cells, aux, lo, hi, compare) {
  if (lo >= hi) return;
  const mid = Math.floor((lo + hi) / 2);
  yield* mergeSortRange(cells, aux, lo, mid, compare);
  yield* mergeSortRange(cells, aux, mid + 1, hi, compare);
  yield* merge(cells, aux, lo, mid, hi, compare);
}

/**
 * @param {Cell[]} cells
 * @param {number} cellId
 */
function indexOfCell(cells, cellId) {
  return cells.findIndex((c) => c.id === cellId);
}

/**
 * @param {Cell[]} cells
 * @param {Cell} cell
 * @param {number} target
 */
function* moveCellToIndex(cells, cell, target) {
  const current = indexOfCell(cells, cell.id);
  if (current !== target) {
    yield { type: STEP.SWAP, i: current, j: target };
  }
}

/**
 * @param {Cell[]} cells
 * @param {Cell[]} aux
 * @param {number} lo
 * @param {number} mid
 * @param {number} hi
 * @param {CompareFn} compare
 */
function* merge(cells, aux, lo, mid, hi, compare) {
  for (let i = lo; i <= hi; i++) {
    aux[i] = cells[i];
  }

  let left = lo;
  let right = mid + 1;
  let k = lo;

  while (left <= mid && right <= hi) {
    const leftIndex = indexOfCell(cells, aux[left].id);
    const rightIndex = indexOfCell(cells, aux[right].id);
    yield { type: STEP.COMPARE, i: leftIndex, j: rightIndex };

    if (compare(aux[left], aux[right]) <= 0) {
      yield* moveCellToIndex(cells, aux[left], k);
      left++;
    } else {
      yield* moveCellToIndex(cells, aux[right], k);
      right++;
    }
    k++;
  }

  while (left <= mid) {
    yield* moveCellToIndex(cells, aux[left], k);
    left++;
    k++;
  }

  while (right <= hi) {
    yield* moveCellToIndex(cells, aux[right], k);
    right++;
    k++;
  }
}
