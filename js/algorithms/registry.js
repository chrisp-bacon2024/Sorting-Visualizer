import { bubbleSort } from "./bubble.js";
import { insertionSort } from "./insertion.js";
import { selectionSort } from "./selection.js";
import { heapSort } from "./heap.js";
import { quickSort } from "./quick.js";
import { mergeSort } from "./merge.js";
import { timSort } from "./timsort.js";

/** @typedef {import('./types.js').SortGenerator} SortGenerator */

/**
 * @typedef {{ id: string, label: string, sort: SortGenerator }} AlgorithmEntry
 */

/** @type {AlgorithmEntry[]} */
export const ALGORITHMS = [
  { id: "bubble", label: "Bubble Sort", sort: bubbleSort },
  { id: "insertion", label: "Insertion Sort", sort: insertionSort },
  { id: "selection", label: "Selection Sort", sort: selectionSort },
  { id: "heap", label: "Heap Sort", sort: heapSort },
  { id: "quick", label: "Quick Sort", sort: quickSort },
  { id: "merge", label: "Merge Sort", sort: mergeSort },
  { id: "timsort", label: "Tim Sort", sort: timSort },
];

/**
 * @param {string} id
 * @returns {AlgorithmEntry | undefined}
 */
export function getAlgorithm(id) {
  return ALGORITHMS.find((entry) => entry.id === id);
}
