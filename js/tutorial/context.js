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
    quick: { pivotIndex: -1, partitionStarted: false },
    merge: { mergeKey: "" },
    timsort: { inMerge: false, runKey: "" },
  };
}

/**
 * @param {TutorialContext} ctx
 * @param {number} cols
 */
export function setContextCols(ctx, cols) {
  ctx.cols = cols;
}
