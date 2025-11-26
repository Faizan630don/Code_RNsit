from fastapi import FastAPI
from pydantic import BaseModel
from backend.services.groq_client import groq_generate_explanation

app = FastAPI(title="AI Code Explainer (GROQ)")


# ---------- Request Schema ----------
class ExplainRequest(BaseModel):
    code: str
    language: str


# ---------- Routes ----------
@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": "Server running!"}


@app.post("/api/explain")
async def explain_code(req: ExplainRequest):
    """
    Generates a natural-language explanation for the user’s code.
    Uses Groq LLM through groq_client.py.
    """
    try:
        explanation = groq_generate_explanation(req.code, req.language)
        return {"explanation": explanation}

    except Exception as e:
        return {
            "explanation": {
                "error": f"Backend crashed: {str(e)}"
            }
        }
