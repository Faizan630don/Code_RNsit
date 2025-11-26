from pydantic import BaseModel
from typing import Optional, List


class Node(BaseModel):
    id: str
    label: str
    type: Optional[str] = None
    complexity: Optional[str] = None


class Edge(BaseModel):
    from_node: str
    to_node: str
    label: Optional[str] = None


class Flowchart(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
