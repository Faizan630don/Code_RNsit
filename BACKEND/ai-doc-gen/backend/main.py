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
        # Check if explanation contains an error
        if explanation.startswith("Error:") or "invalid_api_key" in explanation.lower() or "GROQ_API_KEY" in explanation:
            raise HTTPException(status_code=503, detail=explanation)
        flowchart = build_flowchart(req.code)
        return {
            "explanation": explanation,
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
        # Check if docstring contains an error
        if docstring_text.startswith("Error:") or "invalid_api_key" in docstring_text.lower() or "GROQ_API_KEY" in docstring_text:
            raise HTTPException(status_code=503, detail=docstring_text)
        return {"docstring": docstring_text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate docstring: {str(e)}")

@app.post("/api/refactor", response_model=RefactorResponse)
async def refactor_code(req: RefactorRequest):
    try:
        analysis_result = groq_refactor_code(req.code)
        
        # Check if result contains an error
        if isinstance(analysis_result, dict) and analysis_result.get("error"):
            error_type = analysis_result.get("error_type", "unknown")
            if error_type in ["invalid_api_key", "missing_api_key"]:
                raise HTTPException(status_code=503, detail=analysis_result.get("error", "API key error"))
        
        return {
            "original_code": req.code,
            "refactored_code": analysis_result.get("refactored_code", ""),
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
        
        # Check if result contains an error
        if isinstance(result, dict) and result.get("error"):
            error_type = result.get("error_type", "unknown")
            if error_type in ["invalid_api_key", "missing_api_key"]:
                raise HTTPException(status_code=503, detail=result.get("error", "API key error"))
        
        # Ensure keys exist (basic error handling)
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
