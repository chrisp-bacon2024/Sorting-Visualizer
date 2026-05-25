/**
 * Minimal animation loop with a dirty flag.
 * Sorting will call requestFrame() after each step; idle runs are cheap.
 */
export class Animator {
  constructor() {
    /** @type {(() => void) | null} */
    this._draw = null;
    this._dirty = true;
    this._running = false;
    this._rafId = 0;
  }

  /**
   * @param {() => void} draw
   */
  start(draw) {
    this._draw = draw;
    if (!this._running) {
      this._running = true;
      this._tick();
    }
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
  }

  requestFrame() {
    this._dirty = true;
  }

  _tick() {
    this._rafId = requestAnimationFrame(() => {
      if (!this._running) return;
      if (this._dirty && this._draw) {
        this._dirty = false;
        this._draw();
      }
      this._tick();
    });
  }
}
