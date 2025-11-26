import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DocstringResponse } from '../types';

interface DocstringPanelProps {
  docstring: DocstringResponse | null;
}

export default function DocstringPanel({ docstring }: DocstringPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!docstring) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="mb-2">No docstring data available</p>
          <p className="text-xs text-slate-500">Click "Analyze" to generate docstring</p>
        </div>
      </div>
    );
  }

  const docstringText = docstring.docstring || 'No docstring generated';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(docstringText);
      setCopied(true);
      toast.success('Docstring copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy docstring');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-cyan-400 font-semibold">Generated Docstring</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors border border-cyan-500/30"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="flex-1 p-4 bg-slate-900 rounded-lg border border-cyan-500/20 overflow-auto">
        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
          {docstringText}
        </pre>
      </div>
    </div>
  );
}

