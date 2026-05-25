/** @typedef {import('../model/grid.js').Cell} Cell */
import { CanvasView } from "./canvasView.js";

const ACTIVE_STROKE = "#facc15";
const ACTIVE_GLOW = "rgba(250, 204, 21, 0.65)";
const SORTED_OPACITY = 0.4;

/**
 * @param {number} index
 * @returns {number}
 */
function heapDepth(index) {
  return index === 0 ? 0 : Math.floor(Math.log2(index + 1));
}

/**
 * @param {number} heapSize
 * @returns {number}
 */
function maxHeapDepth(heapSize) {
  if (heapSize <= 0) return 0;
  return heapDepth(heapSize - 1);
}

export class HeapTreeView {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.view = new CanvasView(canvas, () => {});
    /** @type {boolean} */
    this.showHueValues = false;
  }

  /**
   * @param {Cell[]} cells
   * @param {number} heapSize Active heap length (indices 0 … heapSize − 1)
   */
  /** Re-measure canvas after the panel becomes visible. */
  resize() {
    this.view.fitToContainer();
  }

  render(cells, heapSize) {
    const n = cells.length;
    const clampedHeap = Math.max(0, Math.min(heapSize, n));

    this.view.render((ctx) => {
      const w = this.view.cssWidth;
      const h = this.view.cssHeight;
      if (w <= 0 || h <= 0) return;

      const sortedCount = n - clampedHeap;
      const pad = 14;
      const bottomPad = 10;

      const sortedGap = 4;
      const sortedLabelGap = 8;
      const sortedFont = "600 10px system-ui, sans-serif";
      let sortedMini = 0;
      let sortedRowY = 0;
      let sortedDotsStartX = 0;
      if (sortedCount > 0) {
        ctx.font = sortedFont;
        const sortedLabelW = ctx.measureText("Sorted").width;
        sortedDotsStartX = pad + sortedLabelW + sortedLabelGap;
        const sortedAvail = w - pad - sortedDotsStartX;
        sortedMini = Math.min(
          12,
          Math.max(
            3,
            (sortedAvail - (sortedCount - 1) * sortedGap) / (2 * sortedCount)
          )
        );
        sortedRowY = h - bottomPad - sortedMini;
      }

      const stripTop =
        sortedCount > 0 ? sortedRowY - sortedMini - 6 : h;
      const treeH = Math.max(0, stripTop);
      const radius =
        w >= 260 ? 14 : w >= 200 ? 12 : clampedHeap <= 7 ? 14 : 11;

      /** @type {Map<number, { x: number, y: number }>} */
      const positions = new Map();

      if (clampedHeap > 0) {
        const levels = maxHeapDepth(clampedHeap) + 1;
        const levelH =
          levels > 1 ? (treeH - pad * 2) / (levels - 1) : treeH / 2;

        for (let d = 0; d < levels; d++) {
          const start = (1 << d) - 1;
          const end = Math.min((1 << (d + 1)) - 1, clampedHeap);
          const count = end - start;
          if (count <= 0) continue;

          for (let i = start; i < end; i++) {
            const slot = i - start;
            const x =
              count === 1
                ? w / 2
                : pad + radius + (slot / (count - 1)) * (w - pad * 2 - radius * 2);
            const y = pad + (levels === 1 ? treeH / 2 : d * levelH);
            positions.set(i, { x, y });
          }
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        for (let i = 0; i < clampedHeap; i++) {
          const p = positions.get(i);
          if (!p) continue;
          for (const child of [2 * i + 1, 2 * i + 2]) {
            if (child >= clampedHeap) continue;
            const c = positions.get(child);
            if (!c) continue;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(c.x, c.y);
            ctx.stroke();
          }
        }

        for (let i = 0; i < clampedHeap; i++) {
          const cell = cells[i];
          const p = positions.get(i);
          if (!cell || !p) continue;
          drawNode(ctx, cell, p.x, p.y, radius, this.showHueValues, 1);
        }
      }

      if (sortedCount > 0) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = sortedFont;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("Sorted", pad, sortedRowY);

        for (let s = 0; s < sortedCount; s++) {
          const i = clampedHeap + s;
          const cell = cells[i];
          if (!cell) continue;
          const x = sortedDotsStartX + sortedMini + s * (2 * sortedMini + sortedGap);
          drawNode(
            ctx,
            cell,
            x,
            sortedRowY,
            sortedMini,
            this.showHueValues && sortedMini >= 8,
            SORTED_OPACITY
          );
        }
      }
    });
  }

  disconnect() {
    this.view.disconnect();
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Cell} cell
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {boolean} showHue
 * @param {number} alpha
 */
function drawNode(ctx, cell, x, y, radius, showHue, alpha) {
  const active = cell._highlightActive;

  if (active) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ACTIVE_GLOW;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = alpha;
  ctx.fillStyle = cell.color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = active ? ACTIVE_STROKE : "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = active ? 2.5 : 1;
  ctx.stroke();

  if (showHue && radius >= 8) {
    const label = String(Math.round(cell.hue));
    const fontSize = Math.max(8, Math.floor(radius * 1.1));
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(2, fontSize / 5);
    ctx.strokeStyle = "#000";
    ctx.strokeText(label, x, y);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x, y);
  }

  ctx.globalAlpha = 1;
}
