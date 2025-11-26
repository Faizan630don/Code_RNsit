import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY in environment")

client = Groq(api_key=GROQ_API_KEY)


def groq_generate_explanation(code: str, language: str = "python") -> str:
    """
    Sends code to Groq LLM and returns a natural language explanation.
    """

    system_prompt = (
        "You are an expert AI code explainer. "
        "Your job is to break down code step-by-step in simple human language. "
        "Always explain WHAT the code does and WHY."
    )

    user_prompt = f"""
Explain the following {language} code in clear, simple steps.
Include:
- What the function/program does
- Explanation of each important line
- Any edge cases or improvements

Here is the code:

```{language}
{code}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"GROQ error: {str(e)}"
