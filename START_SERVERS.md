# 🚀 Quick Start Guide

## Both Servers Are Running!

### Access Your Application

**Frontend (React):**
- Open in browser: **http://localhost:5173**
- Alternative: http://localhost:5174

**Backend (FastAPI):**
- API Base: **http://localhost:8000**
- Health Check: http://localhost:8000/api/ping

### ⚠️ Important: Add Your Groq API Key

The backend needs a Groq API key to analyze code. 

1. Get your API key from: https://console.groq.com/
2. Edit the file: `BACKEND/ai-doc-gen/.env`
3. Replace `GROQ_API_KEY=your_key_here` with your actual key
4. Restart the backend:
   ```bash
   cd BACKEND/ai-doc-gen
   ./stop_server.sh
   python3 -m uvicorn backend.main:app --reload --port 8000
   ```

### Stop Servers

**Backend:**
```bash
cd BACKEND/ai-doc-gen
./stop_server.sh
```

**Frontend:**
Press `Ctrl+C` in the terminal where it's running, or:
```bash
lsof -ti:5173,5174,5175 | xargs kill -9
```

### Restart Servers

**Backend:**
```bash
cd BACKEND/ai-doc-gen
python3 -m uvicorn backend.main:app --reload --port 8000
```

**Frontend:**
```bash
cd FRONTEND/code_analysis
npm run dev
```

### Troubleshooting

**If frontend shows "Backend not connected":**
- Check backend is running: `curl http://localhost:8000/api/ping`
- Check CORS is enabled (already configured)
- Check browser console for errors

**If API calls fail:**
- Verify Groq API key is set correctly
- Check backend logs for errors
- Ensure backend is running on port 8000

