import Editor from '@monaco-editor/react';
import { Play, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export default function CodeInput({ code, onCodeChange, onAnalyze, isLoading }: CodeInputProps) {

  const handleEditorChange = (value: string | undefined) => {
    onCodeChange(value || '');
  };

  const handleAnalyze = () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }
    onAnalyze();
  };

  return (
    <div className="relative h-full flex flex-col rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_25px_70px_rgba(6,182,212,0.25)] transition-all duration-300 hover:border-cyan-400/80 hover:ring-2 hover:ring-cyan-400/60 hover:shadow-[0_75px_170px_rgba(6,182,212,0.6)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Input</p>
          <h2 className="text-xl font-semibold text-white">Code Workspace</h2>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 px-5 py-2 font-semibold text-slate-900 shadow-[0_8px_24px_rgba(6,182,212,0.45)] transition-all hover:shadow-[0_20px_45px_rgba(6,182,212,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>

      {/* Floating Analyze Button (Mobile) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-14 h-14 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-[0_20px_45px_rgba(6,182,212,0.55)] flex items-center justify-center transition-all disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
      </div>
    </div>
  );
}

