# Code Analyzer Backend

FastAPI backend for the CodeAnalyzer.ai frontend application.

## Setup

### 1. Install Dependencies

```bash
cd BACKEND/ai-doc-gen
python3 -m pip install --user fastapi "uvicorn[standard]" groq python-dotenv pydantic
```

Or install from requirements.txt:
```bash
python3 -m pip install --user -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `ai-doc-gen` directory:

```bash
GROQ_API_KEY=your_actual_groq_api_key_here
```

Get your Groq API key from: https://console.groq.com/

### 3. Start the Server

**Option 1: Using the startup script**
```bash
./start_server.sh
```

**Option 2: Using Python module**
```bash
python3 -m uvicorn backend.main:app --reload --port 8000
```

**Option 3: If uvicorn is in your PATH**
```bash
uvicorn backend.main:app --reload --port 8000
```

The server will start on `http://localhost:8000`

## API Endpoints

- `GET /api/ping` - Health check
- `POST /api/explain` - Explain code and generate flowchart
- `POST /api/refactor` - Refactor code with AI suggestions
- `POST /api/complexity` - Analyze time/space complexity
- `POST /api/docstring` - Generate docstrings

## Troubleshooting

### "uvicorn: command not found"

Use `python3 -m uvicorn` instead of just `uvicorn`:
```bash
python3 -m uvicorn backend.main:app --reload --port 8000
```

### API Key Issues

#### "Invalid API Key" or "401 Error"

If you see `Error code: 401 - Invalid API Key`:

1. **Get your API key:**
   - Visit https://console.groq.com/keys
   - Create a new API key or copy an existing one

2. **Update .env file:**
   ```bash
   cd BACKEND/ai-doc-gen
   echo "GROQ_API_KEY=your_actual_api_key_here" > .env
   ```

3. **Verify the key:**
   ```bash
   python3 check_api_key.py
   ```

4. **Restart the backend:**
   ```bash
   ./stop_server.sh
   ./start_server.sh
   ```

#### "GROQ_API_KEY not found"

Make sure you have a `.env` file in the `ai-doc-gen` directory with:
```
GROQ_API_KEY=your_actual_api_key
```

### Port already in use

**Option 1: Stop existing server**
```bash
./stop_server.sh
```

Or manually:
```bash
lsof -ti:8000 | xargs kill -9
```

**Option 2: Use a different port**
```bash
python3 -m uvicorn backend.main:app --reload --port 8001
```

Then update the frontend `.env` file to point to the new port.

## Development

The server runs with `--reload` flag, so it will automatically restart when you make changes to the code.

