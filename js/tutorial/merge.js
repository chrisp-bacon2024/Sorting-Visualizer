/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
/** @typedef {import('../algorithms/types.js').MergeMeta} MergeMeta */
/** @typedef {import('../model/grid.js').Cell} Cell */
import { STEP } from "../algorithms/types.js";

const READY_TO_MERGE = {
  title: "Ready to merge",
  body: "Left and Right are two sorted runs ready to be merged into one.",
};

const MERGING = {
  title: "Merging",
  body: "Merging left and right together from least to greatest.",
};

/**
 * @typedef {object} MergePanelState
 * @property {boolean} active
 * @property {boolean} complete
 * @property {Cell[]} leftRun
 * @property {Cell[]} rightRun
 * @property {Cell[]} mergedRun
 * @property {number} compareLeftId
 * @property {number} compareRightId
 * @property {number} writeIndex
 */

/** @returns {TutorialMessage} */
export function getOutro() {
  return {
    title: "Done",
    body: "All cells are sorted by hue.",
  };
}

/**
 * @param {Cell[]} cells
 * @param {number} id
 * @returns {Cell | undefined}
 */
function cellById(cells, id) {
  return cells.find((c) => c.id === id);
}

/**
 * @param {Cell[]} cells
 * @param {number[]} auxIds
 * @param {number} lo
 * @param {number} from
 * @param {number} to
 * @returns {Cell[]}
 */
function cellsForAuxRange(cells, auxIds, lo, from, to) {
  /** @type {Cell[]} */
  const row = [];
  for (let i = from; i <= to; i++) {
    const cell = cellById(cells, auxIds[i - lo]);
    if (cell) row.push(cell);
  }
  return row;
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 */
export function trackMergeStep(step, ctx, cells) {
  const state = /** @type {{
    passKey: string,
    shownBlock: number,
    auxIds: number[],
    merge: MergeMeta | null,
    compareI: number,
    compareJ: number,
    block: number,
  }} */ (ctx.merge);

  if (step.type === STEP.DONE) {
    state.compareI = -1;
    state.compareJ = -1;
    state.finished = true;
    return;
  }

  const meta = "merge" in step ? step.merge : undefined;
  if (!meta) return;

  const passKey = `${meta.lo}:${meta.mid}:${meta.hi}`;
  if (passKey !== state.passKey) {
    state.passKey = passKey;
    state.block += 1;
    state.shownBlock = -1;
    state.finished = false;
    state.auxIds = [];
    for (let i = meta.lo; i <= meta.hi; i++) {
      state.auxIds.push(cells[i].id);
    }
  }

  state.merge = meta;

  if (step.type === STEP.COMPARE) {
    state.compareI = step.i;
    state.compareJ = step.j;
  }

  if (step.type === STEP.SWAP) {
    state.compareI = -1;
    state.compareJ = -1;
  }
}

/** @returns {MergePanelState} */
function completeMergePanelState(/** @type {Cell[]} */ cells) {
  return {
    active: true,
    complete: true,
    leftRun: [],
    rightRun: [],
    mergedRun: cells.slice(),
    compareLeftId: -1,
    compareRightId: -1,
    writeIndex: -1,
  };
}

/**
 * @param {TutorialContext | null} ctx
 * @param {Cell[]} cells
 * @param {boolean} [sortComplete]
 * @returns {MergePanelState}
 */
export function getMergePanelState(ctx, cells, sortComplete = false) {
  const empty = {
    active: false,
    complete: Boolean(sortComplete),
    leftRun: [],
    rightRun: [],
    mergedRun: [],
    compareLeftId: -1,
    compareRightId: -1,
    writeIndex: -1,
  };

  if (!ctx) {
    return sortComplete ? completeMergePanelState(cells) : empty;
  }

  const state = /** @type {{
    auxIds: number[],
    merge: MergeMeta | null,
    compareI: number,
    compareJ: number,
    finished?: boolean,
  }} */ (ctx.merge);

  if (sortComplete || state.finished) {
    return completeMergePanelState(cells);
  }

  const meta = state.merge;
  if (!meta || state.auxIds.length === 0) return empty;

  const { lo, mid, hi, left, right, k } = meta;

  const leftRun = cellsForAuxRange(cells, state.auxIds, lo, left, mid);
  const rightRun = cellsForAuxRange(cells, state.auxIds, lo, right, hi);

  const mergedEnd = state.compareI >= 0 ? k - 1 : k;
  /** @type {Cell[]} */
  const mergedRun = [];
  for (let i = lo; i <= mergedEnd; i++) {
    const cell = cells[i];
    if (cell) mergedRun.push(cell);
  }

  return {
    active: true,
    complete: false,
    leftRun,
    rightRun,
    mergedRun,
    compareLeftId:
      state.compareI >= 0 ? (cells[state.compareI]?.id ?? -1) : -1,
    compareRightId:
      state.compareJ >= 0 ? (cells[state.compareJ]?.id ?? -1) : -1,
    writeIndex: k,
  };
}

/**
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function onStep(step, ctx, cells) {
  trackMergeStep(step, ctx, cells);

  const state = /** @type {{ block: number, shownBlock: number }} */ (ctx.merge);

  if (step.type === STEP.COMPARE) {
    const pause = state.block !== state.shownBlock;
    if (pause) {
      state.shownBlock = state.block;
      return { ...READY_TO_MERGE, pause: true };
    }
    return { ...MERGING, pause: false };
  }

  if (step.type === STEP.SWAP) {
    return { ...MERGING, pause: false };
  }

  return null;
}
