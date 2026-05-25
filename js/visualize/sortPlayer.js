/** @typedef {import('../sort/sortSession.js').SortRecording} SortRecording */
/** @typedef {import('../algorithms/types.js').SortStep} SortStep */
import { STEP } from "../algorithms/types.js";

/**
 * @param {number} ms
 * @param {AbortSignal} [signal]
 */
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const id = setTimeout(resolve, Math.max(0, ms));
    const onAbort = () => {
      clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class SortPlayer {
  constructor() {
    /** @type {AbortController | null} */
    this._controller = null;
    this.paused = false;
  }

  get isRunning() {
    return this._controller !== null && !this._controller.signal.aborted;
  }

  abort() {
    this._controller?.abort();
    this._controller = null;
    this.paused = false;
  }

  pause() {
    this.paused = true;
    this._controller?.abort();
    this._controller = null;
  }

  /**
   * @param {SortRecording} recording
   * @param {number} startIndex
   * @param {{
   *   getPlaybackSettings: () => { delayMs: number, stride: number, tutorial?: boolean },
   *   onFrame: (fromIndex: number, toIndex: number) => void,
   *   reducedMotion?: boolean,
   *   tutorialMode?: boolean,
   *   onTutorialStep?: (ctx: { step: SortStep, index: number }) => Promise<void>,
   * }} options
   * @returns {Promise<'completed' | 'paused' | 'aborted'>}
   */
  async playRecording(
    recording,
    startIndex,
    {
      getPlaybackSettings,
      onFrame,
      reducedMotion = false,
      tutorialMode = false,
      onTutorialStep,
    }
  ) {
    this.abort();
    this._controller = new AbortController();
    this.paused = false;
    const signal = this._controller.signal;

    try {
      let index = startIndex;
      onFrame(index, index);

      while (index < recording.steps.length) {
        const step = recording.steps[index];

        if (step.type === STEP.DONE) {
          onFrame(recording.steps.length, recording.steps.length);
          if (tutorialMode && onTutorialStep) {
            try {
              await onTutorialStep({ step, index });
            } catch (err) {
              if (err instanceof DOMException && err.name === "AbortError") {
                return this.paused ? "paused" : "aborted";
              }
              throw err;
            }
          }
          break;
        }

        const nextIndex = index + 1;

        if (tutorialMode) {
          onFrame(index, nextIndex);
          if (onTutorialStep) {
            try {
              await onTutorialStep({ step, index });
            } catch (err) {
              if (err instanceof DOMException && err.name === "AbortError") {
                return this.paused ? "paused" : "aborted";
              }
              throw err;
            }
          }
          index = nextIndex;
          continue;
        }

        const settings = getPlaybackSettings();
        const stride = settings.stride;
        const toIndex = Math.min(index + stride, recording.steps.length);
        const fromIndex = index;
        index = toIndex;

        onFrame(fromIndex, index);

        const stepDelay = reducedMotion ? 0 : settings.delayMs;
        await delay(stepDelay, signal);
      }

      return "completed";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return this.paused ? "paused" : "aborted";
      }
      throw err;
    } finally {
      if (!this.paused) {
        this._controller = null;
      }
    }
  }
}
