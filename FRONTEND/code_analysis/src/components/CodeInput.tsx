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
    <div className="relative h-full flex flex-col bg-slate-900 border-r border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-cyan-500/20">
        <h2 className="text-lg font-semibold text-cyan-400">Code Editor</h2>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Analyze
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
          className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/50 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </button>
      </div>
    </div>
  );
}

