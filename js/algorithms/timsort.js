/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
import { STEP } from "./types.js";

/** @typedef {{ base: number, len: number }} Run */

/**
 * Timsort: natural runs, insertion sort to minRun, then stack merges.
 * Same compare/swap step contract as other algorithms.
 *
 * @param {Cell[]} cells
 * @param {CompareFn} compare
 * @yields {SortStep}
 */
export function* timSort(cells, compare) {
  const n = cells.length;
  if (n <= 1) {
    yield { type: STEP.DONE };
    return;
  }

  const aux = cells.slice();
  const minRun = calcMinRun(n);
  /** @type {Run[]} */
  const stack = [];

  let i = 0;
  while (i < n) {
    let runLen = yield* findRun(cells, i, n, compare);

    if (runLen < minRun) {
      const end = Math.min(i + minRun, n) - 1;
      yield* insertionSortRange(cells, i, end, compare);
      runLen = end - i + 1;
    }

    stack.push({ base: i, len: runLen });
    yield* mergeCollapse(stack, cells, aux, compare);
    i += runLen;
  }

  yield* mergeForce(stack, cells, aux, compare);
  yield { type: STEP.DONE };
}

/**
 * @param {number} n
 */
function calcMinRun(n) {
  let r = 0;
  while (n >= 32) {
    r |= n & 1;
    n >>= 1;
  }
  return n + r;
}

/**
 * @param {Cell[]} cells
 * @param {number} start
 * @param {number} n
 * @param {CompareFn} compare
 */
function* findRun(cells, start, n, compare) {
  if (start >= n - 1) return 1;

  let end = start + 1;

  if (compare(cells[end], cells[start]) < 0) {
    while (end < n && compare(cells[end], cells[end - 1]) < 0) {
      end++;
    }
    yield* reverseRange(cells, start, end - 1);
  } else {
    while (end < n && compare(cells[end], cells[end - 1]) >= 0) {
      end++;
    }
  }

  return end - start;
}

/**
 * @param {Cell[]} cells
 * @param {number} lo
 * @param {number} hi
 */
function* reverseRange(cells, lo, hi) {
  while (lo < hi) {
    yield { type: STEP.SWAP, i: lo, j: hi };
    lo++;
    hi--;
  }
}

/**
 * @param {Cell[]} cells
 * @param {number} lo
 * @param {number} hi
 * @param {CompareFn} compare
 */
function* insertionSortRange(cells, lo, hi, compare) {
  for (let i = lo + 1; i <= hi; i++) {
    let j = i;
    while (j > lo) {
      yield { type: STEP.COMPARE, i: j - 1, j };
      if (compare(cells[j - 1], cells[j]) <= 0) break;
      yield { type: STEP.SWAP, i: j - 1, j };
      j--;
    }
  }
}

/**
 * @param {Run[]} stack
 * @param {Cell[]} cells
 * @param {Cell[]} aux
 * @param {CompareFn} compare
 */
function* mergeCollapse(stack, cells, aux, compare) {
  while (stack.length >= 2) {
    const n = stack.length;
    if (
      n >= 3 &&
      stack[n - 3].len <= stack[n - 2].len + stack[n - 1].len
    ) {
      yield* mergeAt(stack, cells, aux, n - 3, compare);
    } else if (stack[n - 2].len <= stack[n - 1].len) {
      yield* mergeAt(stack, cells, aux, n - 2, compare);
    } else {
      break;
    }
  }
}

/**
 * @param {Run[]} stack
 * @param {Cell[]} cells
 * @param {Cell[]} aux
 * @param {CompareFn} compare
 */
function* mergeForce(stack, cells, aux, compare) {
  while (stack.length > 1) {
    const n = stack.length;
    if (n >= 3 && stack[n - 3].len < stack[n - 1].len) {
      yield* mergeAt(stack, cells, aux, n - 3, compare);
    } else {
      yield* mergeAt(stack, cells, aux, n - 2, compare);
    }
  }
}

/**
 * @param {Run[]} stack
 * @param {Cell[]} cells
 * @param {Cell[]} aux
 * @param {number} i
 * @param {CompareFn} compare
 */
function* mergeAt(stack, cells, aux, i, compare) {
  const run1 = stack[i];
  const run2 = stack[i + 1];
  const lo = run1.base;
  const mid = run1.base + run1.len - 1;
  const hi = run2.base + run2.len - 1;

  yield* merge(cells, aux, lo, mid, hi, compare);
  run1.len += run2.len;
  stack.splice(i + 1, 1);
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
