import { bubbleSort } from "./bubble.js";
import { insertionSort } from "./insertion.js";
import { selectionSort } from "./selection.js";
import { heapSort } from "./heap.js";
import { quickSort } from "./quick.js";
import { mergeSort } from "./merge.js";
import { timSort } from "./timsort.js";

/** @typedef {import('./types.js').SortGenerator} SortGenerator */

/**
 * @typedef {{ id: string, label: string, description: string, sort: SortGenerator }} AlgorithmEntry
 */

/** @type {AlgorithmEntry[]} */
export const ALGORITHMS = [
  {
    id: "bubble",
    label: "Bubble Sort",
    description:
      "Walks the grid comparing neighbors; larger hues bubble towards their sorted position each pass.",
    sort: bubbleSort,
  },
  {
    id: "insertion",
    label: "Insertion Sort",
    description:
      "Builds a sorted section from the left by sliding each hue into place among earlier cells.",
    sort: insertionSort,
  },
  {
    id: "selection",
    label: "Selection Sort",
    description:
      "Finds the smallest remaining hue each pass and swaps it into the next open slot on the left.",
    sort: selectionSort,
  },
  {
    id: "heap",
    label: "Heap Sort",
    description:
      "Uses a max-heap to repeatedly pull the largest hue to the end, then restores the heap.",
    sort: heapSort,
  },
  {
    id: "quick",
    label: "Quick Sort",
    description:
      "Picks a pivot, partitions smaller hues left and larger right, then sorts each side.",
    sort: quickSort,
  },
  {
    id: "merge",
    label: "Merge Sort",
    description:
      "Divides the grid in half, sorts each side, then merges sorted runs by hue.",
    sort: mergeSort,
  },
  {
    id: "timsort",
    label: "Tim Sort",
    description:
      "Finds natural increasing runs, fixes short ones, and merges runs—fast on nearly sorted data.",
    sort: timSort,
  },
];

/**
 * @param {string} id
 * @returns {AlgorithmEntry | undefined}
 */
export function getAlgorithm(id) {
  return ALGORITHMS.find((entry) => entry.id === id);
}
