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
  original_code: `#include <stdio.h>

int main() {
    char op;
    int a, b;

    printf("Enter operator (+, -, *, /): ");
    scanf("%c", &op);

    printf("Enter two numbers: ");
    scanf("%d %d", &a, &b);

    switch(op) {
        case '+': printf("Result = %d\n", a + b); break;
        case '-': printf("Result = %d\n", a - b); break;
        case '*': printf("Result = %d\n", a * b); break;
        case '/': printf("Result = %d\n", a / b); break;
        default: printf("Invalid operator!\n");
    }

    return 0;
}`,
  refactored_code: `#include <stdio.h>

int main(void) {
    char op = 0;
    int a = 0, b = 0;

    printf("Enter operator (+, -, *, /): ");
    if (scanf(" %c", &op) != 1) {
        printf("Input error: operator.\n");
        return 1;
    }

    printf("Enter two integers: ");
    if (scanf("%d %d", &a, &b) != 2) {
        printf("Input error: numbers.\n");
        return 1;
    }

    switch (op) {
        case '+':
            printf("Result = %d\n", a + b);
            break;
        case '-':
            printf("Result = %d\n", a - b);
            break;
        case '*':
            printf("Result = %d\n", a * b);
            break;
        case '/':
            if (b == 0) {
                printf("Error: division by zero.\n");
                return 1;
            }
            printf("Result = %d\n", a / b);
            break;
        default:
            printf("Invalid operator!\n");
            return 1;
    }

    return 0;
}`,
  issues: [
    { type: 'Code Smell', description: 'Missing input validation for scanf return values', severity: 'Medium' },
    { type: 'Security Vulnerability', description: 'Division by zero not handled', severity: 'High' },
  ],
  language_detected: 'c',
};

export const mockDocstringResponse: DocstringResponse = {
  docstring: `/**
 * @file calculator.c
 * @brief Simple integer calculator using a switch statement.
 *
 * Reads an operator and two integers from standard input and prints the
 * computed result. Supports addition, subtraction, multiplication, and
 * division with a division-by-zero guard.
 *
 * @details Input is validated via scanf return values. Division by zero
 * returns an error code and prints a diagnostic message.
 *
 * @return int Exit status: 0 on success, non-zero on input or operation error.
 */`,
};
