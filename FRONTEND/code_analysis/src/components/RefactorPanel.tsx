import { useState } from 'react';
import { Copy, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RefactorResponse, Severity } from '../types';

interface RefactorPanelProps {
  refactor: RefactorResponse | null;
}

const severityConfig: Record<Severity, { color: string; icon: React.ReactNode; bg: string }> = {
  High: {
    color: 'text-red-400',
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-red-500/10 border-red-500/30',
  },
  Medium: {
    color: 'text-yellow-400',
    icon: <AlertTriangle className="w-4 h-4" />,
    bg: 'bg-yellow-500/10 border-yellow-500/30',
  },
  Low: {
    color: 'text-blue-400',
    icon: <Info className="w-4 h-4" />,
    bg: 'bg-blue-500/10 border-blue-500/30',
  },
};

export default function RefactorPanel({ refactor }: RefactorPanelProps) {
  const [copied, setCopied] = useState(false);

  const detectLanguage = (codeSample: string): string => {
    const snippet = codeSample.slice(0, 500).toLowerCase();
    if (/def\s+\w+\s*\(/.test(codeSample) || /import\s+\w+/.test(snippet) && snippet.includes('self')) return 'Python';
    if (/function\s+\w+\s*\(/.test(codeSample) || /const\s+\w+\s*=\s*\(/.test(codeSample) || snippet.includes('console.log')) return 'JavaScript';
    if (/class\s+\w+\s*{/.test(codeSample) && snippet.includes('public')) return 'Java';
    if (/#include\s+</.test(codeSample) || snippet.includes('std::')) return 'C++';
    if (/package\s+\w+;/.test(codeSample) || /public\s+class/.test(codeSample)) return 'Java';
    return 'Unknown';
  };

  if (!refactor) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="mb-2">No refactoring data available</p>
          <p className="text-xs text-slate-500">Click "Analyze" to get refactoring suggestions</p>
        </div>
      </div>
    );
  }

  // Ensure issues is an array
  const issues = Array.isArray(refactor.issues) ? refactor.issues : [];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refactor.refactored_code);
      setCopied(true);
      toast.success('Refactored code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      {/* Issues List */}
      <div className="flex-shrink-0">
        <h3 className="text-cyan-400 font-semibold mb-3">Issues Found ({issues.length})</h3>
        {issues.length === 0 ? (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-green-500/20 text-green-400 text-center">
            <p className="font-semibold">✨ No issues found!</p>
            <p className="text-sm text-slate-400 mt-1">Your code looks good</p>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, index) => {
            const config = severityConfig[issue.severity];
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${config.bg} ${config.color}`}
              >
                <div className="flex items-start gap-2">
                  {config.icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{issue.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} border ${config.color}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{issue.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Code Comparison */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-cyan-400 font-semibold">Refactored Code</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Original */}
          <div className="flex flex-col">
            <h4 className="text-red-400 font-medium mb-2 text-sm">Original</h4>
            <pre className="flex-1 p-3 bg-slate-900 rounded-lg border border-red-500/20 text-xs text-slate-300 overflow-auto font-mono">
              {refactor.original_code || 'No original code available'}
            </pre>
          </div>

          {/* Refactored */}
          <div className="flex flex-col">
            <h4 className="text-green-400 font-medium mb-2 text-sm">Refactored</h4>
            <pre className="flex-1 p-3 bg-slate-900 rounded-lg border border-green-500/20 text-xs text-slate-300 overflow-auto font-mono">
              {refactor.refactored_code || refactor.original_code || 'No refactored code available'}
            </pre>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Language detected:{' '}
          <span className="text-cyan-400">
            {refactor.language_detected && refactor.language_detected.toLowerCase() !== 'unknown'
              ? refactor.language_detected
              : detectLanguage(refactor.original_code || '')}
          </span>
        </div>
      </div>
    </div>
  );
}

