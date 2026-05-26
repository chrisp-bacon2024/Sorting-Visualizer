/** @typedef {import('../model/grid.js').Cell} Cell */
/** @typedef {import('../tutorial/timsort.js').TimPanelState} TimPanelState */
/** @typedef {import('../tutorial/merge.js').MergePanelState} MergePanelState */
import { CanvasView } from "./canvasView.js";

const ACTIVE_STROKE = "#facc15";
const ACTIVE_GLOW = "rgba(250, 204, 21, 0.65)";
const PLACED_STROKE = "#4ade80";
const PLACED_GLOW = "rgba(74, 222, 128, 0.55)";

/** @typedef {{ label: string, cells: Cell[], y: number }} RowSpec */

export class TimPanelView {
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
   * @param {TimPanelState} panel
   */
  render(cells, panel) {
    this.view.render((ctx) => {
      const w = this.view.cssWidth;
      const h = this.view.cssHeight;
      if (w <= 0 || h <= 0) return;

      const pad = 12;
      const labelW = 44;

      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("Tim sort", pad, 8);

      if (!panel.active) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "500 10px system-ui, sans-serif";
        ctx.fillText("Start sort to see runs", pad, pad + 20);
        return;
      }

      if (panel.mode === "merge" && panel.merge) {
        drawMergeRows(ctx, cells, panel.merge, w, h, pad, labelW, this.showHueValues);
        return;
      }

      const rowH = Math.max(28, h - pad * 2 - 24);
      const label =
        panel.mode === "insert" ? "Growing" : "Run";
      drawSingleRow(
        ctx,
        cells,
        { label, cells: panel.runCells, y: pad + 18 },
        w,
        pad,
        labelW,
        rowH,
        this.showHueValues,
        -1,
        -1,
        -1
      );
    });
  }

  disconnect() {
    this.view.disconnect();
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Cell[]} cells
 * @param {MergePanelState} panel
 * @param {number} w
 * @param {number} h
 * @param {number} pad
 * @param {number} labelW
 * @param {boolean} showHueValues
 */
function drawMergeRows(ctx, cells, panel, w, h, pad, labelW, showHueValues) {
  const rowH = Math.max(28, (h - pad * 2 - 16) / 3);
  /** @type {RowSpec[]} */
  const rows = [
    { label: "Left", cells: panel.leftRun, y: pad + 18 },
    { label: "Right", cells: panel.rightRun, y: pad + 18 + rowH },
    { label: "Out", cells: panel.mergedRun, y: pad + 18 + rowH * 2 },
  ];

  const maxDots = Math.max(
    1,
    ...rows.map((r) => r.cells.length),
    panel.writeIndex >= 0 ? panel.mergedRun.length + 1 : 0
  );
  const avail = w - pad - labelW - pad;
  const gap = Math.max(2, Math.min(6, avail / maxDots - 4));
  const radius = Math.min(9, Math.max(3, (avail - (maxDots - 1) * gap) / (2 * maxDots)));

  for (const row of rows) {
    drawSingleRow(
      ctx,
      cells,
      row,
      w,
      pad,
      labelW,
      rowH,
      showHueValues,
      radius,
      gap,
      panel.compareLeftId,
      panel.compareRightId,
      panel.writeIndex
    );
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Cell[]} cells
 * @param {RowSpec} row
 * @param {number} w
 * @param {number} pad
 * @param {number} labelW
 * @param {number} rowH
 * @param {boolean} showHue
 * @param {number} radius
 * @param {number} gap
 * @param {number} compareLeftId
 * @param {number} compareRightId
 * @param {number} writeIndex
 */
function drawSingleRow(
  ctx,
  cells,
  row,
  w,
  pad,
  labelW,
  rowH,
  showHue,
  radius,
  gap,
  compareLeftId,
  compareRightId,
  writeIndex
) {
  const maxDots = Math.max(1, row.cells.length);
  const avail = w - pad - labelW - pad;
  const useGap =
    gap >= 0 ? gap : Math.max(2, Math.min(6, avail / maxDots - 4));
  const useRadius =
    radius >= 0
      ? radius
      : Math.min(9, Math.max(3, (avail - (maxDots - 1) * useGap) / (2 * maxDots)));

  const slotX = (/** @type {number} */ slot) =>
    pad + labelW + useRadius + slot * (2 * useRadius + useGap);

  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "500 9px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(row.label, pad, row.y + useRadius);

  for (let s = 0; s < row.cells.length; s++) {
    const cell = row.cells[s];
    if (!cell) continue;
    const isCompare =
      cell.id === compareLeftId || cell.id === compareRightId;
    const writeCell =
      writeIndex >= 0 && compareLeftId < 0 ? cells[writeIndex] : null;
    const isWritten =
      row.label === "Out" &&
      writeCell != null &&
      cell.id === writeCell.id;

    drawNode(
      ctx,
      cell,
      slotX(s),
      row.y + useRadius,
      useRadius,
      showHue && useRadius >= 8,
      1,
      isCompare,
      isWritten
    );
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
 * @param {boolean} isCompare
 * @param {boolean} isWritten
 */
function drawNode(
  ctx,
  cell,
  x,
  y,
  radius,
  showHue,
  alpha,
  isCompare,
  isWritten
) {
  if (isWritten) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PLACED_GLOW;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } else if (isCompare) {
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

  ctx.strokeStyle = isWritten
    ? PLACED_STROKE
    : isCompare
      ? ACTIVE_STROKE
      : "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = isWritten || isCompare ? 2.5 : 1;
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
