// Algorithm card, as in the Pathfinding Visualizer: the algorithm's name,
// a time-complexity badge, a short description, and a comparison table of
// every algorithm run on the current shuffle.
//
// It appears for:
//   - an option in the open algorithm menu (beside the menu), and the closed
//     menu button (the current algorithm, below it), on mouse hover;
//   - the same on touch screens with a long press;
//   - the menu button when it gets keyboard focus.
// Options are rebuilt whenever results change, so events are delegated
// from the document rather than bound to each option.

import { STEP } from "../algorithms/types.js";

const SHOW_DELAY_MS = 250;
// Moving between options: hide only if the pointer doesn't land on another
// option within this time, so the card doesn't flicker.
const HIDE_DELAY_MS = 80;
const GAP = 8;

// Touch screens have no hover, so a long press shows the card.
const LONG_PRESS_MS = 450;
// A finger moving further than this is scrolling, not pressing.
const LONG_PRESS_MOVE_PX = 10;

const COLUMNS = [
  { key: "compares", heading: "Compares", hint: "Comparisons between two hues", format: (n) => n.toLocaleString() },
  { key: "swaps", heading: "Swaps", hint: "Cells moved (swaps and writes)", format: (n) => n.toLocaleString() },
  { key: "timeMs", heading: "Time", hint: "Time to compute the sort", format: formatTime },
];

/**
 * @param {{
 *   trigger: HTMLElement,
 *   algorithms: { id: string, label: string, description: string, complexity: { label: string, fast: boolean } }[],
 *   getCurrentId: () => string,
 *   getResults: () => Map<string, { recording: { steps: { type: string }[] }, recordMs: number }>,
 * }} options
 * @returns {{ refresh: () => void, hide: () => void }}
 */
