from groq import Groq

client = Groq(api_key="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")

resp = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {"role": "user", "content": "Explain this code: def add(a,b): return a+b"}
    ]
)

print(resp.choices[0].message.content)
