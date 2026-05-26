# Sorting Visualizer

An interactive, browser-based sorting visualizer that sorts a grid of random colors by **hue**. Each algorithm runs on the same shuffled input so you can compare behavior, step counts, and recording time fairly.

**[Live demo →](https://chrisp-bacon2024.github.io/Sorting-Visualizer/)**

---

## Demos

### Tutorial mode — Heap Sort

5×5 grid, **Tutorial** speed, **Heap Sort** — step-by-step tips and the live heap tree panel.

<img src="docs/assets/heap-sort-tutorial.gif" width="800" alt="Heap Sort in Tutorial mode with heap tree panel and step tips" />

### Large grid — Quick Sort

**100×100** grid, **Very fast** speed, **Quick Sort** — full-grid partition visualization at scale.

<img src="docs/assets/quick-sort-100x100.gif" width="800" alt="Quick Sort on a 100×100 color grid" />

---

## At a glance

| | |
|---|---|
| **Stack** | Vanilla HTML, CSS, and JavaScript (ES modules) — no framework, no build step |
| **Rendering** | Canvas 2D with a dirty-flag animation loop |
| **Algorithms** | Bubble, Insertion, Selection, Heap, Quick, Merge, Tim Sort |
| **Grid** | 5×5 up to **100×100** (10,000 cells) |
| **Playback** | Pre-recorded steps, scrubber, speed presets, benchmark stats on the same shuffle |

---

## Features

### Visualization & playback

- **Hue-based sorting** — cells are colored by hue; the goal is a smooth rainbow left-to-right.
- **Recorded playback** — each run is captured once, then replayed with pause, resume, and a step scrubber (incremental seek + checkpoints for long recordings).
- **Speed presets** — Tutorial, Very slow → Very fast; playback time is budgeted so long runs still finish in a reasonable wall-clock time.
- **Optional cell values** — show numeric hue labels (hidden automatically on large grids for clarity).

### Tutorial mode

- **5×5 grid** with guided tips at key moments (compare, swap, partition, merge, etc.).
- **Algorithm-specific panels** in Tutorial speed:
  - **Heap Sort** — binary heap tree
  - **Quick Sort** — pivot / partition strip
  - **Merge Sort** — left / right / out merge rows
  - **Tim Sort** — run growth and merge phases

### Benchmarking

- **Shuffle once, compare all** — switching algorithms reuses the same color arrangement until you shuffle again.
- **Per-algorithm stats** — animated step count and record time (shown as ms, or seconds with two decimals when over 999 ms).

### Large grids (> 40×40)

- Bubble, Insertion, and Selection are hidden (impractical at scale).
- Values checkbox hidden; speed defaults to **Very fast**.

---

## Algorithms

| Algorithm | Notes |
|-----------|--------|
| Bubble Sort | Neighbor compares; larger hues bubble right each pass |
| Insertion Sort | Grows a sorted prefix from the left |
| Selection Sort | Repeated minimum selection into place |
| Heap Sort | Max-heap; extract-max to the tail each round |
| Quick Sort | Lomuto-style partitioning around a pivot |
| Merge Sort | Divide, sort sub-runs, merge |
| Tim Sort | Natural runs, min-run extension, multi-way merge |

All sorts are implemented as **generators** that yield compare/swap (and algorithm-specific metadata) steps, keeping the visualization logic separate from the algorithms themselves.

---

## How it works (technical)

1. **Recording** — On Start, the chosen algorithm runs once; every step is stored and the grid is restored to the pre-sort state.
2. **Playback** — `SortPlayer` walks the step list with configurable delay and stride; the canvas redraws only when the grid changes.
3. **Scrubbing** — Forward seeks apply only new steps from the last frame; backward seeks use periodic snapshots for long recordings.
4. **Tutorial** — A coach layer interprets steps, pauses at teaching moments, and drives side panels from step metadata (`heap`, `quick`, `merge`, `tim`).

---

## Run locally

ES modules need a local server (opening `index.html` via `file://` may fail):

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`.

---

## Project structure

```
├── index.html          # App shell & controls
├── css/                # Layout, components, design tokens
├── js/
│   ├── app.js          # UI wiring, playback, tutorial orchestration
│   ├── algorithms/     # Sort implementations (generators)
│   ├── sort/           # Recording, seek, checkpoints
│   ├── visualize/      # Canvas, side panels, player
│   └── tutorial/       # Per-algorithm coaching & panels
└── docs/assets/        # README demo GIFs
```

---

## Deploy (GitHub Pages)

Published via GitHub Actions to the [live demo](https://chrisp-bacon2024.github.io/Sorting-Visualizer/).

If deployment fails with `Get Pages site failed` / `Not Found`:

1. Open **Settings → Pages** on the repo.
2. Set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Re-run the failed workflow from the **Actions** tab.

---

## License

[MIT](LICENSE)
