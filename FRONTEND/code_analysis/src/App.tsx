import { useState, useCallback, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Workflow, BarChart3, Code2, FileText, Loader2, History as HistoryIcon, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
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

type HistoryEntry = {
  id: string;
  label: string;
  timestamp: string;
  status: 'success' | 'demo' | 'error';
};

const DEFAULT_HISTORY: HistoryEntry[] = [
  { id: 'main.js', label: 'main.js • primeCheck()', timestamp: '09:12', status: 'demo' },
  { id: 'app.ts', label: 'app.ts • formWizard()', timestamp: '08:44', status: 'success' },
  { id: 'snippets.py', label: 'snippets.py • fibonacci()', timestamp: '07:58', status: 'demo' },
];

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
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const flowchartCaptureRef = useRef<HTMLDivElement | null>(null);
  const complexityCaptureRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

    let runStatus: HistoryEntry['status'] = demoMode ? 'demo' : 'success';
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
        const isApiKeyError =
          errorDetail.includes('API key') ||
          errorDetail.includes('GROQ_API_KEY') ||
          errorDetail.includes('invalid_api_key');
        const isConnectionError =
          errorDetail.includes('not running') ||
          errorDetail.includes('ECONNREFUSED') ||
          errorDetail.includes('Network Error') ||
          errorDetail.includes('Failed to fetch');

        if (isConnectionError) {
          if (backendConnected) {
            toast.error('⚠️ Backend connection lost. Using demo data.', { duration: 5000 });
            setBackendConnected(false);
          }
          setFlowchartData(mockFlowchartResponse);
          setDemoMode(true);
          runStatus = 'demo';
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Please configure GROQ_API_KEY in backend/.env file', { duration: 6000 });
          setFlowchartData(mockFlowchartResponse);
          setDemoMode(true);
          runStatus = 'demo';
        } else if (demoMode) {
          setFlowchartData(mockFlowchartResponse);
        } else {
          toast.error(`Flowchart: ${errorDetail || 'Failed to get flowchart data'}`);
          setFlowchartData(mockFlowchartResponse);
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
          runStatus = 'demo';
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Using demo data for complexity', { duration: 4000 });
          setComplexityData(mockComplexityResponse);
          setDemoMode(true);
          runStatus = 'demo';
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
          runStatus = 'demo';
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Using demo data for refactoring', { duration: 4000 });
          setRefactorData(mockRefactorResponse);
          setDemoMode(true);
          runStatus = 'demo';
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
          runStatus = 'demo';
        } else if (isApiKeyError) {
          toast.error('⚠️ API Key Error: Using demo data for docstring', { duration: 4000 });
          setDocstringData(mockDocstringResponse);
          setDemoMode(true);
          runStatus = 'demo';
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
      runStatus = 'error';

      // Fallback to mock data
      if (demoMode) {
        setFlowchartData(mockFlowchartResponse);
        setComplexityData(mockComplexityResponse);
        setRefactorData(mockRefactorResponse);
        setDocstringData(mockDocstringResponse);
        toast('Using demo data', { icon: '🎭' });
      }
    } finally {
      const snippetTitle =
        code
          .split('\n')
          .find((line) => line.trim())
          ?.trim()
          .slice(0, 48) || 'Untitled snippet';
      const entry: HistoryEntry = {
        id: `run-${Date.now()}`,
        label: snippetTitle,
        timestamp: new Date().toLocaleTimeString(),
        status: runStatus,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 8));
      setIsLoading(false);
    }
  }, [code, demoMode]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'flow', label: 'Flow & Explain', icon: <Workflow className="w-4 h-4" /> },
    { id: 'complexity', label: 'Complexity', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'refactor', label: 'Refactor', icon: <Code2 className="w-4 h-4" /> },
    { id: 'docs', label: 'Docs', icon: <FileText className="w-4 h-4" /> },
  ];

  const historyFeed = history.length ? history : DEFAULT_HISTORY;
  const statusStyles: Record<HistoryEntry['status'], string> = {
    success: 'text-emerald-200 bg-emerald-500/10 border border-emerald-400/30',
    demo: 'text-amber-200 bg-amber-500/10 border border-amber-400/30',
    error: 'text-rose-200 bg-rose-500/10 border border-rose-400/30',
  };
  const pipeline = [
    { label: 'Parsing & flow', active: !!flowchartData },
    { label: 'Complexity modeling', active: !!complexityData },
    { label: 'Refactor insights', active: !!refactorData },
    { label: 'Docstring draft', active: !!docstringData },
  ];
  const panelGlow =
    'rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_25px_60px_rgba(7,89,133,0.25)] transition-all duration-300 hover:shadow-[0_65px_160px_rgba(6,182,212,0.55)] hover:border-cyan-400/70 hover:ring-2 hover:ring-cyan-400/50';
  const tileGlow =
    'rounded-2xl border border-white/10 bg-slate-950/60 transition-all duration-300 shadow-[0_20px_50px_rgba(7,89,133,0.3)] hover:shadow-[0_55px_130px_rgba(6,182,212,0.45)] hover:border-cyan-300/80 hover:ring-2 hover:ring-cyan-400/70';

  const captureSectionImage = useCallback(async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return null;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#020617',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Section capture failed', error);
      return null;
    }
  }, []);

  const handleDownloadReport = useCallback(async () => {
    if (!flowchartData && !complexityData && !refactorData && !docstringData) {
      toast.error('Run an analysis first to generate a report.');
      return;
    }
    setIsExporting(true);
    try {
      const [flowchartImage, complexityImage] = await Promise.all([
        captureSectionImage(flowchartCaptureRef),
        captureSectionImage(complexityCaptureRef),
      ]);

      const lines: string[] = [];
      lines.push(`# AI Code Analyzer Report`);
      lines.push(`Generated: ${new Date().toLocaleString()}`);
      lines.push(`Lines evaluated: ${code.split('\n').length}`);
      lines.push(`Backend status: ${backendConnected ? 'Connected' : 'Demo/Fallback'}`);

      lines.push(`\n## Flow & Explanation`);
      if (flowchartImage) {
        lines.push(`![Flowchart](${flowchartImage})`);
      }
      lines.push(flowchartData?.explanation || 'No flow explanation available.');

      lines.push(`\n## Complexity Analysis`);
      if (complexityImage) {
        lines.push(`![Complexity Graph](${complexityImage})`);
      }
      if (complexityData) {
        lines.push(`- Time Complexity: ${complexityData.time_complexity}`);
        lines.push(`- Space Complexity: ${complexityData.space_complexity}`);
        lines.push(`- Time Notes: ${complexityData.time_explanation}`);
        lines.push(`- Space Notes: ${complexityData.space_explanation}`);
      } else {
        lines.push('No complexity data available.');
      }

      lines.push(`\n## Refactor Suggestions`);
      if (refactorData) {
        const issues = Array.isArray(refactorData.issues) ? refactorData.issues : [];
        if (issues.length) {
          lines.push('### Issues');
          issues.forEach((issue, index) => {
            lines.push(`${index + 1}. [${issue.severity}] ${issue.type} - ${issue.description}`);
          });
        } else {
          lines.push('No issues detected.');
        }
        lines.push('\n### Refactored Code');
        lines.push('```');
        lines.push(refactorData.refactored_code || 'No refactored code available.');
        lines.push('```');
      } else {
        lines.push('No refactor insights available.');
      }

      lines.push(`\n## Documentation`);
      lines.push(docstringData?.docstring || 'Docstring has not been generated.');

      const blob = new Blob([lines.join('\n\n')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-code-report-${Date.now()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report download started.');
    } catch (error) {
      console.error('Report export failed', error);
      toast.error('Failed to build report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [backendConnected, captureSectionImage, code, complexityData, docstringData, flowchartData, refactorData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#e2e8f0',
            border: '1px solid rgba(6,182,212,0.4)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/3 h-80 w-80 rounded-full bg-cyan-500/20 blur-[140px]" />
          <div className="absolute -bottom-20 right-10 h-96 w-96 rounded-full bg-blue-500/20 blur-[160px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-8 lg:px-8 lg:py-10">
          <header className={`${panelGlow} flex flex-wrap items-center justify-between gap-6 px-6 py-6`}>
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">Neon Intelligence</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">AI Code Analyzer</h1>
              <p className="mt-2 text-sm text-slate-400">Flow, complexity, refactor & docs in one control room.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  backendConnected
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-400/50 bg-amber-500/10 text-amber-100'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {backendConnected ? 'Live backend' : 'Demo mode'}
              </span>
              <span
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isLoading ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-100' : 'border-white/20 bg-white/5 text-slate-200'
                }`}
              >
                <Activity className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : 'opacity-70'}`} />
                {isLoading ? 'Analyzing' : 'Idle'}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            {/* History Column */}
            <aside className={`${panelGlow} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <HistoryIcon className="h-4 w-4 text-cyan-300" />
                  History
                </div>
                <span className="text-xs text-slate-400">{history.length ? 'Recent runs' : 'Demo entries'}</span>
              </div>
              <div className="space-y-3 overflow-auto pr-1 custom-scrollbar max-h-[70vh]">
                {historyFeed.map((entry, index) => (
                  <button
                    key={entry.id}
                    className={`${tileGlow} w-full bg-white/5 px-4 py-3 text-left ${index === 0 ? 'ring-1 ring-cyan-400/40' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{entry.label}</p>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${statusStyles[entry.status]}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{entry.timestamp}</p>
                  </button>
                ))}
              </div>
            </aside>

            {/* Main Analyzer Column */}
            <main className="flex flex-col gap-6">
              <div className={`${panelGlow} flex flex-wrap items-center justify-between gap-4 p-5`}>
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Lines</p>
                    <p className="text-2xl font-semibold text-white">{code.split('\n').length}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active tab</p>
                    <p className="text-2xl font-semibold text-white">{tabs.find((t) => t.id === activeTab)?.label}</p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/50 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 px-5 py-2 font-semibold text-white shadow-[0_10px_25px_rgba(6,182,212,0.35)] transition hover:shadow-[0_20px_45px_rgba(6,182,212,0.45)] disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLoading ? 'Analyzing...' : 'Run Analyzer'}
                </button>
              </div>

              <div className="grid gap-6 lg:grid-rows-[minmax(360px,45vh)_minmax(360px,1fr)]">
                <div className="min-h-[360px]">
                  <CodeInput code={code} onCodeChange={setCode} onAnalyze={handleAnalyze} isLoading={isLoading} />
                </div>

                <div className={`${panelGlow} flex min-h-[360px] flex-col gap-4 p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analysis modes</p>
                      <h3 className="text-lg font-semibold text-white">{tabs.find((tab) => tab.id === activeTab)?.label}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                            activeTab === tab.id
                              ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100 shadow-inner shadow-cyan-500/30'
                              : 'border-white/10 text-slate-400 hover:border-cyan-400/40 hover:text-white'
                          }`}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                      <div className={`${tileGlow} flex h-full items-center justify-center`}>
                        <div className="text-center">
                          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-cyan-400" />
                          <p className="text-sm text-slate-300">Crunching AST + AI signals…</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {activeTab === 'flow' && (
                          <div className="space-y-4">
                            <div className={`${tileGlow} p-4`}>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Flow Explorer</p>
                                  <h4 className="text-lg font-semibold text-white">Execution Graph</h4>
                                </div>
                                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                                  {flowchartData?.flowchart?.nodes?.length ?? 0} nodes
                                </span>
                              </div>
                              <div className="mt-4 h-[420px] rounded-2xl border border-white/5 bg-slate-900/60 p-2 transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_35px_90px_rgba(6,182,212,0.35)]">
                                <FlowchartVisualizer
                                  flowchart={flowchartData?.flowchart || null}
                                  explanation={flowchartData?.explanation || ''}
                                />
                              </div>
                            </div>
                            <div className={`${tileGlow} bg-white/5 p-4 text-sm text-slate-200 whitespace-pre-wrap`}>
                              {flowchartData?.explanation || 'Run analysis to generate the walkthrough.'}
                            </div>
                          </div>
                        )}
                        {activeTab === 'complexity' && (
                          <div className={`${tileGlow} p-4`}>
                            <ComplexityChart complexity={complexityData} />
                          </div>
                        )}
                        {activeTab === 'refactor' && (
                          <div className={`${tileGlow} p-4`}>
                            <RefactorPanel refactor={refactorData} />
                          </div>
                        )}
                        {activeTab === 'docs' && (
                          <div className={`${tileGlow} p-4 flex flex-col gap-4`}>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                              <div>
                                <h4 className="text-white font-semibold">Documentation</h4>
                                <p className="text-xs text-slate-400">Latest AI-generated docstring</p>
                              </div>
                              <button
                                onClick={handleDownloadReport}
                                disabled={isExporting}
                                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_10px_30px_rgba(6,182,212,0.5)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isExporting ? 'Preparing…' : 'Download Report'}
                              </button>
                            </div>
                            <DocstringPanel docstring={docstringData} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </main>

            {/* Insight Column */}
            <section className={`${panelGlow} flex flex-col gap-5 p-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Diagnostics</p>
                  <h3 className="text-xl font-semibold text-white">Analysis Status</h3>
                </div>
                <span
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                    isLoading
                      ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-100'
                      : backendConnected
                      ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                      : 'border-amber-400/60 bg-amber-500/10 text-amber-100'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  {isLoading ? 'Running' : backendConnected ? 'Live' : 'Demo'}
                </span>
              </div>

              <div className={`${tileGlow} p-4 space-y-3`}>
                {pipeline.map((step) => (
                  <div key={step.label} className="flex items-center justify-between text-sm text-slate-300">
                    <span>{step.label}</span>
                    <span className={`text-xs ${step.active ? 'text-emerald-300' : 'text-slate-500'}`}>
                      {step.active ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`${tileGlow} p-4`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  Generated Docstring
                </div>
                <div className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm text-slate-200 custom-scrollbar">
                  {docstringData?.docstring || 'Run an analysis to generate documentation guidance.'}
                </div>
              </div>

              <div className={`${tileGlow} p-4`}>
                <div className="flex items-center justify-between text-sm font-semibold text-white">
                  <span>Refactor Issues</span>
                  <span className="text-xs text-slate-400">{refactorData?.issues?.length ?? 0} findings</span>
                </div>
                <div className="mt-3 space-y-3 max-h-52 overflow-auto custom-scrollbar">
                  {refactorData?.issues?.length ? (
                    refactorData.issues.map((issue, idx) => (
                      <div key={`${issue.type}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <p className="text-sm font-semibold text-white">{issue.type}</p>
                        <p className="text-xs text-slate-300">{issue.description}</p>
                        <span className="mt-1 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                          {issue.severity}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Run analysis to populate refactor insights.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className="pointer-events-none absolute -left-[9999px] top-0 h-0 overflow-hidden" aria-hidden="true">
          <div ref={flowchartCaptureRef} className="w-[900px] bg-slate-950 p-6 rounded-3xl">
            {flowchartData ? (
              <FlowchartVisualizer flowchart={flowchartData?.flowchart || null} explanation={flowchartData?.explanation || ''} />
            ) : (
              <p className="text-slate-500 text-sm">Flowchart not available.</p>
            )}
          </div>
          <div ref={complexityCaptureRef} className="w-[900px] bg-slate-950 p-6 rounded-3xl mt-6">
            {complexityData ? (
              <ComplexityChart complexity={complexityData} />
            ) : (
              <p className="text-slate-500 text-sm">Complexity data not available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
