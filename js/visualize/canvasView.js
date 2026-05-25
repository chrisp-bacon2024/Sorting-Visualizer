/**
 * Owns the canvas element, handles DPR scaling and resize events.
 * Calls `onResize(width, height)` when the drawable area changes.
 */
export class CanvasView {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {(width: number, height: number) => void} onResize
   */
  constructor(canvas, onResize) {
    this.canvas = canvas;
    this.onResize = onResize;
    /** @type {CanvasRenderingContext2D} */
    this.ctx = canvas.getContext("2d");
    this.cssWidth = 0;
    this.cssHeight = 0;

    this._resizeObserver = new ResizeObserver(() => this.fitToContainer());
    this._resizeObserver.observe(canvas);
    this.fitToContainer();
  }

  fitToContainer() {
    const width = Math.floor(this.canvas.clientWidth);
    const height = Math.floor(this.canvas.clientHeight);
    if (width <= 0 || height <= 0) return;
    if (width === this.cssWidth && height === this.cssHeight) return;

    this.cssWidth = width;
    this.cssHeight = height;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.onResize(width, height);
  }

  /**
   * @param {() => void} draw
   */
  render(draw) {
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
    draw(this.ctx);
  }

  disconnect() {
    this._resizeObserver.disconnect();
  }
}
