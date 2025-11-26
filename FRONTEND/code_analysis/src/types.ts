// Backend API Types - Matching Pydantic Models

export type NodeType = 'start' | 'process' | 'decision' | 'end';

export interface Node {
  id: string;
  label: string;
  type: NodeType;
  complexity_score: number;
}

export interface Edge {
  from_node: string;
  to_node: string;
  label: string;
}

export interface Flowchart {
  nodes: Node[];
  edges: Edge[];
}

export interface FlowchartResponse {
  explanation: string;
  flowchart: Flowchart;
}

export interface ComplexityPoint {
  n: number;
  steps: number;
}

export interface ComplexityResponse {
  time_complexity: string;
  space_complexity: string;
  time_explanation: string;
  space_explanation: string;
  time_data: ComplexityPoint[];
  space_data: ComplexityPoint[];
}

export type Severity = 'Low' | 'Medium' | 'High';

export interface RefactorIssue {
  type: string;
  description: string;
  severity: Severity;
}

export interface RefactorResponse {
  original_code: string;
  refactored_code: string;
  issues: RefactorIssue[];
  language_detected: string;
}

export interface DocstringResponse {
  docstring: string;
}

export interface ApiRequest {
  code: string;
  language?: string;
}

