import {
  CONFIG,
  SPEED_PRESETS,
  getPlaybackSettings as computePlaybackSettings,
} from "./config.js";
import { Grid } from "./model/grid.js";
import { ALGORITHMS, getAlgorithm } from "./algorithms/registry.js";
import { CanvasView } from "./visualize/canvasView.js";
import { HeapTreeView } from "./visualize/heapTreeView.js";
import { QuickStripView } from "./visualize/quickStripView.js";
import { Animator } from "./visualize/animator.js";
import { SortPlayer, playbackDelay } from "./visualize/sortPlayer.js";
import {
  recordSort,
  seekToStep,
  seekForward,
  restoreGridState,
  mutateStep,
} from "./sort/sortSession.js";
import {
  animatedStepCount,
  formatAlgoOptionLabel,
  formatPlaybackLabel,
  toDisplayPlaybackIndex,
  toInternalPlaybackIndex,
} from "./benchmark.js";
import {
  createTutorialContext,
  setContextCols,
} from "./tutorial/context.js";
import {
  getTutorialOutro,
  getTutorialStepMessage,
  getTutorialBeforeStepMessage,
} from "./tutorial/coach.js";
import { getHeapSize } from "./tutorial/heap.js";
import { getQuickStripState, trackQuickStep } from "./tutorial/quick.js";
import { TutorialPanel } from "./tutorial/tutorialPanel.js";
import { STEP } from "./algorithms/types.js";

const STATE = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
};

/** @param {import('./model/grid.js').Cell} a @param {import('./model/grid.js').Cell} b */
function compareByHue(a, b) {
  return a.sortKey() - b.sortKey();
}