export function setupAlgorithmTooltip({ trigger, algorithms, getCurrentId, getResults }) {
  const SELECTOR = ".algo-picker__option";

  const tooltip = document.createElement("div");
  tooltip.id = "algorithm-tooltip";
  tooltip.className = "algorithm-tooltip popover";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);

  /** @type {HTMLElement | null} */
  let anchor = null;
  let showTimer = 0;
  let hideTimer = 0;
  // Shown by a long press: placed above the finger, and stays up after the
  // finger lifts until the next tap.
  let shownByTouch = false;

  let pressTimer = 0;
  /** @type {{ x: number, y: number } | null} */
  let pressStart = null;
  // The element whose long press just showed the card: the click the
  // browser sends when the finger lifts must not select or open anything.
  /** @type {HTMLElement | null} */
  let swallowClickOn = null;

  /** @param {EventTarget | null} target */
  function anchorFrom(target) {
    if (!(target instanceof Element)) return null;
    const option = target.closest(SELECTOR);
    if (option instanceof HTMLElement) return option;
    // The closed menu button; once the menu is open, its options have cards.
    if (trigger.contains(target) && trigger.getAttribute("aria-expanded") !== "true") {
      return trigger;
    }
    return null;
  }

  /** @param {HTMLElement} el */
  const algorithmIdOf = (el) => el.dataset.value ?? getCurrentId();

  /**
   * @param {HTMLElement} el
   * @param {number} delay
   */
  function show(el, delay, byTouch = false) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    showTimer = window.setTimeout(() => {
      anchor?.removeAttribute("aria-describedby");
      anchor = el;
      shownByTouch = byTouch;
      render();
      tooltip.hidden = false;
      el.setAttribute("aria-describedby", tooltip.id);
      position();
    }, delay);
  }

  function hide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    shownByTouch = false;
    anchor?.removeAttribute("aria-describedby");
    anchor = null;
    tooltip.hidden = true;
  }

  function render() {
    if (!anchor) return;
    const id = algorithmIdOf(anchor);
    const algo = algorithms.find((a) => a.id === id);
    if (!algo) return;

    tooltip.replaceChildren(
      el("strong", "tooltip-title", algo.label),
      el("span", `badge tooltip-badge${algo.complexity.fast ? " badge-positive" : ""}`, algo.complexity.label),
      el("p", "tooltip-description", algo.description)
    );

    const stats = computeStats(getResults());
    if (stats.size === 0) {
      tooltip.append(el("p", "tooltip-note", "Run some algorithms to compare them here."));
      return;
    }
    if (!stats.has(id)) {
      tooltip.append(el("p", "tooltip-note", "Run it to add it to the comparison."));
    }
    tooltip.append(comparisonTable(stats, id));
  }

  /**
   * @param {Map<string, Record<string, number>>} stats
   * @param {string} currentId
   */
  function comparisonTable(stats, currentId) {
    const rows = algorithms.filter((a) => stats.has(a.id));

    // Lowest value per column.
    /** @type {Record<string, number>} */
    const best = {};
    for (const { key } of COLUMNS) {
      best[key] = Math.min(...rows.map((a) => stats.get(a.id)[key]));
    }

    const table = el("table", "tooltip-table");
    const head = el("tr");
    head.append(el("th", "", ""));
    for (const { heading, hint } of COLUMNS) {
      const th = el("th", "", heading);
      th.title = hint;
      head.append(th);
    }
    table.append(el("thead"), el("tbody"));
    table.tHead?.append(head);

    for (const algo of rows) {
      const s = stats.get(algo.id);
      const tr = el("tr", algo.id === currentId ? "current" : "");
      tr.append(el("td", "tooltip-row-name", algo.label));
      for (const { key, format } of COLUMNS) {
        const isBest = rows.length > 1 && s[key] === best[key];
        tr.append(el("td", isBest ? "best" : "", format(s[key])));
      }
      table.tBodies[0].append(tr);
    }
    return table;
  }

  function position() {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const menu = anchor.closest(".algo-picker__list");

    let left;
    let top;
    if (shownByTouch) {
      // Above, clear of the finger and hand; below only if there's no room.
      left = rect.left + (rect.width - width) / 2;
      top = rect.top - height - GAP;
      if (top < GAP) top = rect.bottom + GAP;
    } else if (menu) {
      // Beside the open menu, so it doesn't cover the other options.
      const menuRect = menu.getBoundingClientRect();
      left = menuRect.right + GAP;
      top = rect.top;
      if (left + width > innerWidth - GAP) left = menuRect.left - width - GAP;
    } else {
      left = rect.left;
      top = rect.bottom + GAP;
      if (top + height > innerHeight - GAP) top = rect.top - height - GAP;
    }

    tooltip.style.left = `${clamp(left, GAP, innerWidth - width - GAP)}px`;
    tooltip.style.top = `${clamp(top, GAP, innerHeight - height - GAP)}px`;
  }

  function cancelPress() {
    clearTimeout(pressTimer);
    pressTimer = 0;
  }

  // Hover, for a real mouse only (phones also fire fake mouse events after
  // a tap, hence pointer events).
  document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse") return;
    const el = anchorFrom(event.target);
    if (!el) return;
    clearTimeout(hideTimer);
    if (el === anchor) return;
    // Already showing a card: switch straight to the new one.
    show(el, tooltip.hidden ? SHOW_DELAY_MS : 0);
  });

  document.addEventListener("pointerout", (event) => {
    const el = anchorFrom(event.target);
    if (!el) return;
    if (event.pointerType !== "mouse") {
      cancelPress();
      return;
    }
    if (anchorFrom(event.relatedTarget) === el) return;
    clearTimeout(showTimer);
    if (!shownByTouch) hideTimer = window.setTimeout(hide, HIDE_DELAY_MS);
  });

  // Long press on touch screens.
  document.addEventListener("pointerdown", (event) => {
    swallowClickOn = null;
    const el = anchorFrom(event.target);
    // A card opened by a long press closes on the next tap anywhere (a new
    // long press re-opens it).
    if (shownByTouch) hide();
    if (event.pointerType === "mouse") {
      // Clicking opens the menu or picks an algorithm: get out of the way.
      if (el) hide();
      return;
    }
    if (!el) return;
    pressStart = { x: event.clientX, y: event.clientY };
    cancelPress();
    pressTimer = window.setTimeout(() => {
      pressTimer = 0;
      swallowClickOn = el;
      show(el, 0, true);
      navigator.vibrate?.(10);
    }, LONG_PRESS_MS);
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!pressTimer || !pressStart) return;
    const moved = Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y);
    if (moved > LONG_PRESS_MOVE_PX) cancelPress();
  });
  document.addEventListener("pointerup", cancelPress);
  document.addEventListener("pointercancel", cancelPress);

  // Holding a finger down can open the browser's own menu.
  document.addEventListener("contextmenu", (event) => {
    const el = anchorFrom(event.target);
    if (el && (pressTimer || swallowClickOn === el)) event.preventDefault();
  });

  // Swallow the click that follows a long press. Capture phase, so it runs
  // before the menu's own handlers.
  document.addEventListener("click", (event) => {
    if (swallowClickOn && event.target instanceof Node && swallowClickOn.contains(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    swallowClickOn = null;
  }, true);

  // Keyboard users get the current algorithm's card on focus.
  trigger.addEventListener("focus", () => {
    if (trigger.matches(":focus-visible")) show(trigger, 0);
  });
  trigger.addEventListener("blur", hide);

  document.addEventListener("keydown", (event) => {
    swallowClickOn = null;
    if (event.key === "Escape" || (anchor === trigger && event.key !== "Tab")) hide();
  }, true);
  addEventListener("scroll", hide, true);
  addEventListener("resize", hide);

  return {
    // Call when results or the option list change.
    refresh() {
      if (!anchor || tooltip.hidden) return;
      // The option it was attached to may have been rebuilt.
      if (!anchor.isConnected) {
        hide();
        return;
      }
      render();
      position();
    },
    hide,
  };
}

/**
 * Compares, swaps and compute time per algorithm, in run order.
 * @param {Map<string, { recording: { steps: { type: string }[] }, recordMs: number }>} results
 */
function computeStats(results) {
  /** @type {Map<string, Record<string, number>>} */
  const stats = new Map();
  for (const [id, result] of results) {
    let compares = 0;
    let swaps = 0;
    for (const step of result.recording.steps) {
      if (step.type === STEP.COMPARE) compares++;
      else if (step.type === STEP.SWAP) swaps++;
    }
    stats.set(id, { compares, swaps, timeMs: result.recordMs });
  }
  return stats;
}

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 */
function el(tag, className = "", text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** @param {number} ms */
function formatTime(ms) {
  if (ms < 1) return "<1 ms";
  return ms > 999 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
