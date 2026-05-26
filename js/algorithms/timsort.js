/** @typedef {import('./types.js').Cell} Cell */
/** @typedef {import('./types.js').CompareFn} CompareFn */
/** @typedef {import('./types.js').SortStep} SortStep */
/** @typedef {import('./types.js').MergeMeta} MergeMeta */
/** @typedef {import('./types.js').TimMeta} TimMeta */
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

/** Grids under this size cap minRun so multiple runs (and merges) appear on small boards. */
const SMALL_GRID_MIN_RUN_CAP = 8;
const SMALL_GRID_CELL_THRESHOLD = 100;

/** Bump when minRun policy changes so cached timsort recordings are re-recorded. */
export const TIM_RECORDING_VERSION = 1;

/**
 * @param {number} n
 */
function calcMinRun(n) {
  let r = 0;
  let x = n;
  while (x >= 32) {
    r |= x & 1;
    x >>= 1;
  }
  let minRun = x + r;
  if (n < SMALL_GRID_CELL_THRESHOLD) {
    minRun = Math.min(minRun, SMALL_GRID_MIN_RUN_CAP);
  }
  return Math.max(1, minRun);
}

/**
 * @param {number} lo
 * @param {number} hi
 * @returns {TimMeta}
 */
function timRunMeta(lo, hi) {
  return { phase: "run", lo, hi };
}

/**
 * @param {number} lo
 * @param {number} hi
 * @returns {TimMeta}
 */
function timInsertMeta(lo, hi) {
  return { phase: "insert", lo, hi };
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
  const runLo = start;

  if (compare(cells[end], cells[start]) < 0) {
    while (end < n && compare(cells[end], cells[end - 1]) < 0) {
      yield {
        type: STEP.COMPARE,
        i: end - 1,
        j: end,
        tim: timRunMeta(runLo, end),
      };
      end++;
    }
    yield* reverseRange(cells, start, end - 1, runLo, end - 1);
  } else {
    while (end < n && compare(cells[end], cells[end - 1]) >= 0) {
      yield {
        type: STEP.COMPARE,
        i: end - 1,
        j: end,
        tim: timRunMeta(runLo, end),
      };
      end++;
    }
  }

  return end - start;
}

/**
 * @param {Cell[]} cells
 * @param {number} lo
 * @param {number} hi
 * @param {number} runLo
 * @param {number} runHi
 */
function* reverseRange(cells, lo, hi, runLo, runHi) {
  while (lo < hi) {
    yield {
      type: STEP.SWAP,
      i: lo,
      j: hi,
      tim: timRunMeta(runLo, runHi),
    };
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
  const tim = timInsertMeta(lo, hi);
  for (let i = lo + 1; i <= hi; i++) {
    let j = i;
    while (j > lo) {
      yield { type: STEP.COMPARE, i: j - 1, j, tim };
      if (compare(cells[j - 1], cells[j]) <= 0) break;
      yield { type: STEP.SWAP, i: j - 1, j, tim };
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
 * @param {MergeMeta} merge
 */
function* moveCellToIndex(cells, cell, target, merge) {
  const current = indexOfCell(cells, cell.id);
  if (current !== target) {
    yield { type: STEP.SWAP, i: current, j: target, merge };
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
    yield {
      type: STEP.COMPARE,
      i: leftIndex,
      j: rightIndex,
      merge: { lo, mid, hi, left, right, k },
    };

    if (compare(aux[left], aux[right]) <= 0) {
      yield* moveCellToIndex(cells, aux[left], k, {
        lo,
        mid,
        hi,
        left,
        right,
        k,
      });
      left++;
    } else {
      yield* moveCellToIndex(cells, aux[right], k, {
        lo,
        mid,
        hi,
        left,
        right,
        k,
      });
      right++;
    }
    k++;
  }

  while (left <= mid) {
    yield* moveCellToIndex(cells, aux[left], k, { lo, mid, hi, left, right, k });
    left++;
    k++;
  }

  while (right <= hi) {
    yield* moveCellToIndex(cells, aux[right], k, { lo, mid, hi, left, right, k });
    right++;
    k++;
  }
}
