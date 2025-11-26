import { useState, useCallback, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Workflow, BarChart3, Code2, FileText, Loader2 } from 'lucide-react';
import CodeInput from './components/CodeInput';
import FlowchartVisualizer from './components/FlowchartVisualizer';
import ComplexityChart from './components/ComplexityChart';
import RefactorPanel from './components/RefactorPanel';
import DocstringPanel from './components/DocstringPanel';
import { analyzeCode, getComplexity, refactorCode, generateDocstring, ping } from './api/client';
import {
  mockFlowchartResponse,
  mockComplexityResponse,
  mockRefactorResponse,
  mockDocstringResponse,
} from './api/mockData';
import type {
  FlowchartResponse,
  ComplexityResponse,
  RefactorResponse,
  DocstringResponse,
} from './types';

type Tab = 'flow' | 'complexity' | 'refactor' | 'docs';

export default function App() {
  const [code, setCode] = useState(`function calculateFibonacci(n) {
  if (n <= 1) {
    return n;
  }
  // Recursive baseline — we will optimize this
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}`);

  const [activeTab, setActiveTab] = useState<Tab>('flow');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // API Response States
  const [flowchartData, setFlowchartData] = useState<FlowchartResponse | null>(null);
  const [complexityData, setComplexityData] = useState<ComplexityResponse | null>(null);
  const [refactorData, setRefactorData] = useState<RefactorResponse | null>(null);
  const [docstringData, setDocstringData] = useState<DocstringResponse | null>(null);

  // Check backend connection on mount and periodically
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await ping();
        if (result && (result.status === 'ok' || result.msg)) {
          setBackendConnected(true);
          setDemoMode(false);
          console.log('✅ Backend connected:', result);
        } else {
          throw new Error('Invalid response from backend');
        }
      } catch (error) {
        console.warn('⚠️ Backend connection check failed:', error);
        setBackendConnected(false);
        // Don't show toast on initial load, only show if user tries to analyze
        // setDemoMode(true);
      }
    };
    
    // Check immediately
    checkConnection();
    
    // Check every 5 seconds to keep status updated
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    setIsLoading(true);
    setFlowchartData(null);
    setComplexityData(null);
    setRefactorData(null);
    setDocstringData(null);

    try {
      const request = { code, language: 'auto' };

      // Call all 4 APIs in parallel
      const [flowchartResult, complexityResult, refactorResult, docstringResult] = await Promise.allSettled([
        analyzeCode(request),
        getComplexity(request),
        refactorCode(request),
        generateDocstring(request),
      ]);

      // Handle results with detailed logging
      if (flowchartResult.status === 'fulfilled') {
        console.log('✅ Flowchart data:', flowchartResult.value);
        setFlowchartData(flowchartResult.value);
        // Update connection status if we got a successful response
        if (!backendConnected) {
          setBackendConnected(true);
          setDemoMode(false);
        }
      } else {
        console.error('❌ Flowchart error:', flowchartResult.reason);
        const errorDetail = flowchartResult.reason?.response?.data?.detail || flowchartResult.reason?.message || '';
        const isApiKeyError = errorDetail.includes('API key') || errorDetail.includes('GROQ_API_KEY') || errorDetail.includes('invalid_api_key');
        
        if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Please configure GROQ_API_KEY in backend/.env file', { duration: 6000 });
          setFlowchartData(mockFlowchartResponse);
          setDemoMode(true);
        } else if (demoMode) {
          setFlowchartData(mockFlowchartResponse);
        } else {
          toast.error(`Flowchart: ${errorDetail || 'Failed to get flowchart data'}`);
        }
      }

      if (complexityResult.status === 'fulfilled') {
        console.log('✅ Complexity data:', complexityResult.value);
        // Validate and ensure data structure
        const complexity = complexityResult.value;
        if (!complexity.time_data || complexity.time_data.length === 0) {
          console.warn('⚠️ Empty time_data, using fallback');
        }
        setComplexityData(complexity);
      } else {
        console.error('❌ Complexity error:', complexityResult.reason);
        const errorDetail = complexityResult.reason?.response?.data?.detail || complexityResult.reason?.message || '';
        const isApiKeyError = errorDetail.includes('API key') || errorDetail.includes('GROQ_API_KEY') || errorDetail.includes('invalid_api_key');
        const isConnectionError = errorDetail.includes('not running') || errorDetail.includes('ECONNREFUSED') || errorDetail.includes('Network Error') || errorDetail.includes('Failed to fetch');
        
        if (isConnectionError) {
          if (backendConnected) {
            setBackendConnected(false);
          }
          setComplexityData(mockComplexityResponse);
          setDemoMode(true);
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Using demo data for complexity', { duration: 4000 });
          setComplexityData(mockComplexityResponse);
          setDemoMode(true);
        } else if (demoMode) {
          setComplexityData(mockComplexityResponse);
        } else {
          toast.error(`Complexity: ${errorDetail || 'Failed to get complexity data'}`);
        }
      }

      if (refactorResult.status === 'fulfilled') {
        console.log('✅ Refactor data:', refactorResult.value);
        setRefactorData(refactorResult.value);
      } else {
        console.error('❌ Refactor error:', refactorResult.reason);
        const errorDetail = refactorResult.reason?.response?.data?.detail || refactorResult.reason?.message || '';
        const isApiKeyError = errorDetail.includes('API key') || errorDetail.includes('GROQ_API_KEY') || errorDetail.includes('invalid_api_key');
        const isConnectionError = errorDetail.includes('not running') || errorDetail.includes('ECONNREFUSED') || errorDetail.includes('Network Error') || errorDetail.includes('Failed to fetch');
        
        if (isConnectionError) {
          if (backendConnected) {
            toast.error('⚠️ Backend connection lost. Using demo data.', { duration: 5000 });
            setBackendConnected(false);
          }
          setRefactorData(mockRefactorResponse);
          setDemoMode(true);
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Using demo data for refactoring', { duration: 4000 });
          setRefactorData(mockRefactorResponse);
          setDemoMode(true);
        } else if (demoMode) {
          setRefactorData(mockRefactorResponse);
        } else {
          toast.error(`Refactor: ${errorDetail || 'Failed to get refactoring data'}`);
        }
      }

      if (docstringResult.status === 'fulfilled') {
        console.log('✅ Docstring data:', docstringResult.value);
        setDocstringData(docstringResult.value);
      } else {
        console.error('❌ Docstring error:', docstringResult.reason);
        const errorDetail = docstringResult.reason?.response?.data?.detail || docstringResult.reason?.message || '';
        const isApiKeyError = errorDetail.includes('API key') || errorDetail.includes('GROQ_API_KEY') || errorDetail.includes('invalid_api_key');
        const isConnectionError = errorDetail.includes('not running') || errorDetail.includes('ECONNREFUSED') || errorDetail.includes('Network Error') || errorDetail.includes('Failed to fetch');
        
        if (isConnectionError) {
          if (backendConnected) {
            setBackendConnected(false);
          }
          setDocstringData(mockDocstringResponse);
          setDemoMode(true);
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Using demo data for docstring', { duration: 4000 });
          setDocstringData(mockDocstringResponse);
          setDemoMode(true);
        } else if (demoMode) {
          setDocstringData(mockDocstringResponse);
        } else {
          toast.error(`Docstring: ${errorDetail || 'Failed to get docstring data'}`);
        }
      }

      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Check console for details.');

      // Fallback to mock data
      if (demoMode) {
        setFlowchartData(mockFlowchartResponse);
        setComplexityData(mockComplexityResponse);
        setRefactorData(mockRefactorResponse);
        setDocstringData(mockDocstringResponse);
        toast('Using demo data', { icon: '🎭' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, demoMode]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'flow', label: 'Flow & Explain', icon: <Workflow className="w-4 h-4" /> },
    { id: 'complexity', label: 'Complexity', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'refactor', label: 'Refactor', icon: <Code2 className="w-4 h-4" /> },
    { id: 'docs', label: 'Docs', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #06b6d4',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-cyan-500/20">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            AI Code Analyzer
          </h1>
          <p className="text-xs text-slate-400 mt-1">Hackathon Edition • Powered by FastAPI + React</p>
        </div>
        <div className="flex items-center gap-3">
          {demoMode && !backendConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <span className="text-yellow-400 text-xs font-medium">⚠️ Backend Offline</span>
              <span className="text-yellow-500/70 text-xs">• Using demo data</span>
            </div>
          )}
          {demoMode && backendConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <span className="text-yellow-400 text-xs font-medium">🎭 Demo Mode</span>
              <span className="text-yellow-500/70 text-xs">• API Key needed</span>
            </div>
          )}
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              backendConnected
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            {backendConnected ? '🟢 Connected' : '🔴 Offline'}
          </span>
        </div>
      </header>

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Code Input (40%) */}
        <div className="w-[40%] flex-shrink-0">
          <CodeInput code={code} onCodeChange={setCode} onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Right Pane - Results (60%) */}
        <div className="flex-1 flex flex-col bg-slate-900 border-l border-cyan-500/20">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-800/50 border-b border-cyan-500/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
                  <p className="text-slate-400">Analyzing code...</p>
                  <p className="text-xs text-slate-500 mt-2">This may take a few seconds</p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'flow' && (
                  <FlowchartVisualizer
                    flowchart={flowchartData?.flowchart || null}
                    explanation={flowchartData?.explanation || ''}
                  />
                )}
                {activeTab === 'complexity' && <ComplexityChart complexity={complexityData} />}
                {activeTab === 'refactor' && <RefactorPanel refactor={refactorData} />}
                {activeTab === 'docs' && <DocstringPanel docstring={docstringData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