export function createApp() {
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.querySelector("#canvas")
  );
  const heapTreePanel = /** @type {HTMLElement} */ (
    document.querySelector("#heap-tree-panel")
  );
  const heapTreeCanvas = /** @type {HTMLCanvasElement} */ (
    document.querySelector("#heap-tree-canvas")
  );
  const quickStripPanel = /** @type {HTMLElement} */ (
    document.querySelector("#quick-strip-panel")
  );
  const quickStripCanvas = /** @type {HTMLCanvasElement} */ (
    document.querySelector("#quick-strip-canvas")
  );
  const colsInput = /** @type {HTMLInputElement} */ (
    document.querySelector("#grid-cols")
  );
  const colsValue = /** @type {HTMLOutputElement} */ (
    document.querySelector("#grid-cols-value")
  );
  const playbackInput = /** @type {HTMLInputElement} */ (
    document.querySelector("#playback")
  );
  const playbackValue = /** @type {HTMLOutputElement} */ (
    document.querySelector("#playback-value")
  );
  const speedSelect = /** @type {HTMLSelectElement} */ (
    document.querySelector("#speed-preset")
  );
  const shuffleBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#shuffle")
  );
  const playToggleBtn = /** @type {HTMLButtonElement} */ (
    document.querySelector("#play-toggle")
  );
  const algorithmSelect = /** @type {HTMLSelectElement} */ (
    document.querySelector("#algorithm")
  );
  const algorithmTrigger = /** @type {HTMLButtonElement} */ (
    document.querySelector("#algorithm-trigger")
  );
  const algorithmList = /** @type {HTMLUListElement} */ (
    document.querySelector("#algorithm-list")
  );
  const algorithmMeasureEl = /** @type {HTMLElement} */ (
    document.querySelector("#algorithm-measure")
  );
  const algorithmDescriptionEl = /** @type {HTMLElement} */ (
    document.querySelector("#algorithm-description")
  );
  const showHueInput = /** @type {HTMLInputElement} */ (
    document.querySelector("#show-hue")
  );
  const statusEl = /** @type {HTMLElement} */ (document.querySelector("#status"));

  /** @type {Grid | null} */
  let grid = null;
  /** @type {string} */
  let appState = STATE.IDLE;
  /** @type {import('./sort/sortSession.js').SortRecording | null} */
  let recording = null;
  /** @type {number} */
  let playbackIndex = 0;
  /** @type {boolean} */
  let sortComplete = false;
  /** @type {boolean} */
  let isScrubbing = false;
  /** @type {boolean} */
  let skipAbortedStatus = false;
  /** @type {number} */
  let lastRenderedIndex = 0;
  /** @type {{ hue: number, color: string }[] | null} */
  let benchmarkSnapshot = null;
  /** @type {Map<string, import('./benchmark.js').AlgoBenchmarkResult>} */
  const algoResults = new Map();

  const animator = new Animator();
  const sortPlayer = new SortPlayer();
  const tutorialPanel = new TutorialPanel();
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /** @type {import('./tutorial/context.js').TutorialContext | null} */
  let tutorialContext = null;
  /** @type {number | null} Grid size to restore after leaving Tutorial speed */
  let colsBeforeTutorial = null;
  /** @type {number | null} Step index to resume after speed/algorithm change */
  let pendingPlaybackRestart = null;
  /** @type {number} Bumped to ignore stale playRecording completions */
  let playbackSession = 0;

  function isTutorialMode() {
    const preset =
      SPEED_PRESETS[Number(speedSelect.value)] ?? SPEED_PRESETS[0];
    return Boolean(preset.tutorial);
  }

  function shouldShowHeapTree() {
    return isTutorialMode() && algorithmSelect.value === "heap";
  }

  function shouldShowQuickStrip() {
    return isTutorialMode() && algorithmSelect.value === "quick";
  }

  /** Range anchor, pivot, scan, and placed highlights on the main grid. */
  function syncQuickTutorialGridHighlights() {
    if (!grid || !shouldShowQuickStrip() || !tutorialContext || sortComplete) {
      return;
    }
    const strip = getQuickStripState(
      tutorialContext,
      grid.cellCount,
      false
    );

    if (strip.active) {
      if (
        strip.rangeBottomIndex >= 0 &&
        strip.rangeBottomIndex !== strip.pivotIndex
      ) {
        grid.highlightCell(strip.rangeBottomIndex, "rangeStart");
      }
      if (strip.pivotIndex >= 0) {
        grid.highlightCell(strip.pivotIndex, "pivot");
      }
      return;
    }

    if (strip.lastPlacedIndex >= 0) {
      grid.clearHighlights();
      grid.highlightCell(strip.lastPlacedIndex, "placed");
    }
  }

  function syncTutorialSidePanels() {
    const showHeap = shouldShowHeapTree();
    const showQuick = shouldShowQuickStrip();

    if (heapTreePanel) {
      heapTreePanel.hidden = !showHeap;
      if (showHeap && heapTreeView) {
        heapTreeView.resize();
      }
    }

    if (quickStripPanel) {
      quickStripPanel.hidden = !showQuick;
      if (showQuick && quickStripView) {
        quickStripView.resize();
      }
    }

    if (showHeap || showQuick) {
      animator.requestFrame();
    }
  }

  /**
   * @returns {number}
   */
  function getActiveHeapSize() {
    if (!grid) return 0;
    if (sortComplete) return 0;
    if (recording) {
      if (playbackIndex >= recording.steps.length) return 0;
      const step = recording.steps[playbackIndex];
      if (step?.type === STEP.DONE) return 0;
      if (
        playbackIndex > 0 &&
        recording.steps[playbackIndex - 1]?.type === STEP.DONE
      ) {
        return 0;
      }
    }
    if (tutorialContext) {
      return getHeapSize(tutorialContext, grid.cellCount);
    }
    return grid.cellCount;
  }

  function warmTutorialContextThrough(internalIndex) {
    if (!tutorialContext || !recording || !grid) return;
    const algoId = algorithmSelect.value;

    restoreGridState(grid, recording.snapshot);
    for (let i = 0; i < internalIndex; i++) {
      const step = recording.steps[i];
      getTutorialBeforeStepMessage(algoId, step, tutorialContext, grid.cells);
      mutateStep(grid, step);
      getTutorialStepMessage(algoId, step, tutorialContext, grid.cells);
    }
    playbackIndex = seekToStep(grid, recording, internalIndex);
    lastRenderedIndex = playbackIndex;
    updatePlaybackSlider();
    if (heapTreeView && shouldShowHeapTree()) {
      heapTreeView.resize();
    }
    if (quickStripView && shouldShowQuickStrip()) {
      quickStripView.resize();
    }
    animator.requestFrame();
  }

  /**
   * @param {import('./tutorial/helpers.js').TutorialMessage} message
   * @param {number} index
   * @param {AbortSignal} signal
   */
  async function presentTutorialMessage(message, index, signal) {
    if (!recording) return;

    const display = toDisplayPlaybackIndex(recording, index);
    const total = animatedStepCount(recording);

    tutorialPanel.show({
      ...message,
      stepLabel: `${display} / ${total}`,
    });

    if (message.title === "Done" && grid) {
      grid.clearHighlights();
      animator.requestFrame();
    } else if (message.focusIndex != null && grid) {
      grid.clearHighlights();
      const strip =
        shouldShowQuickStrip() && tutorialContext
          ? getQuickStripState(tutorialContext, grid.cellCount, false)
          : null;

      if (message.title === "Placed") {
        grid.highlightCell(message.focusIndex, "placed");
      } else if (strip?.active) {
        if (message.focusIndex === strip.pivotIndex) {
          grid.highlightCell(message.focusIndex, "pivot");
        } else {
          grid.highlightCell(message.focusIndex, "active");
        }
        if (
          strip.rangeBottomIndex >= 0 &&
          strip.rangeBottomIndex !== strip.pivotIndex &&
          strip.rangeBottomIndex !== message.focusIndex
        ) {
          grid.highlightCell(strip.rangeBottomIndex, "rangeStart");
        }
      } else {
        grid.highlightCell(message.focusIndex, "active");
      }
      animator.requestFrame();
    }

    if (message.pause === false) {
      if (appState === STATE.RUNNING) {
        setControlsPlayback(true);
      }
      if (!reducedMotion) {
        await playbackDelay(CONFIG.tutorialStepMs, signal);
      }
      animator.requestFrame();
      return;
    }

    if (appState === STATE.RUNNING) {
      setTutorialContinueButton();
    }
    await tutorialPanel.waitForContinue();
    if (appState === STATE.RUNNING) {
      setControlsPlayback(true);
    }
  }

  function showTutorialTipAt(internalIndex) {
    if (!isTutorialMode() || !recording || !grid) return;

    tutorialContext = createTutorialContext();
    setContextCols(tutorialContext, grid.cols);
    warmTutorialContextThrough(internalIndex);

    const algoId = algorithmSelect.value;
    const total = animatedStepCount(recording);
    const display = toDisplayPlaybackIndex(recording, internalIndex);

    if (internalIndex >= recording.steps.length) {
      grid?.clearHighlights();
      animator.requestFrame();
      tutorialPanel.show({
        ...getTutorialOutro(algoId),
        stepLabel: `${total} / ${total}`,
      });
      return;
    }

    if (internalIndex === 0) {
      tutorialPanel.hide();
      return;
    }

    const step = recording.steps[internalIndex - 1];
    const message =
      step.type === STEP.DONE
        ? getTutorialOutro(algoId)
        : getTutorialStepMessage(algoId, step, tutorialContext, grid.cells);

    if (!message) {
      tutorialPanel.hide();
      return;
    }

    if (step.type === STEP.DONE) {
      grid?.clearHighlights();
      animator.requestFrame();
    }

    tutorialPanel.show({
      ...message,
      stepLabel: `${display} / ${total}`,
    });
  }

  function interruptTutorialPlayback() {
    if (!isTutorialMode() || appState !== STATE.RUNNING) return;
    tutorialPanel.cancelWait();
    sortPlayer.pause();
  }

  /**
   * Stop the current run and start again at `resumeIndex` (e.g. after speed change).
   * @param {number} resumeIndex
   */
  async function requestPlaybackResync(resumeIndex) {
    pendingPlaybackRestart = null;
    tutorialPanel.cancelWait();
    tutorialPanel.hide();
    tutorialContext = null;
    sortPlayer.abort();
    skipAbortedStatus = true;
    appState = STATE.RUNNING;
    setControlsPlayback(true);
    statusEl.textContent = isTutorialMode()
      ? "Tutorial — Space at key steps; neighbors play automatically"
      : "Sorting…";

    if (recording && grid) {
      playbackIndex = Math.max(
        0,
        Math.min(resumeIndex, recording.steps.length)
      );
      seek(playbackIndex);
      lastRenderedIndex = playbackIndex;
      updatePlaybackSlider();
    }

    await runPlayback(playbackIndex);
  }

  /**
   * @param {number} displayIndex
   */
  function applyTutorialScrub(displayIndex) {
    if (!recording || !grid || !isTutorialMode()) return;

    const total = animatedStepCount(recording);
    const clamped = Math.max(0, Math.min(displayIndex, total));
    const wasRunning = appState === STATE.RUNNING;

    interruptTutorialPlayback();

    playbackIndex = toInternalPlaybackIndex(recording, clamped);
    seek(playbackIndex);
    lastRenderedIndex = playbackIndex;
    playbackInput.value = String(clamped);
    const recordMs = algoResults.get(algorithmSelect.value)?.recordMs;
    playbackValue.textContent = formatPlaybackLabel(
      clamped,
      total,
      recordMs
    );
    showTutorialTipAt(playbackIndex);

    if (wasRunning) {
      appState = STATE.PAUSED;
      setControlsPlayback(true, true);
      statusEl.textContent = `Tutorial — step ${clamped} / ${total} (Resume or scrub)`;
    }
  }

  /**
   * @param {{ deferGridRestore?: boolean }} [options]
   * When true, leaving Tutorial does not resize the grid (e.g. mid-playback speed change).
   */
  function syncTutorialChrome({ deferGridRestore = false } = {}) {
    const tutorial = isTutorialMode();
    tutorialPanel.setEnabled(tutorial);
    colsInput.disabled = tutorial;
    syncTutorialSidePanels();

    if (tutorial) {
      const current = Number(colsInput.value);
      if (current !== CONFIG.tutorialCols) {
        if (colsBeforeTutorial === null) {
          colsBeforeTutorial = current;
        }
        colsInput.value = String(CONFIG.tutorialCols);
        applyGridSize();
      }
    } else {
      tutorialPanel.cancelWait();
      tutorialContext = null;
      if (colsBeforeTutorial !== null && !deferGridRestore) {
        colsInput.value = String(colsBeforeTutorial);
        colsBeforeTutorial = null;
        applyGridSize();
      }
    }
  }

  const view = new CanvasView(canvas, (width, height) => {
    if (!grid) {
      grid = new Grid(CONFIG.cols, width, height);
      benchmarkSnapshot = grid.captureState();
      invalidateRecording();
      refreshAlgorithmOptions();
    } else if (appState === STATE.IDLE) {
      grid.resize(width, height);
    }
    animator.requestFrame();
  });

  const heapTreeView = heapTreeCanvas ? new HeapTreeView(heapTreeCanvas) : null;
  const quickStripView = quickStripCanvas
    ? new QuickStripView(quickStripCanvas)
    : null;

  function syncShowHueValues() {
    if (grid) {
      grid.showHueValues = showHueInput.checked;
    }
    if (heapTreeView) {
      heapTreeView.showHueValues = showHueInput.checked;
    }
    if (quickStripView) {
      quickStripView.showHueValues = showHueInput.checked;
    }
  }

  function render() {
    if (!grid) return;
    view.render((ctx) => grid.draw(ctx));
    if (heapTreeView && shouldShowHeapTree()) {
      heapTreeView.render(grid.cells, getActiveHeapSize());
    }
    if (quickStripView && shouldShowQuickStrip()) {
      quickStripView.render(
        grid.cells,
        getQuickStripState(tutorialContext, grid.cellCount, sortComplete)
      );
    }
  }

  animator.start(render);

  function invalidateRecording() {
    recording = null;
    playbackIndex = 0;
    lastRenderedIndex = 0;
    sortComplete = false;
    updatePlaybackSlider();
  }

  function clearBenchmarkResults() {
    algoResults.clear();
    invalidateRecording();
    refreshAlgorithmOptions();
  }

  function resetBenchmarkInput() {
    if (!grid) return;
    benchmarkSnapshot = grid.captureState();
    clearBenchmarkResults();
  }

  function restoreBenchmark() {
    if (grid && benchmarkSnapshot) {
      grid.restoreState(benchmarkSnapshot);
    }
  }

  function measureAlgorithmLabelWidth(text) {
    const style = getComputedStyle(algorithmTrigger);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let textWidth = 0;
    if (ctx) {
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      textWidth = Math.ceil(ctx.measureText(text).width);
    } else {
      algorithmMeasureEl.textContent = text;
      textWidth = algorithmMeasureEl.offsetWidth;
    }
    const padX =
      parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const borderX =
      parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    return textWidth + padX + borderX + 4;
  }

  function getAlgorithmPickerWidth() {
    let max = 0;
    for (const algo of ALGORITHMS) {
      max = Math.max(max, measureAlgorithmLabelWidth(algo.label));
    }
    return max;
  }

  function updateAlgorithmSelectWidth() {
    const picker = algorithmTrigger.closest(".algo-picker");
    const px = getAlgorithmPickerWidth();
    if (picker instanceof HTMLElement) {
      picker.style.width = `${px}px`;
      picker.style.minWidth = `${px}px`;
    }
  }

  function updateAlgorithmTriggerLabel() {
    const algo = getAlgorithm(algorithmSelect.value);
    algorithmTrigger.textContent = algo?.label ?? "";
  }

  function updateAlgorithmDescription() {
    const algo = getAlgorithm(algorithmSelect.value);
    algorithmDescriptionEl.textContent = algo?.description ?? "";
  }

  function setAlgorithmMenuOpen(open) {
    algorithmList.hidden = !open;
    algorithmTrigger.setAttribute("aria-expanded", String(open));
  }

  function refreshAlgorithmOptions() {
    const selected = algorithmSelect.value || ALGORITHMS[0]?.id;
    algorithmSelect.innerHTML = "";
    algorithmList.innerHTML = "";

    for (const algo of ALGORITHMS) {
      const label = formatAlgoOptionLabel(
        algo.label,
        algoResults.get(algo.id)
      );

      const option = document.createElement("option");
      option.value = algo.id;
      option.textContent = label;
      algorithmSelect.appendChild(option);

      const item = document.createElement("li");
      item.className = "algo-picker__option";
      item.setAttribute("role", "option");
      item.dataset.value = algo.id;
      item.textContent = label;
      item.setAttribute("aria-selected", String(algo.id === selected));
      item.addEventListener("click", () => {
        selectAlgorithm(algo.id);
      });
      algorithmList.appendChild(item);
    }

    algorithmSelect.value = selected;
    updateAlgorithmTriggerLabel();
    updateAlgorithmDescription();
    updateAlgorithmSelectWidth();
  }

  function applyAlgorithmSelection(algoId) {
    algorithmSelect.value = algoId;
    updateAlgorithmTriggerLabel();
    updateAlgorithmDescription();
    updateAlgorithmSelectWidth();
    syncTutorialSidePanels();
    setAlgorithmMenuOpen(false);

    for (const item of algorithmList.querySelectorAll("[role=option]")) {
      item.setAttribute(
        "aria-selected",
        String(item.dataset.value === algoId)
      );
    }
  }

  /**
   * @param {string} algoId
   */
  async function switchAlgorithmDuringPlayback(algoId) {
    const wasRunning = appState === STATE.RUNNING;
    applyAlgorithmSelection(algoId);

    pendingPlaybackRestart = null;
    tutorialPanel.cancelWait();
    tutorialPanel.hide();
    tutorialContext = null;
    sortPlayer.pause();

    if (!ensureRecording()) return;

    restoreBenchmark();
    playbackIndex = 0;
    lastRenderedIndex = 0;
    sortComplete = false;
    seek(0);
    updatePlaybackSlider();

    if (wasRunning) {
      void requestPlaybackResync(0);
      return;
    }

    appState = STATE.PAUSED;
    setControlsPlayback(true, true);
    const algo = getAlgorithm(algoId);
    statusEl.textContent = `Paused — ${algo?.label ?? algoId}, press Resume`;
  }

  /**
   * @param {string} algoId
   */
  function selectAlgorithm(algoId) {
    if (algorithmSelect.value === algoId) {
      setAlgorithmMenuOpen(false);
      return;
    }

    if (appState === STATE.RUNNING || appState === STATE.PAUSED) {
      void switchAlgorithmDuringPlayback(algoId);
      return;
    }

    applyAlgorithmSelection(algoId);
    invalidateRecording();
  }

  function loadRecordingForAlgorithm(algoId) {
    const cached = algoResults.get(algoId);
    recording = cached?.recording ?? null;
    playbackIndex = 0;
    lastRenderedIndex = 0;
    sortComplete = false;
    updatePlaybackSlider();
  }

  function populateSpeedPresets() {
    speedSelect.innerHTML = "";
    SPEED_PRESETS.forEach((preset, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = preset.label;
      speedSelect.appendChild(option);
    });
    speedSelect.value = String(CONFIG.defaultSpeedPreset);
  }

  function getPlaybackSettings() {
    const preset =
      SPEED_PRESETS[Number(speedSelect.value)] ??
      SPEED_PRESETS[CONFIG.defaultSpeedPreset];
    const count = recording ? animatedStepCount(recording) : 500;
    return computePlaybackSettings(preset, count);
  }

  function updatePlaybackSlider() {
    if (!recording) {
      playbackInput.max = "0";
      playbackInput.value = "0";
      playbackInput.disabled = true;
      playbackValue.textContent = formatPlaybackLabel(0, 0, undefined);
      return;
    }

    const max = animatedStepCount(recording);
    const displayIndex = toDisplayPlaybackIndex(recording, playbackIndex);
    const recordMs = algoResults.get(algorithmSelect.value)?.recordMs;
    playbackInput.max = String(max);
    playbackInput.value = String(displayIndex);
    playbackInput.disabled = false;
    playbackValue.textContent = formatPlaybackLabel(
      displayIndex,
      max,
      recordMs
    );
  }

  function seek(index) {
    if (!grid || !recording) return;
    playbackIndex = seekToStep(grid, recording, index);
    lastRenderedIndex = playbackIndex;
    updatePlaybackSlider();
    syncQuickTutorialGridHighlights();
    animator.requestFrame();
  }

  function showFrame(fromIndex, toIndex) {
    if (!grid || !recording) return;
    playbackIndex = seekForward(grid, recording, fromIndex, toIndex);
    lastRenderedIndex = playbackIndex;
    updatePlaybackSlider();
    syncQuickTutorialGridHighlights();
    animator.requestFrame();
  }

  function stopPlayback({ skipStatus = false } = {}) {
    pendingPlaybackRestart = null;
    skipAbortedStatus = skipStatus;
    tutorialPanel.cancelWait();
    tutorialPanel.hide();
    tutorialContext = null;
    sortPlayer.abort();
    appState = STATE.IDLE;
    isScrubbing = false;
    setControlsPlayback(false);
  }

  function applyGridSize() {
    syncColsLabel();
    const cols = Number(colsInput.value);

    if (appState !== STATE.IDLE) {
      stopPlayback({ skipStatus: true });
    }

    grid?.setCols(cols);
    resetBenchmarkInput();
    animator.requestFrame();
    statusEl.textContent = `${cols}×${cols} grid`;
  }

  function setTutorialContinueButton() {
    playToggleBtn.dataset.playback = "continue";
    playToggleBtn.setAttribute("aria-label", "Continue tutorial step");
    playToggleBtn.title = "Continue tutorial step";
  }

  function setControlsPlayback(isPlaying, paused = false) {
    const busy = isPlaying || paused;
    shuffleBtn.disabled = busy;
    playbackInput.disabled = !recording;

    if (
      isTutorialMode() &&
      isPlaying &&
      !paused &&
      tutorialPanel.isWaitingForContinue
    ) {
      setTutorialContinueButton();
      return;
    }

    if (paused) {
      playToggleBtn.dataset.playback = "paused";
      playToggleBtn.setAttribute("aria-label", "Resume sorting");
      playToggleBtn.title = "Resume sorting";
    } else if (isPlaying) {
      playToggleBtn.dataset.playback = "playing";
      playToggleBtn.setAttribute("aria-label", "Pause sorting");
      playToggleBtn.title = "Pause sorting";
    } else {
      playToggleBtn.dataset.playback = "idle";
      playToggleBtn.setAttribute("aria-label", "Start sorting");
      playToggleBtn.title = "Start sorting";
    }
  }

  function setIdle(message) {
    appState = STATE.IDLE;
    setControlsPlayback(false);

    const onDeferredTutorialGrid =
      !isTutorialMode() &&
      grid?.cols === CONFIG.tutorialCols &&
      colsBeforeTutorial !== null;

    if (onDeferredTutorialGrid) {
      if (sortComplete) {
        colsBeforeTutorial = null;
      }
      tutorialPanel.setEnabled(false);
      tutorialPanel.hide();
      tutorialContext = null;
    } else {
      syncTutorialChrome();
    }

    statusEl.textContent = message;
    updatePlaybackSlider();
  }

  function onPlayToggleClick() {
    if (
      appState === STATE.RUNNING &&
      isTutorialMode() &&
      tutorialPanel.isWaitingForContinue
    ) {
      tutorialPanel.continueStep();
      return;
    }
    if (appState === STATE.RUNNING) {
      pauseSort();
    } else {
      startSort();
    }
  }

  function ensureRecording() {
    if (!grid || !benchmarkSnapshot) return null;

    const algoId = algorithmSelect.value;
    const cached = algoResults.get(algoId);
    if (cached) {
      recording = cached.recording;
      refreshAlgorithmOptions();
      return recording;
    }

    const algo = getAlgorithm(algoId);
    if (!algo) return null;

    restoreBenchmark();
    statusEl.textContent = "Preparing steps…";

    const startMs = performance.now();
    const rec = recordSort(grid, algo.sort, compareByHue, algo.id);
    const recordMs = Math.round(performance.now() - startMs);
    const steps = animatedStepCount(rec);

    algoResults.set(algoId, { recording: rec, steps, recordMs });
    recording = rec;
    refreshAlgorithmOptions();

    sortComplete = false;
    playbackIndex = 0;
    updatePlaybackSlider();
    return recording;
  }

  async function runPlayback(fromIndex) {
    if (!grid || !recording) return;

    const session = ++playbackSession;
    const tutorialMode = isTutorialMode();
    const algoId = algorithmSelect.value;

    if (fromIndex === 0) {
      sortComplete = false;
    }

    appState = STATE.RUNNING;
    setControlsPlayback(true);
    statusEl.textContent = tutorialMode
      ? "Tutorial — Space at key steps; neighbors play automatically"
      : "Sorting…";

    lastRenderedIndex = fromIndex;

    if (isTutorialMode()) {
      tutorialContext = createTutorialContext();
      setContextCols(tutorialContext, grid.cols);
      warmTutorialContextThrough(fromIndex);
    } else {
      tutorialContext = null;
    }

    const result = await sortPlayer.playRecording(recording, fromIndex, {
      getPlaybackSettings,
      reducedMotion,
      tutorialMode,
      onFrame: (from, to) => {
        if (!isScrubbing) {
          showFrame(from, to);
        }
      },
      onTutorialBeforeStep: async ({ step, index, signal }) => {
        if (!tutorialContext || !recording) return;
        const before = getTutorialBeforeStepMessage(
          algoId,
          step,
          tutorialContext,
          grid.cells
        );
        if (!before) return;
        await presentTutorialMessage(before, index, signal);
      },
      onTutorialStep: async ({ step, index, signal }) => {
        if (!tutorialContext || !recording) return;
        if (algoId === "quick") {
          trackQuickStep(step, tutorialContext);
        }
        const message =
          step?.type === STEP.DONE
            ? getTutorialOutro(algoId)
            : getTutorialStepMessage(
                algoId,
                step,
                tutorialContext,
                grid.cells
              );

        if (!message) {
          tutorialPanel.hide();
          if (!reducedMotion) {
            await playbackDelay(CONFIG.tutorialStepMs, signal);
          }
          animator.requestFrame();
          return;
        }

        await presentTutorialMessage(message, index, signal);
      },
    });

    if (session !== playbackSession) {
      return;
    }

    tutorialPanel.hide();
    tutorialContext = null;

    if (result === "completed") {
      sortComplete = true;
      playbackIndex = recording.steps.length;
      seek(playbackIndex);
      const algo = getAlgorithm(algorithmSelect.value);
      const result = algo ? algoResults.get(algo.id) : undefined;
      const statsText = result
        ? ` — ${result.steps.toLocaleString()} steps · ${result.recordMs} ms`
        : "";
      setIdle(
        `Sorted by hue (${algo?.label ?? "sort"}${statsText}) — Start to replay`
      );
      return;
    }

    if (result === "paused") {
      if (pendingPlaybackRestart !== null && session === playbackSession) {
        const resumeIndex = pendingPlaybackRestart;
        pendingPlaybackRestart = null;
        void requestPlaybackResync(resumeIndex);
        return;
      }

      appState = STATE.PAUSED;
      setControlsPlayback(true, true);
      const prefix = isTutorialMode() ? "Tutorial paused" : "Paused";
      statusEl.textContent = `${prefix} at step ${toDisplayPlaybackIndex(recording, playbackIndex)} / ${animatedStepCount(recording)}`;
      return;
    }

    if (!skipAbortedStatus && appState !== STATE.PAUSED) {
      setIdle("Stopped");
    }
    skipAbortedStatus = false;
  }

  async function startSort() {
    if (!grid || appState === STATE.RUNNING) return;

    if (appState === STATE.PAUSED) {
      appState = STATE.RUNNING;
      await runPlayback(lastRenderedIndex);
      return;
    }

    if (!isTutorialMode()) {
      tutorialContext = null;
    }

    if (!ensureRecording()) return;

    if (sortComplete) {
      sortComplete = false;
      playbackIndex = 0;
      restoreBenchmark();
      seek(0);
      grid?.clearHighlights();
      if (heapTreeView && shouldShowHeapTree()) {
        heapTreeView.resize();
      }
      if (quickStripView && shouldShowQuickStrip()) {
        quickStripView.resize();
      }
      animator.requestFrame();
    }

    await runPlayback(playbackIndex);
  }

  function pauseSort() {
    if (appState !== STATE.RUNNING) return;
    pendingPlaybackRestart = null;
    tutorialPanel.cancelWait();
    tutorialPanel.hide();
    sortPlayer.pause();
  }

  function syncColsLabel() {
    colsValue.textContent = colsInput.value;
  }

  colsInput.addEventListener("input", applyGridSize);

  showHueInput.addEventListener("change", () => {
    syncShowHueValues();
    animator.requestFrame();
  });

  algorithmTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    setAlgorithmMenuOpen(algorithmList.hidden);
  });

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Node)) return;
    if (
      algorithmTrigger.contains(e.target) ||
      algorithmList.contains(e.target)
    ) {
      return;
    }
    setAlgorithmMenuOpen(false);
  });

  algorithmTrigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === " ") {
      e.preventDefault();
      setAlgorithmMenuOpen(true);
    }
    if (e.key === "Escape") {
      setAlgorithmMenuOpen(false);
    }
  });

  playbackInput.addEventListener("pointerdown", () => {
    if (!recording) return;
    isScrubbing = true;
    if (isTutorialMode()) {
      interruptTutorialPlayback();
    } else if (appState === STATE.RUNNING) {
      sortPlayer.pause();
    }
  });

  playbackInput.addEventListener("input", () => {
    if (!recording) return;
    const displayIndex = Number(playbackInput.value);

    if (isTutorialMode()) {
      applyTutorialScrub(displayIndex);
      return;
    }

    playbackIndex = toInternalPlaybackIndex(recording, displayIndex);
    seek(playbackIndex);
    if (appState === STATE.RUNNING) {
      appState = STATE.PAUSED;
      setControlsPlayback(true, true);
      const total = animatedStepCount(recording);
      statusEl.textContent = `Paused at step ${toDisplayPlaybackIndex(recording, playbackIndex)} / ${total}`;
    }
  });

  const mainStage = document.querySelector(".main__stage");
  if (mainStage) {
    mainStage.addEventListener(
      "wheel",
      (e) => {
        if (!isTutorialMode() || !recording) return;

        e.preventDefault();
        const current = toDisplayPlaybackIndex(recording, playbackIndex);
        const delta = e.deltaY > 0 ? 1 : -1;
        applyTutorialScrub(current + delta);
      },
      { passive: false }
    );
  }

  playbackInput.addEventListener("pointerup", () => {
    isScrubbing = false;
  });

  shuffleBtn.addEventListener("click", () => {
    if (appState !== STATE.IDLE) return;
    grid?.shuffle();
    resetBenchmarkInput();
    animator.requestFrame();
    statusEl.textContent = "Shuffled — benchmark reset";
  });

  playToggleBtn.addEventListener("click", onPlayToggleClick);

  speedSelect.addEventListener("change", async () => {
    const wasRunning = appState === STATE.RUNNING;
    const wasPaused = appState === STATE.PAUSED;
    const wasBusy = wasRunning || wasPaused;
    const resumeIndex = playbackIndex;
    const leavingTutorialDuringPlayback =
      wasBusy && colsBeforeTutorial !== null && !isTutorialMode();

    syncTutorialChrome({ deferGridRestore: leavingTutorialDuringPlayback });

    if (wasBusy) {
      await requestPlaybackResync(resumeIndex);
      return;
    }

    if (appState === STATE.IDLE) {
      statusEl.textContent = isTutorialMode()
        ? `Tutorial — ${CONFIG.tutorialCols}×${CONFIG.tutorialCols} grid, press Start`
        : `${grid?.cols ?? CONFIG.cols}×${grid?.cols ?? CONFIG.cols} grid — press Start to sort`;
    }
  });

  refreshAlgorithmOptions();
  populateSpeedPresets();
  syncShowHueValues();
  syncTutorialChrome();
  syncColsLabel();
  updatePlaybackSlider();
  setIdle(`${CONFIG.cols}×${CONFIG.cols} grid — press Start to sort`);
}
