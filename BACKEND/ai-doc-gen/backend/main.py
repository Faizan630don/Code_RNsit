from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from backend.services.groq_client import (
    groq_generate_explanation, 
    groq_generate_docstring, 
    groq_refactor_code,
    groq_analyze_complexity  # Import the new function
)
from backend.services.flowchart_builder import build_flowchart
from backend.models.flowchart_models import (
    FlowchartResponse, ExplainRequest, 
    DocstringResponse, DocstringRequest,
    RefactorResponse, RefactorRequest,
    ComplexityAnalysis, ComplexityRequest # Import new models
)

app = FastAPI(title="AI Doc Generator")

# CORS middleware for frontend integration
allowed_origins_env = os.getenv("CORS_ALLOW_ORIGINS")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] if allowed_origins_env else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ping")
async def ping():
    return {"status": "ok", "msg": "Backend running"}

@app.post("/api/explain", response_model=FlowchartResponse)
async def explain_code(req: ExplainRequest):
    try:
        explanation = groq_generate_explanation(req.code, req.language)
        fallback = False
        # If explanation failed due to missing/invalid API key, continue with AST flowchart and a fallback message
        if isinstance(explanation, str) and (
            explanation.startswith("Error:") or
            "invalid_api_key" in explanation.lower() or
            "GROQ_API_KEY" in explanation
        ):
            fallback = True
        flowchart = build_flowchart(req.code)
        return {
            "explanation": (
                "Explanation unavailable due to API key configuration. Flowchart derived from AST analysis."
                if fallback else explanation
            ),
            "flowchart": flowchart
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate explanation: {str(e)}")

@app.post("/api/docstring", response_model=DocstringResponse)
async def generate_docstring(req: DocstringRequest):
    try:
        docstring_text = groq_generate_docstring(req.code, req.style)
        # Graceful fallback for API key issues
        if isinstance(docstring_text, str) and (
            docstring_text.startswith("Error:") or
            "invalid_api_key" in docstring_text.lower() or
            "GROQ_API_KEY" in docstring_text
        ):
            docstring_text = "Documentation unavailable due to API key configuration."
        return {"docstring": docstring_text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate docstring: {str(e)}")

@app.post("/api/refactor", response_model=RefactorResponse)
async def refactor_code(req: RefactorRequest):
    try:
        analysis_result = groq_refactor_code(req.code)

        # If Groq returns an error (e.g., API key), provide a graceful fallback
        if isinstance(analysis_result, dict) and analysis_result.get("error"):
            analysis_result = {
                "language_detected": "unknown",
                "issues": [],
                "refactored_code": req.code,
            }

        return {
            "original_code": req.code,
            "refactored_code": analysis_result.get("refactored_code", req.code),
            "issues": analysis_result.get("issues", []),
            "language_detected": analysis_result.get("language_detected", "unknown")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refactor code: {str(e)}")

@app.post("/api/complexity", response_model=ComplexityAnalysis)
async def analyze_complexity(req: ComplexityRequest):
    """
    Returns Time/Space complexity analysis and data points for plotting graphs.
    """
    try:
        result = groq_analyze_complexity(req.code)

        # Graceful fallback for API key issues
        if isinstance(result, dict) and result.get("error"):
            result = {
                "time_complexity": "Unknown",
                "space_complexity": "Unknown",
                "time_explanation": "Complexity analysis unavailable due to API key configuration.",
                "space_explanation": "Complexity analysis unavailable due to API key configuration.",
                "time_data": [],
                "space_data": [],
            }

        # Ensure keys exist
        return {
            "time_complexity": result.get("time_complexity", "Unknown"),
            "space_complexity": result.get("space_complexity", "Unknown"),
            "time_explanation": result.get("time_explanation", ""),
            "space_explanation": result.get("space_explanation", ""),
            "time_data": result.get("time_data", []),
            "space_data": result.get("space_data", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze complexity: {str(e)}")
