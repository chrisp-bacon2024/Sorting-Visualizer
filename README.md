# Sorting Visualizer

Interactive sorting visualizer: a grid of random colors sorted by **hue**, with step-by-step playback and fair algorithm comparison on the same input.

**Live demo:** https://chrisp-bacon2024.github.io/Sorting-Visualizer/

## Deploy (GitHub Pages)

If the **Deploy to GitHub Pages** workflow fails with `Get Pages site failed` / `Not Found`:

1. Open **Settings → Pages** on the repo:  
   https://github.com/chrisp-bacon2024/Sorting-Visualizer/settings/pages
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Go to **Actions**, open the failed run, and click **Re-run all jobs**.

The site should publish at the live demo URL above after the workflow succeeds.

## Features

- 7 algorithms: Bubble, Insertion, Selection, Heap, Quick, Merge, Tim Sort
- Adjustable grid size (5×5–40×40)
- Recorded playback with scrubber, pause/resume, and speed presets (including **Tutorial** with step explanations)
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
