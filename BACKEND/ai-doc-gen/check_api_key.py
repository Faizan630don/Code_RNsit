#!/usr/bin/env python3
"""
Quick script to check if GROQ_API_KEY is configured correctly.
"""
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ ERROR: GROQ_API_KEY is not set in .env file")
    print("\n📝 To fix this:")
    print("1. Get your API key from: https://console.groq.com/keys")
    print("2. Add this line to BACKEND/ai-doc-gen/.env:")
    print("   GROQ_API_KEY=your_actual_api_key_here")
    exit(1)

if api_key == "your_groq_api_key_here" or len(api_key) < 20:
    print("⚠️  WARNING: GROQ_API_KEY appears to be a placeholder")
    print("Please set your actual API key in .env file")
    exit(1)

# Test the API key
try:
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Say 'OK'"}],
        max_tokens=5
    )
    print("✅ SUCCESS: API key is valid and working!")
    print(f"   Response: {response.choices[0].message.content}")
except Exception as e:
    error_str = str(e)
    if "invalid_api_key" in error_str.lower() or "401" in error_str:
        print("❌ ERROR: Invalid or expired API key")
        print("\n📝 To fix this:")
        print("1. Get a new API key from: https://console.groq.com/keys")
        print("2. Update BACKEND/ai-doc-gen/.env with:")
        print("   GROQ_API_KEY=your_new_api_key_here")
        print("3. Restart the backend server")
    else:
        print(f"❌ ERROR: {error_str}")
    exit(1)

