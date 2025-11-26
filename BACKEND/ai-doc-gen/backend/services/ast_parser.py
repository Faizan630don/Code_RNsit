import ast
from typing import List


def parse_functions(code: str) -> List[ast.FunctionDef]:
    tree = ast.parse(code)
    return [node for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]


def compute_cyclomatic_complexity(func_node: ast.FunctionDef) -> int:
    complexity = 1
    for node in ast.walk(func_node):
        if isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.With)):
            complexity += 1
        if isinstance(node, ast.BoolOp):
            complexity += len(node.values) - 1
    return complexity
