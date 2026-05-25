/** @typedef {{ title: string, body: string, stepLabel?: string }} TutorialMessage */

export class TutorialPanel {
  constructor() {
    this.bar = /** @type {HTMLElement} */ (
      document.querySelector("#tutorial-bar")
    );
    this.tagEl = /** @type {HTMLElement} */ (
      document.querySelector("#tutorial-tag")
    );
    this.stepEl = /** @type {HTMLElement} */ (
      document.querySelector("#tutorial-step")
    );
    this.textEl = /** @type {HTMLElement} */ (
      document.querySelector("#tutorial-text")
    );

    /** @type {(() => void) | null} */
    this._resolveContinue = null;
    /** @type {((reason: DOMException) => void) | null} */
    this._rejectContinue = null;

    this._onKeyDown = (e) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (this.bar.hidden || !this._resolveContinue) return;
      e.preventDefault();
      e.stopPropagation();
      this.continueStep();
    };
    document.addEventListener("keydown", this._onKeyDown, true);
    this._enabled = false;
    this.hide();
  }

  /** @param {boolean} enabled */
  setEnabled(enabled) {
    this._enabled = enabled;
    if (!enabled) this.hide();
  }

  /**
   * @param {TutorialMessage} message
   */
  show(message) {
    if (!this._enabled) return;
    this.tagEl.textContent = message.title;
    this.textEl.textContent = message.body;
    this.stepEl.textContent = message.stepLabel ?? "";
    this.bar.hidden = false;
  }

  hide() {
    this.bar.hidden = true;
    this._clearWait();
  }

  /** Advance to the next step (Space or programmatic continue). */
  continueStep() {
    this._finishWait();
  }

  _finishWait() {
    const resolve = this._resolveContinue;
    this._clearWait();
    resolve?.();
  }

  /** Reject an in-flight wait (e.g. user pressed Pause). */
  cancelWait() {
    const reject = this._rejectContinue;
    this._clearWait();
    reject?.(new DOMException("Aborted", "AbortError"));
  }

  _clearWait() {
    this._resolveContinue = null;
    this._rejectContinue = null;
  }

  /**
   * @returns {Promise<void>}
   */
  waitForContinue() {
    this._clearWait();
    return new Promise((resolve, reject) => {
      this._resolveContinue = resolve;
      this._rejectContinue = reject;
    });
  }
}
