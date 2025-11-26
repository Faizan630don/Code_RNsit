// Mock data for demo mode when backend is unavailable
import type {
  FlowchartResponse,
  ComplexityResponse,
  RefactorResponse,
  DocstringResponse,
} from '../types';

export const mockFlowchartResponse: FlowchartResponse = {
  explanation: 'This is a demo explanation. The backend is not connected. This function calculates the Fibonacci sequence recursively.',
  flowchart: {
    nodes: [
      { id: 'node_1', label: 'Start', type: 'start', complexity_score: 1 },
      { id: 'node_2', label: 'if n <= 1', type: 'decision', complexity_score: 2 },
      { id: 'node_3', label: 'return n', type: 'process', complexity_score: 1 },
      { id: 'node_4', label: 'return fib(n-1) + fib(n-2)', type: 'process', complexity_score: 8 },
      { id: 'node_5', label: 'End', type: 'end', complexity_score: 1 },
    ],
    edges: [
      { from_node: 'node_1', to_node: 'node_2', label: '' },
      { from_node: 'node_2', to_node: 'node_3', label: 'Yes' },
      { from_node: 'node_2', to_node: 'node_4', label: 'No' },
      { from_node: 'node_3', to_node: 'node_5', label: '' },
      { from_node: 'node_4', to_node: 'node_5', label: '' },
    ],
  },
};

export const mockComplexityResponse: ComplexityResponse = {
  time_complexity: 'O(2^n)',
  space_complexity: 'O(n)',
  time_explanation: 'Exponential time complexity due to recursive calls without memoization.',
  space_explanation: 'Linear space complexity due to the call stack depth.',
  time_data: [
    { n: 1, steps: 1 },
    { n: 5, steps: 15 },
    { n: 10, steps: 177 },
    { n: 20, steps: 21891 },
    { n: 30, steps: 2692537 },
  ],
  space_data: [
    { n: 1, steps: 1 },
    { n: 5, steps: 5 },
    { n: 10, steps: 10 },
    { n: 20, steps: 20 },
    { n: 30, steps: 30 },
  ],
};

export const mockRefactorResponse: RefactorResponse = {
  original_code: `function calculateFibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}`,
  refactored_code: `const calculateFibonacci = (() => {
  const cache = { 0: 0, 1: 1 };
  return function fib(n) {
    if (cache[n] !== undefined) return cache[n];
    cache[n] = fib(n - 1) + fib(n - 2);
    return cache[n];
  };
})();`,
  issues: [
    {
      type: 'Performance Issue',
      description: 'Recursive implementation without memoization causes exponential time complexity',
      severity: 'High',
    },
    {
      type: 'Code Smell',
      description: 'Function can be optimized using memoization pattern',
      severity: 'Medium',
    },
  ],
  language_detected: 'javascript',
};

export const mockDocstringResponse: DocstringResponse = {
  docstring: `/**
 * Calculates the nth Fibonacci number using memoization.
 * 
 * @param {number} n - The position in the Fibonacci sequence (non-negative integer)
 * @returns {number} The nth Fibonacci number
 * 
 * @example
 * calculateFibonacci(10) // Returns 55
 * calculateFibonacci(0) // Returns 0
 * 
 * @complexity
 * Time: O(n) - Linear time due to memoization
 * Space: O(n) - Linear space for cache storage
 */`,
};

