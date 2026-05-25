/**
 * @typedef {{ id: number, hue: number, color: string, x: number, y: number, width: number, height: number }} CellState
 */

const GAP = 1;

/** Active compare/swap highlight (both cells use the same style). */
const ACTIVE_HIGHLIGHT = {
  stroke: "#facc15",
  width: 5,
  glow: "rgba(250, 204, 21, 0.65)",
  glowWidth: 10,
};

const randomHueColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return { hue, color: `hsl(${hue}, 90%, 55%)` };
};

export class Grid {
  /**
   * @param {number} cols Cells per row (square grid: cols × cols)
   * @param {number} width Canvas width in CSS pixels
   * @param {number} height Canvas height in CSS pixels
   */
  constructor(cols, width, height) {
    this.cols = cols;
    this.rows = cols;
    this.gridWidth = width;
    this.gridHeight = height;
    this.cellWidth = 0;
    this.cellHeight = 0;
    /** @type {Cell[]} */
    this.cells = [];
    /** @type {boolean} */
    this.showHueValues = false;
    this.generateCells();
    this.layout();
  }

  get cellCount() {
    return this.cols * this.rows;
  }

  generateCells() {
    this.cells = [];
    for (let i = 0; i < this.cellCount; i++) {
      this.cells.push(new Cell(i));
    }
  }

  /** Place every cell at the slot matching its array index. */
  layout() {
    this.cellWidth = this.gridWidth / this.cols;
    this.cellHeight = this.gridHeight / this.rows;

    this.cells.forEach((cell, index) => {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const x = col * this.cellWidth + GAP / 2;
      const y = row * this.cellHeight + GAP / 2;
      const w =
        col === this.cols - 1
          ? this.gridWidth - x - GAP / 2
          : this.cellWidth - GAP;
      const h =
        row === this.rows - 1
          ? this.gridHeight - y - GAP / 2
          : this.cellHeight - GAP;
      cell.reposition(x, y);
      cell.resize(Math.max(0, w), Math.max(0, h));
    });
  }

  /**
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.layout();
  }

  /**
   * @param {number} cols
   */
  setCols(cols) {
    this.cols = cols;
    this.rows = cols;
    this.generateCells();
    this.layout();
  }

  /**
   * @returns {{ hue: number, color: string }[]}
   */
  captureState() {
    return this.cells.map((cell) => ({
      hue: cell.hue,
      color: cell.color,
    }));
  }

  /**
   * @param {{ hue: number, color: string }[]} state
   */
  restoreState(state) {
    state.forEach((data, index) => {
      const cell = this.cells[index];
      if (!cell) return;
      cell.hue = data.hue;
      cell.color = data.color;
    });
    this.clearHighlights();
  }

  /** Fisher–Yates shuffle of cell data (same slots, new random hues). */
  shuffle() {
    for (let i = this.cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      this.cells[i].swapDataWith(this.cells[j]);
    }
  }

  /**
   * Swap array entries for sorting. Positions stay tied to indices via layout().
   * @param {number} i
   * @param {number} j
   */
  swapCells(i, j) {
    if (i === j || i < 0 || j < 0 || i >= this.cells.length || j >= this.cells.length) {
      return;
    }
    const temp = this.cells[i];
    this.cells[i] = this.cells[j];
    this.cells[j] = temp;
    this.cells[i].index = i;
    this.cells[j].index = j;
    this.layout();
  }

  /**
   * @param {number} i
   * @param {number} j
   */
  compareCells(i, j) {
    this.highlightCell(i, "active");
    this.highlightCell(j, "active");
  }

  clearHighlights() {
    this.cells.forEach((cell) => cell.unhighlight());
  }

  /**
   * @param {number} index
   * @param {"active" | "default"} [role]
   */
  highlightCell(index, role = "default") {
    this.cells[index]?.highlight(role);
  }

  /**
   * @param {number} index
   */
  unhighlightCell(index) {
    this.cells[index]?.unhighlight();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    for (const cell of this.cells) {
      cell.draw(ctx, this.showHueValues);
    }
  }
}

export class Cell {
  /**
   * @param {number} index Slot index in the grid array
   */
  constructor(index) {
    this.index = index;
    this.id = index;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;

    const { hue, color } = randomHueColor();
    this.hue = hue;
    this.color = color;

    this.defaultOutlineColor = "rgba(0, 0, 0, 0.35)";
    this.outlineColor = this.defaultOutlineColor;
    this.outlineWidth = 1;
    this._highlighted = false;
    this._highlightActive = false;
  }

  /**
   * @param {Cell} other
   */
  swapDataWith(other) {
    const tempHue = this.hue;
    const tempColor = this.color;
    this.hue = other.hue;
    this.color = other.color;
    other.hue = tempHue;
    other.color = tempColor;
  }

  /**
   * @param {number} newX
   * @param {number} newY
   */
  reposition(newX, newY) {
    this.x = newX;
    this.y = newY;
  }

  /**
   * @param {number} newWidth
   * @param {number} newHeight
   */
  resize(newWidth, newHeight) {
    this.width = newWidth;
    this.height = newHeight;
  }

  /**
   * @param {"active" | "default"} [role]
   */
  highlight(role = "default") {
    this._highlighted = true;
    this._highlightActive = role === "active";
    if (this._highlightActive) {
      this.outlineColor = ACTIVE_HIGHLIGHT.stroke;
      this.outlineWidth = ACTIVE_HIGHLIGHT.width;
    } else {
      this.outlineColor = "#f5c542";
      this.outlineWidth = 2;
    }
  }

  unhighlight() {
    this._highlighted = false;
    this._highlightActive = false;
    this.outlineColor = this.defaultOutlineColor;
    this.outlineWidth = 1;
  }

  /** @returns {number} */
  sortKey() {
    return this.hue;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {boolean} [showHue]
   */
  draw(ctx, showHue = false) {
    const inset = (gutter) => gutter / 2;

    if (this._highlightActive) {
      const g = ACTIVE_HIGHLIGHT.glowWidth;
      ctx.strokeStyle = ACTIVE_HIGHLIGHT.glow;
      ctx.lineWidth = g;
      ctx.strokeRect(
        this.x + inset(g),
        this.y + inset(g),
        this.width - g,
        this.height - g
      );
    }

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = this.outlineWidth;
    const w = this.outlineWidth;
    ctx.strokeRect(
      this.x + inset(w),
      this.y + inset(w),
      this.width - w,
      this.height - w
    );

    if (showHue && this.width >= 14 && this.height >= 14) {
      const label = String(Math.round(this.hue));
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const size = Math.max(8, Math.floor(Math.min(this.width, this.height) * 0.28));
      ctx.save();
      ctx.font = `600 ${size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(2, size * 0.2);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.strokeText(label, cx, cy);
      ctx.fillText(label, cx, cy);
      ctx.restore();
    }
  }
}
