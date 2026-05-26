/** @typedef {import('../algorithms/types.js').SortStep} SortStep */

/**
 * @typedef {Record<string, unknown>} TutorialContext
 */

/**
 * @returns {TutorialContext}
 */
export function createTutorialContext() {
  return {
    stepCount: 0,
    cols: 20,
    bubble: { pass: 1, lastJ: -1 },
    insertion: { activeJ: -1 },
    selection: { passStart: 0 },
    heap: { heapEnd: -1, buildDone: false },
    quick: {
      pivotIndex: -1,
      partitionStarted: false,
      lo: 0,
      hi: -1,
      storeIndex: 0,
      scanIndex: -1,
      active: false,
      lastPlacedIndex: -1,
    },
    merge: {
      passKey: "",
      shownBlock: -1,
      auxIds: [],
      merge: null,
      compareI: -1,
      compareJ: -1,
      block: 0,
      finished: false,
    },
    timsort: {
      phase: "idle",
      passKey: "",
      block: 0,
      shownBlock: -1,
      runLo: 0,
      runHi: -1,
      finished: false,
    },
  };
}

/**
 * @param {TutorialContext} ctx
 * @param {number} cols
 */
export function setContextCols(ctx, cols) {
  ctx.cols = cols;
}
