/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";
import {
  getMergePanelState,
  trackMergeStep,
  READY_TO_MERGE,
  MERGING,
} from "./merge.js";

const NATURAL_RUN_READY = {
  title: "Natural run",
  body: "Tim sort scans for a streak of hues already in increasing order.",
};

const NATURAL_RUN_ACTIVE = {
  title: "Natural run",
  body: "Neighbors are compared to extend the streak forward.",
};

const GROW_RUN_READY = {
  title: "Grow the run",
  body: "This run is shorter than minRun—insertion sort lengthens it before merging.",
};

const GROW_RUN_ACTIVE = {
  title: "Grow the run",
  body: "Shifting hues left until the run reaches minRun size.",
};

/**
 * @typedef {object} TimPanelState
 * @property {boolean} active
 * @property {boolean} complete
 * @property {'idle' | 'run' | 'insert' | 'merge'} mode
 * @property {Cell[]} runCells
 * @property {import('./merge.js').MergePanelState | null} merge
 */

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 */
export function trackTimStep(step, ctx, cells) {
  const tim = /** @type {{
    phase: string,
    passKey: string,
    block: number,
    shownBlock: number,
    runLo: number,
    runHi: number,
    finished?: boolean,
  }} */ (ctx.timsort);

  if (step.type === STEP.DONE) {
    tim.finished = true;
    trackMergeStep(step, ctx, cells);
    return;
  }

  if ("merge" in step && step.merge) {
    tim.phase = "merge";
    trackMergeStep(step, ctx, cells);
    return;
  }

  const meta = "tim" in step ? step.tim : undefined;
  if (!meta) return;

  tim.phase = meta.phase;
  tim.runLo = meta.lo;
  tim.runHi = meta.hi;

  const passKey =
    meta.phase === "run"
      ? `run:${meta.lo}`
      : `insert:${meta.lo}:${meta.hi}`;

  if (passKey !== tim.passKey) {
    tim.passKey = passKey;
    tim.block += 1;
    tim.shownBlock = -1;
    tim.finished = false;
  }
}

/**
 * @param {TutorialContext | null} ctx
 * @param {Cell[]} cells
 * @param {boolean} [sortComplete]
 * @returns {TimPanelState}
 */
export function getTimPanelState(ctx, cells, sortComplete = false) {
  const idle = {
    active: false,
    complete: Boolean(sortComplete),
    mode: /** @type {const} */ ("idle"),
    runCells: [],
    merge: null,
  };

  if (!ctx) {
    if (sortComplete) {
      return {
        active: true,
        complete: true,
        mode: "merge",
        runCells: [],
        merge: getMergePanelState(null, cells, true),
      };
    }
    return idle;
  }

  const tim = /** @type {{
    phase: string,
    runLo: number,
    runHi: number,
    finished?: boolean,
  }} */ (ctx.timsort);

  if (sortComplete || tim.finished) {
    return {
      active: true,
      complete: true,
      mode: "merge",
      runCells: [],
      merge: getMergePanelState(ctx, cells, true),
    };
  }

  if (tim.phase === "merge") {
    const merge = getMergePanelState(ctx, cells, false);
    return {
      active: merge.active,
      complete: false,
      mode: "merge",
      runCells: [],
      merge,
    };
  }

  if (tim.phase === "run" || tim.phase === "insert") {
    /** @type {Cell[]} */
    const runCells = [];
    for (let i = tim.runLo; i <= tim.runHi; i++) {
      const cell = cells[i];
      if (cell) runCells.push(cell);
    }
    return {
      active: runCells.length > 0,
      complete: false,
      mode: tim.phase === "insert" ? "insert" : "run",
      runCells,
      merge: null,
    };
  }

  return idle;
}

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "All cells are sorted by hue.",
  };
}

export function onStep(step, ctx, cells) {
  trackTimStep(step, ctx, cells);

  if ("merge" in step && step.merge) {
    const mergeState = /** @type {{ block: number, shownBlock: number }} */ (
      ctx.merge
    );

    if (step.type === STEP.COMPARE) {
      const pause = mergeState.block !== mergeState.shownBlock;
      if (pause) {
        mergeState.shownBlock = mergeState.block;
      }
      return pause
        ? { ...READY_TO_MERGE, pause: true }
        : { ...MERGING, pause: false };
    }

    if (step.type === STEP.SWAP) {
      return { ...MERGING, pause: false };
    }
  }

  const tim = /** @type {{ block: number, shownBlock: number }} */ (ctx.timsort);
  const meta = "tim" in step ? step.tim : undefined;

  if (meta?.phase === "run") {
    const pause = tim.block !== tim.shownBlock;
    if (pause) {
      tim.shownBlock = tim.block;
    }
    return pause
      ? { ...NATURAL_RUN_READY, pause: true }
      : { ...NATURAL_RUN_ACTIVE, pause: false };
  }

  if (meta?.phase === "insert") {
    const pause = tim.block !== tim.shownBlock;
    if (pause) {
      tim.shownBlock = tim.block;
    }
    return pause
      ? { ...GROW_RUN_READY, pause: true }
      : { ...GROW_RUN_ACTIVE, pause: false };
  }

  return null;
}
