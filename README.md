# Sorting Visualizer

Interactive sorting visualizer: a grid of random colors sorted by **hue**, with step-by-step playback and fair algorithm comparison on the same input.

**Live demo:** _add your GitHub Pages URL after deploying_

## Features

- 7 algorithms: Bubble, Insertion, Selection, Heap, Quick, Merge, Tim Sort
- Adjustable grid size (5×5–40×40)
- Recorded playback with scrubber, pause/resume, and speed presets
- Benchmark mode: same shuffle for every algorithm; step count and record time per run

## Run locally

ES modules require a local server (opening `index.html` directly may not work):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080`.

## Tech

Vanilla HTML, CSS, and JavaScript (no build step). Canvas rendering, generator-based sort steps, pre-recorded playback.

## License

MIT (or adjust as you prefer)
