import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

def _get_gemini_response(prompt: str, json_mode: bool = False) -> str:
    """Helper to send requests to Gemini"""
    try:
        if not GEMINI_API_KEY:
            error_msg = "GEMINI_API_KEY is not configured. Please set it in your .env file."
            if json_mode:
                return json.dumps({"error": error_msg, "error_type": "missing_api_key"})
            return error_msg
        
        # We use gemini-2.5-flash as the fast standard model context window
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        generation_config = genai.types.GenerationConfig(
            temperature=0.1 if json_mode else 0.2,
        )
        if json_mode:
            generation_config.response_mime_type = "application/json"

        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )
        return response.text
    except Exception as e:
        error_str = str(e)
        if "API_KEY_INVALID" in error_str or "unauthenticated" in error_str.lower():
            error_msg = "Invalid or expired GEMINI_API_KEY. Please check your API key in the .env file."
            if json_mode:
                return json.dumps({"error": error_msg, "error_type": "invalid_api_key"})
            return error_msg
        # Generic error
        if json_mode:
            return json.dumps({"error": error_str, "error_type": "api_error"})
        return f"Error: {error_str}"


def gemini_generate_explanation(code: str, language: str = "auto") -> str:
    prompt = f"""
    You are an expert code explainer.
    First, identify the programming language (if 'auto' is passed).
    Then, explain the code logic step-by-step in simple plain English.
    Focus on the flow of execution.
    
    Code:
    ```
    {code}
    ```
    """
    return _get_gemini_response(prompt)


def gemini_generate_docstring(code: str, style: str = "auto") -> str:
    prompt = f"""
    You are a technical documentation expert.
    Generate a comprehensive docstring/documentation comment for the following code.
    
    Rules:
    1. Detect the language automatically.
    2. Use the standard convention for that language (e.g., Python -> Google Style string, JS -> JSDoc, Java -> Javadoc).
    3. If style is '{style}', try to respect it.
    4. Include @param (or Args), @return (or Returns), and a summary.
    5. Output ONLY the docstring, no extra text formatting around the docstring.
    
    Code:
    ```
    {code}
    ```
    """
    return _get_gemini_response(prompt)


def gemini_refactor_code(code: str) -> dict:
    prompt = f"""
    You are a Senior Software Engineer conducting a code review.
    Analyze the following code for:
    1. Code Smells (bad practices, unreadable code)
    2. Security Vulnerabilities (injection, weak crypto)
    3. Performance Issues (O(n^2) loops, redundant calls)
    
    Return a JSON object with this EXACT structure (No markdown tags, just pure JSON):
    {{
        "language_detected": "string",
        "issues": [
            {{ "type": "Code Smell", "description": "Short description", "severity": "Medium" }}
        ],
        "refactored_code": "The complete improved code string"
    }}
    
    Code:
    ```
    {code}
    ```
    """
    
    response_text = _get_gemini_response(prompt, json_mode=True)
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {
            "language_detected": "unknown",
            "issues": [{"type": "Error", "description": "Failed to parse AI response", "severity": "High"}],
            "refactored_code": code
        }


def gemini_analyze_complexity(code: str) -> dict:
    prompt = f"""
    Analyze the Time and Space complexity of the following code.
    
    Return a JSON object with:
    1. "time_complexity": The Big O notation (e.g., "O(n log n)")
    2. "space_complexity": The Big O notation (e.g., "O(n)")
    3. "time_explanation": Brief explanation why.
    4. "space_explanation": Brief explanation why.
    5. "time_data": A list of 5-10 points {{ "n": int, "steps": int }} representing the growth curve. 
       - For O(1), steps should be constant.
       - For O(n), steps should grow linearly.
       - For O(n^2), steps should grow quadratically.
       - Use n values: 1, 5, 10, 20, 50, 100.
    6. "space_data": A list of 5-10 points {{ "n": int, "steps": int }} for memory usage.

    Output pure JSON without markdown tags.

    Code:
    ```
    {code}
    ```
    """
    
    response_text = _get_gemini_response(prompt, json_mode=True)
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {
            "time_complexity": "Unknown",
            "space_complexity": "Unknown",
            "time_explanation": "Could not analyze",
            "space_explanation": "Could not analyze",
            "time_data": [],
            "space_data": []
        }

def gemini_analyze_line_complexities(code: str) -> dict:
    prompt = f"""
    Analyze the complexity of this code.
    For each line containing control flow (if, for, while, return, etc.), assign a complexity integer (1-10).
    1 = Simple assignment/return.
    3 = Basic condition.
    5+ = Nested loop or complex logic.
    
    Return ONLY a JSON object where keys are the EXACT trimmed lines of code and values are scores.
    Output pure JSON without markdown tags.
    Example: {{ "if (x > 5):": 2, "for i in range(10):": 4 }}
    
    Code:
    {code}
    """
    
    try:
        response_text = _get_gemini_response(prompt, json_mode=True)
        return json.loads(response_text)
    except Exception as e:
        print(f"Complexity analysis failed: {e}")
        return {}

