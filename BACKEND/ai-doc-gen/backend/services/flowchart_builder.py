import ast
import re
from typing import List, Optional, Dict
from backend.models.flowchart_models import Node, Edge, Flowchart
from backend.services.groq_client import groq_analyze_line_complexities

class BaseFlowchartBuilder:
    def __init__(self):
        self.nodes = []
        self.edges = []
        self.node_counter = 0

    def _create_id(self):
        self.node_counter += 1
        return f"node_{self.node_counter}"

    def _get_bucket(self, score: int) -> str:
        if score <= 5: return "low"
        if score <= 10: return "medium"
        return "high"

    def _add_node(self, label: str, type: str = "process", complexity_score: int = 1):
        node_id = self._create_id()
        bucket = self._get_bucket(complexity_score)
        self.nodes.append(Node(
            id=node_id, 
            label=label, 
            type=type, 
            complexity=bucket,
            complexity_score=complexity_score
        ))
        return node_id

    def _add_edge(self, from_id: str, to_id: str, label: Optional[str] = None):
        self.edges.append(Edge(from_node=from_id, to_node=to_id, label=label))
    
    def get_flowchart(self) -> Flowchart:
        return Flowchart(nodes=self.nodes, edges=self.edges)

# --- Python Builder (AST) ---
class PythonFlowchartBuilder(BaseFlowchartBuilder):
    def calculate_complexity(self, node) -> int:
        score = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.ExceptHandler, ast.With)):
                score += 1
            elif isinstance(child, ast.BoolOp):
                score += len(child.values) - 1
        return score

    def process_body(self, statements: List[ast.stmt], prev_id: str) -> str:
        current_prev = prev_id
        for stmt in statements:
            if isinstance(stmt, ast.If):
                score = self.calculate_complexity(stmt)
                cond = ast.unparse(stmt.test)
                decision_id = self._add_node(f"Is {cond}?", "decision", score)
                self._add_edge(current_prev, decision_id)

                last_true = self.process_body(stmt.body, decision_id)
                self._add_edge(decision_id, self.nodes[int(last_true.split('_')[1])-1].id, label="Yes")

                if stmt.orelse:
                    last_false = self.process_body(stmt.orelse, decision_id)
                    merge_id = self._add_node("End If", "merge")
                    self._add_edge(last_true, merge_id)
                    self._add_edge(last_false, merge_id)
                    current_prev = merge_id
                else:
                    merge_id = self._add_node("End If", "merge")
                    self._add_edge(last_true, merge_id)
                    self._add_edge(decision_id, merge_id, label="No")
                    current_prev = merge_id

            elif isinstance(stmt, (ast.For, ast.While)):
                score = self.calculate_complexity(stmt)
                loop_label = f"Loop {ast.unparse(stmt.test)}" if isinstance(stmt, ast.While) else "For Loop"
                
                loop_id = self._add_node(loop_label, "decision", score)
                self._add_edge(current_prev, loop_id)
                
                last_body = self.process_body(stmt.body, loop_id)
                self._add_edge(last_body, loop_id, label="Next")
                
                end_loop = self._add_node("End Loop", "process")
                self._add_edge(loop_id, end_loop, label="Done")
                current_prev = end_loop
            
            elif isinstance(stmt, ast.Return):
                val = ast.unparse(stmt.value) if stmt.value else "None"
                ret_id = self._add_node(f"Return {val}", "end")
                self._add_edge(current_prev, ret_id)
                current_prev = ret_id
            
            else:
                code = ast.unparse(stmt)
                if len(code) > 30: code = code[:27] + "..."
                n_id = self._add_node(code, "process")
                self._add_edge(current_prev, n_id)
                current_prev = n_id
        
        return current_prev

# --- Regex Builder (Universal) ---
class RegexFlowchartBuilder(BaseFlowchartBuilder):
    def calculate_complexity_heuristic(self, code_snippet: str) -> int:
        keywords = ["if", "else", "for", "while", "case", "catch", "&&", "||", "And", "Or"]
        score = 1
        for kw in keywords:
            score += len(re.findall(r'\b' + re.escape(kw) + r'\b', code_snippet, re.IGNORECASE))
        return score

    def build(self, code: str):
        start_id = self._add_node("Start", "start")
        prev_id = start_id
        
        # 1. Get Batch AI Scores
        ai_complexity_map = groq_analyze_line_complexities(code)
        
        lines = code.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith(("//", "#", "/*", "*")): continue

            # 2. Lookup Score (Fallback to heuristic if line not found)
            line_score = ai_complexity_map.get(line, self.calculate_complexity_heuristic(line))
            
            if re.match(r'^(if|else if|elif)\s*\(?', line):
                label = line.split('{')[0].strip()[:30]
                node_id = self._add_node(label, "decision", line_score)
                self._add_edge(prev_id, node_id)
                prev_id = node_id
            
            elif re.match(r'^(for|while|foreach)\s*\(?', line):
                label = line.split('{')[0].strip()[:30]
                node_id = self._add_node(label, "decision", line_score)
                self._add_edge(prev_id, node_id)
                prev_id = node_id
            
            elif line.startswith("return"):
                node_id = self._add_node(line.replace(";", ""), "end")
                self._add_edge(prev_id, node_id)
                prev_id = node_id
            
            else:
                if len(line) > 30: line = line[:27] + "..."
                node_id = self._add_node(line.replace(";", ""), "process", line_score)
                self._add_edge(prev_id, node_id)
                prev_id = node_id
        
        self._add_node("End", "end")

def build_flowchart(code: str) -> Flowchart:
    try:
        tree = ast.parse(code)
        builder = PythonFlowchartBuilder()
        start_id = builder._add_node("Start", "start")
        functions = [n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)]
        if functions:
            builder.process_body(functions[0].body, start_id)
        else:
            builder.process_body(tree.body, start_id)
        return builder.get_flowchart()
    except SyntaxError:
        builder = RegexFlowchartBuilder()
        builder.build(code)
        return builder.get_flowchart()