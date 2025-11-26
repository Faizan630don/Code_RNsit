from pydantic import BaseModel
from typing import Optional, List, Literal, Any

# --- Request Models ---
class ExplainRequest(BaseModel):
    code: str
    language: str = "auto"

class DocstringRequest(BaseModel):
    code: str
    style: str = "auto"

class RefactorRequest(BaseModel):
    code: str
    language: str = "auto"

class ComplexityRequest(BaseModel):
    code: str
    language: str = "auto"

# --- Response Models ---
class Node(BaseModel):
    id: str
    label: str
    type: Optional[str] = None
    complexity: Optional[Literal["low", "medium", "high"]] = None
    complexity_score: Optional[int] = 1

class Edge(BaseModel):
    from_node: str
    to_node: str
    label: Optional[str] = None

class Flowchart(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class FlowchartResponse(BaseModel):
    explanation: str
    flowchart: Flowchart

class DocstringResponse(BaseModel):
    docstring: str

class RefactorIssue(BaseModel):
    type: str
    description: str
    severity: str

class RefactorResponse(BaseModel):
    original_code: str
    refactored_code: str
    issues: List[RefactorIssue]
    language_detected: str

# --- Complexity Models ---
class ComplexityPoint(BaseModel):
    n: int
    steps: int

class ComplexityAnalysis(BaseModel):
    time_complexity: str
    space_complexity: str
    time_explanation: str
    space_explanation: str
    time_data: List[ComplexityPoint]
    space_data: List[ComplexityPoint]