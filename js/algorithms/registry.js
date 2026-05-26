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
      "Each pass finds the smallest remaining hue and puts it in the next left slot.",
    sort: selectionSort,
  },
  {
    id: "heap",
    label: "Heap Sort",
    description:
      "Builds a max-heap, locks the largest hue at the tail each round, then re-heapifies from the root.",
    sort: heapSort,
  },
  {
    id: "quick",
    label: "Quick Sort",
    description:
      "Partitions each section around a pivot, then sorts the left and right parts.",
    sort: quickSort,
  },
  {
    id: "merge",
    label: "Merge Sort",
    description:
      "Splits the grid in half, sorts each side, then merges the sorted runs.",
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
