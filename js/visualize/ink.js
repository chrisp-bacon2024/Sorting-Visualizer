/**
 * Colours for text and lines drawn on the canvases, read from the
 * christophermpalmer.com theme (linked in index.html), so the panels match
 * the page around them and follow theme updates. The fallbacks are the
 * theme's current values, used if the stylesheet hasn't loaded.
 *
 * The cell colours and highlight rings are this app's own visualization
 * palette and stay in the view files.
 */

/** @type {Record<string, string>} */
const cache = {};

/**
 * @param {string} name CSS custom property
 * @param {string} fallback
 */
const token = (name, fallback) => {
  if (!(name in cache)) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    cache[name] = value || fallback;
  }
  return cache[name];
};

export const ink = {
  /** Panel titles and row labels ("Merge runs", "Left", "Sorted"). */
  get label() {
    return token("--color-label", "#475569");
  },
  /** Hints and small annotations ("Start sort to see runs", "≤ pivot"). */
  get hint() {
    return token("--color-text-secondary", "#64748b");
  },
  /** Heap tree edges. */
  get line() {
    return token("--color-border", "#cbd5e1");
  },
  /** Quick sort's active-range bracket. */
  get bracket() {
    return token("--color-text-muted", "#94a3b8");
  },
};
