import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

# Load .env
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY not found in environment.")

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)


def _get_groq_response(prompt: str, json_mode: bool = False) -> str:
    """Helper to send requests to Groq"""
    try:
        if not GROQ_API_KEY:
            error_msg = "GROQ_API_KEY is not configured. Please set it in your .env file."
            if json_mode:
                return json.dumps({"error": error_msg, "error_type": "missing_api_key"})
            return error_msg
        
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1 if json_mode else 0.2,
            response_format={"type": "json_object"} if json_mode else None
        )
        return response.choices[0].message.content
    except Exception as e:
        error_str = str(e)
        # Check for API key errors
        if "invalid_api_key" in error_str.lower() or "401" in error_str or "Invalid API Key" in error_str:
            error_msg = "Invalid or expired GROQ_API_KEY. Please check your API key in the .env file."
            if json_mode:
                return json.dumps({"error": error_msg, "error_type": "invalid_api_key"})
            return error_msg
        # Generic error
        if json_mode:
            return json.dumps({"error": error_str, "error_type": "api_error"})
        return f"Error: {error_str}"


def groq_generate_explanation(code: str, language: str = "auto") -> str:
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
    return _get_groq_response(prompt)


def groq_generate_docstring(code: str, style: str = "auto") -> str:
    prompt = f"""
    You are a technical documentation expert.
    Generate a comprehensive docstring/documentation comment for the following code.
    
    Rules:
    1. Detect the language automatically.
    2. Use the standard convention for that language (e.g., Python -> Google Style string, JS -> JSDoc, Java -> Javadoc).
    3. If style is '{style}', try to respect it.
    4. Include @param (or Args), @return (or Returns), and a summary.
    5. Output ONLY the docstring, no extra text.
    
    Code:
    ```
    {code}
    ```
    """
    return _get_groq_response(prompt)


def groq_refactor_code(code: str) -> dict:
    prompt = f"""
    You are a Senior Software Engineer conducting a code review.
    Analyze the following code for:
    1. Code Smells (bad practices, unreadable code)
    2. Security Vulnerabilities (injection, weak crypto)
    3. Performance Issues (O(n^2) loops, redundant calls)
    
    Return a JSON object with this EXACT structure:
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
    
    response_text = _get_groq_response(prompt, json_mode=True)
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {
            "language_detected": "unknown",
            "issues": [{"type": "Error", "description": "Failed to parse AI response", "severity": "High"}],
            "refactored_code": code
        }


def groq_analyze_complexity(code: str) -> dict:
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

    Code:
    ```
    {code}
    ```
    """
    
    response_text = _get_groq_response(prompt, json_mode=True)
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

def groq_analyze_line_complexities(code: str) -> dict:
    """
    Analyzes code and assigns a complexity score (1-10) to each line.
    Returns a dictionary: { "line_content": score }
    """
    prompt = f"""
    Analyze the complexity of this code.
    For each line containing control flow (if, for, while, return, etc.), assign a complexity integer (1-10).
    1 = Simple assignment/return.
    3 = Basic condition.
    5+ = Nested loop or complex logic.
    
    Return ONLY a JSON object where keys are the EXACT trimmed lines of code and values are scores.
    Example: {{ "if (x > 5):": 2, "for i in range(10):": 4 }}
    
    Code:
    {code}
    """
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Complexity analysis failed: {e}")
        return {}