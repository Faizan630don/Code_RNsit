# AI Code Analyzer - Hackathon Edition

A modern, dark-mode React + TypeScript frontend for the AI-Powered Code Documentation & Analysis Tool.

## 🚀 Features

- **Monaco Editor** - Professional code editor with syntax highlighting
- **Interactive Flowcharts** - Visualize code flow with ReactFlow
- **Complexity Analysis** - Time & Space complexity charts with Recharts
- **AI Refactoring** - Get AI-powered code improvement suggestions
- **Auto Docstrings** - Generate documentation automatically
- **Dark Mode** - Futuristic hacker aesthetic with neon accents
- **Demo Mode** - Works even when backend is offline

## 🛠️ Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** - Dark mode styling
- **Monaco Editor** - Code input
- **ReactFlow** - Flowchart visualization
- **Recharts** - Complexity charts
- **Axios** - API client
- **React Hot Toast** - Notifications

## 📦 Installation

```bash
npm install
```

## 🏃 Running

```bash
# Start dev server
npm run dev

# Build for production
npm run build
```

## 🔌 Backend Integration

The frontend connects to the FastAPI backend at `http://127.0.0.1:8000` by default.

Set `VITE_API_URL` in `.env` to change the backend URL:

```env
VITE_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
src/
├── api/
│   ├── client.ts          # Axios API client
│   └── mockData.ts        # Demo mode fallback data
├── components/
│   ├── CodeInput.tsx      # Monaco editor component
│   ├── FlowchartVisualizer.tsx  # ReactFlow flowchart
│   ├── ComplexityChart.tsx      # Recharts complexity graphs
│   ├── RefactorPanel.tsx        # Refactoring suggestions
│   └── DocstringPanel.tsx       # Generated docstrings
├── types.ts               # TypeScript types matching backend
├── App.tsx                # Main application component
└── main.tsx               # Entry point
```

## 🎨 Features Breakdown

### 1. Code Input (Left Pane - 40%)
- Monaco Editor with dark theme
- Syntax highlighting
- Analyze button

### 2. Results Panel (Right Pane - 60%)
- **Flow & Explain Tab**: Interactive flowchart + explanation
- **Complexity Tab**: Time/Space complexity charts
- **Refactor Tab**: Issues list + code comparison
- **Docs Tab**: Generated docstring

### 3. Backend API Calls
All 4 endpoints called in parallel:
- `/api/explain` - Flowchart + explanation
- `/api/complexity` - Complexity analysis
- `/api/refactor` - Refactoring suggestions
- `/api/docstring` - Documentation generation

## 🎯 Hackathon Highlights

- ✅ Full TypeScript type safety
- ✅ Parallel API calls for speed
- ✅ Beautiful dark mode UI
- ✅ Interactive visualizations
- ✅ Error handling with fallbacks
- ✅ Demo mode for offline testing
- ✅ Responsive design

## 🐛 Troubleshooting

**Backend not connecting?**
- Check if FastAPI server is running on port 8000
- Frontend will automatically use demo mode

**TypeScript errors?**
- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` configuration

**Monaco Editor not loading?**
- Ensure `@monaco-editor/react` is installed
- Check browser console for errors

## 📝 License

Hackathon Project - Built for Code Analysis Competition
