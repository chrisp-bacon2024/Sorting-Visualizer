/** @typedef {import('./helpers.js').TutorialMessage} TutorialMessage */
/** @typedef {import('./context.js').TutorialContext} TutorialContext */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
import * as bubble from "./bubble.js";
import * as insertion from "./insertion.js";
import * as selection from "./selection.js";
import * as heap from "./heap.js";
import * as quick from "./quick.js";
import * as merge from "./merge.js";
import * as timsort from "./timsort.js";

/** @type {Record<string, { getOutro: () => TutorialMessage, onStep: (step: SortStep, ctx: TutorialContext, cells: import('../model/grid.js').Cell[]) => TutorialMessage | null }>} */
const MODULES = {
  bubble,
  insertion,
  selection,
  heap,
  quick,
  merge,
  timsort,
};

/**
 * @param {string} algoId
 * @returns {TutorialMessage}
 */
export function getTutorialOutro(algoId) {
  const mod = MODULES[algoId];
  return mod
    ? mod.getOutro()
    : {
        title: "Done",
        body: "The grid was sorted by hue. Press Space to finish.",
      };
}

/**
 * @param {string} algoId
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {import('../model/grid.js').Cell[]} cells
 * @returns {TutorialMessage | null}
 * null = no panel text; `pause: false` = live commentary while the step plays.
 */
export function getTutorialStepMessage(algoId, step, ctx, cells) {
  const mod = MODULES[algoId];
  if (!mod) return null;
  return mod.onStep(step, ctx, cells);
}

/**
 * @param {string} algoId
 * @param {SortStep} step
 * @param {TutorialContext} ctx
 * @param {import('../model/grid.js').Cell[]} cells
 * @returns {TutorialMessage | null}
 */
export function getTutorialBeforeStepMessage(algoId, step, ctx, cells) {
  const mod = MODULES[algoId];
  if (!mod || !("getBeforeStep" in mod)) return null;
  return /** @type {{ getBeforeStep: (step: SortStep, ctx: TutorialContext, cells: import('../model/grid.js').Cell[]) => TutorialMessage | null }} */ (
    mod
  ).getBeforeStep(step, ctx, cells);
}
