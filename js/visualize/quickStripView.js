/** @typedef {import('../model/grid.js').Cell} Cell */
/** @typedef {import('../tutorial/quick.js').QuickStripState} QuickStripState */
import { CanvasView } from "./canvasView.js";

const ACTIVE_STROKE = "#facc15";
const ACTIVE_GLOW = "rgba(250, 204, 21, 0.65)";
const RANGE_START_STROKE = "#22d3ee";
const RANGE_START_GLOW = "rgba(34, 211, 238, 0.55)";
const PIVOT_STROKE = "#a78bfa";
const PIVOT_GLOW = "rgba(167, 139, 250, 0.5)";
const PLACED_STROKE = "#4ade80";
const PLACED_GLOW = "rgba(74, 222, 128, 0.55)";
const ZONE_FILL = "rgba(56, 189, 248, 0.22)";
const RANGE_STROKE = "rgba(255, 255, 255, 0.35)";
const DIM_OPACITY = 0.28;

export class QuickStripView {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.view = new CanvasView(canvas, () => {});
    this.showHueValues = false;
  }

  resize() {
    this.view.fitToContainer();
  }

  /**
   * @param {Cell[]} cells
   * @param {QuickStripState} strip
   */
  render(cells, strip) {
    this.view.render((ctx) => {
      const w = this.view.cssWidth;
      const h = this.view.cssHeight;
      if (w <= 0 || h <= 0) return;

      const n = cells.length;
      const pad = 12;
      const rowY = h / 2;
      const gap = Math.max(2, Math.min(6, n > 0 ? (w - pad * 2) / n - 4 : 4));
      const slotW = n > 0 ? (w - pad * 2 - (n - 1) * gap) / n : 0;
      const radius = Math.min(10, Math.max(3, slotW / 2 - 1));

      const slotCenter = (/** @type {number} */ i) =>
        pad + radius + i * (2 * radius + gap);

      const showComplete = Boolean(strip.complete);
      const showPlacedOnly =
        !showComplete &&
        !strip.active &&
        strip.lastPlacedIndex >= 0 &&
        n > 0;
      const showIdle = !showComplete && !showPlacedOnly;

      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        strip.active
          ? "Active range"
          : showPlacedOnly
            ? "Placed"
            : "Array",
        pad,
        14
      );

      if (n <= 0) return;

      if (showComplete || (showIdle && strip.hi < 0 && !showPlacedOnly)) {
        if (showIdle && strip.hi < 0 && !showComplete) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
          ctx.font = "500 10px system-ui, sans-serif";
          ctx.textBaseline = "top";
          ctx.fillText("Start sort to see range", pad, rowY - 6);
          return;
        }

        for (let i = 0; i < n; i++) {
          const cell = cells[i];
          if (!cell) continue;
          drawNode(
            ctx,
            cell,
            slotCenter(i),
            rowY,
            radius,
            this.showHueValues && radius >= 8,
            1,
            false,
            false,
            false,
            false
          );
        }
        return;
      }

      if (strip.active && strip.hi >= 0) {
        const topLabel = 18;
        const bracketH = 10;
        const activeRowY = topLabel + bracketH + 14;
        const loX = slotCenter(strip.lo) - radius;
        const hiX = slotCenter(strip.hi) + radius;
        const bracketY = topLabel + 2;

        ctx.strokeStyle = RANGE_STROKE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(loX, bracketY + bracketH);
        ctx.lineTo(loX, bracketY);
        ctx.lineTo(hiX, bracketY);
        ctx.lineTo(hiX, bracketY + bracketH);
        ctx.stroke();

        if (strip.storeIndex > strip.lo) {
          const zoneEnd = slotCenter(strip.storeIndex - 1) + radius;
          ctx.fillStyle = ZONE_FILL;
          ctx.fillRect(
            loX,
            activeRowY - radius - 2,
            zoneEnd - loX,
            2 * radius + 4
          );

          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.font = "500 9px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText("≤ pivot", (loX + zoneEnd) / 2, bracketY - 1);
          ctx.textAlign = "left";
        }

        for (let i = 0; i < n; i++) {
          const cell = cells[i];
          if (!cell) continue;
          const inRange = i >= strip.lo && i <= strip.hi;
          const isRangeBottom =
            strip.rangeBottomIndex >= 0 && i === strip.rangeBottomIndex;
          const isScan =
            strip.scanIndex >= 0 && i === strip.scanIndex;
          drawNode(
            ctx,
            cell,
            slotCenter(i),
            activeRowY,
            radius,
            this.showHueValues && radius >= 8,
            inRange ? 1 : DIM_OPACITY,
            i === strip.pivotIndex,
            isScan,
            isRangeBottom,
            false
          );
        }

        ctx.fillStyle = "rgba(167, 139, 250, 0.9)";
        ctx.font = "600 9px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("P", slotCenter(strip.pivotIndex), activeRowY + radius + 8);
        return;
      }

      for (let i = 0; i < n; i++) {
        const cell = cells[i];
        if (!cell) continue;
        const isPlaced = showPlacedOnly && i === strip.lastPlacedIndex;
        drawNode(
          ctx,
          cell,
          slotCenter(i),
          rowY,
          radius,
          this.showHueValues && radius >= 8,
          1,
          false,
          false,
          false,
          isPlaced
        );
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
 * @param {boolean} isPivot
 * @param {boolean} isScan
 * @param {boolean} isRangeStart
 * @param {boolean} isPlaced
 */
function drawNode(
  ctx,
  cell,
  x,
  y,
  radius,
  showHue,
  alpha,
  isPivot,
  isScan,
  isRangeStart,
  isPlaced
) {
  const active = cell._highlightActive || isScan;

  if (isPlaced) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PLACED_GLOW;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (isPivot) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PIVOT_GLOW;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (isRangeStart) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = RANGE_START_GLOW;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (active) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ACTIVE_GLOW;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = alpha;
  ctx.fillStyle = cell.color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isPlaced
    ? PLACED_STROKE
    : isPivot
      ? PIVOT_STROKE
      : isRangeStart
        ? RANGE_START_STROKE
        : active
          ? ACTIVE_STROKE
          : "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = isPlaced || isPivot || isRangeStart ? 2.5 : active ? 2 : 1;
  ctx.stroke();

  if (showHue) {
    const label = String(Math.round(cell.hue));
    const fontSize = Math.max(7, Math.floor(radius * 1.05));
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
