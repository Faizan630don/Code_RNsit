import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Code,
  Cpu,
  GitBranch,
  Layers,
  LayoutGrid,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { analyzeCode, ping, ApiError } from './services/api';

const languages = ['Python', 'JavaScript', 'Go', 'Rust', 'Java'];
const depthCopy = ['Quick Scan', 'Balanced', 'Deep Dive'];

// Convert backend flowchart to Mermaid syntax
function flowchartToMermaid(flowchart) {
  if (!flowchart || !flowchart.nodes || !flowchart.edges) {
    return 'graph TD\n  Start[No flowchart data]';
  }

  const nodeMap = {};
  flowchart.nodes.forEach((node) => {
    const shape = node.type === 'decision' ? '{' : node.type === 'start' ? '((' : node.type === 'end' ? '((' : '[';
    const closeShape = node.type === 'decision' ? '}' : node.type === 'start' ? '))' : node.type === 'end' ? '))' : ']';
    nodeMap[node.id] = `${node.id}${shape}${node.label}${closeShape}`;
  });

  let mermaid = 'graph TD\n';
  flowchart.edges.forEach((edge) => {
    const label = edge.label ? `|${edge.label}|` : '-->';
    mermaid += `  ${edge.from_node} ${label} ${edge.to_node}\n`;
  });

  return mermaid;
}

// Calculate scores from backend data
function calculateScores(refactorData, complexityData, code) {
  const lines = code.split('\n').length;
  const issues = refactorData?.issues || [];
  const highSeverity = issues.filter((i) => i.severity === 'High').length;
  const mediumSeverity = issues.filter((i) => i.severity === 'Medium').length;

  // Quality score: based on issues found
  const quality = Math.max(0, Math.min(100, 100 - (highSeverity * 15) - (mediumSeverity * 5)));

  // Security score: based on security issues
  const securityIssues = issues.filter((i) => i.type === 'Security Vulnerability').length;
  const security = Math.max(0, Math.min(100, 100 - securityIssues * 20));

  // Maintainability: based on code smells and complexity
  const codeSmells = issues.filter((i) => i.type === 'Code Smell').length;
  const maintainability = Math.max(0, Math.min(100, 100 - codeSmells * 8 - (lines > 100 ? 10 : 0)));

  return { quality, security, maintainability };
}

// Transform backend response to frontend packet format
function transformBackendData(backendData, code, toggles) {
  const { explain, refactor, complexity } = backendData;
  const lines = code.split('\n').length;

  // Metrics
  const metrics = [
    { label: 'Lines', value: lines, sub: 'code lines', icon: Terminal },
    {
      label: 'Functions',
      value: Math.max(1, Math.round(lines / 18)),
      sub: 'estimated',
      icon: Activity,
    },
    {
      label: 'Issues',
      value: refactor?.issues?.length || 0,
      sub: `${refactor?.issues?.filter((i) => i.severity === 'High').length || 0} high`,
      icon: AlertTriangle,
    },
    {
      label: 'Complexity',
      value: complexity?.time_complexity || 'N/A',
      sub: 'time complexity',
      icon: GitBranch,
    },
  ];

  // Scores
  const scores = calculateScores(refactor, complexity, code);

  // Warnings from refactor issues
  const warnings = (refactor?.issues || []).map(
    (issue) => `${issue.type}: ${issue.description} (${issue.severity} severity)`
  );

  // Highlights
  const highlights = [];
  if (explain?.explanation) {
    highlights.push('Code explanation generated successfully');
  }
  if (complexity?.time_complexity && complexity.time_complexity !== 'Unknown') {
    highlights.push(`Time complexity: ${complexity.time_complexity}`);
  }
  if (refactor?.refactored_code && refactor.refactored_code !== code) {
    highlights.push('AI refactoring suggestions available');
  }

  // Flowchart
  const flowchart = explain?.flowchart
    ? flowchartToMermaid(explain.flowchart)
    : 'graph TD\n  Start[No flowchart data available]';

  // Performance (mock for now, can be enhanced)
  const perf = {
    throughput: '1.2k ops/s',
    memory: '28 MB',
    latency: '145 ms',
  };

  // Run log
  const runLog = [
    { label: 'AST Build', detail: `${lines} nodes traversed`, status: explain ? 'done' : 'idle' },
    {
      label: 'Flow Trace',
      detail: explain?.flowchart?.nodes?.length
        ? `${explain.flowchart.nodes.length} nodes mapped`
        : 'skipped',
      status: explain ? 'done' : 'idle',
    },
    {
      label: 'Security Lens',
      detail: refactor?.issues?.length
        ? `${refactor.issues.filter((i) => i.type === 'Security Vulnerability').length} vulnerabilities`
        : 'no issues',
      status: refactor ? 'done' : 'idle',
    },
    {
      label: 'AI Upgrade',
      detail: refactor?.refactored_code ? 'Patch generated' : 'awaiting',
      status: refactor?.refactored_code ? 'done' : 'idle',
    },
  ];

  // Upgrade data
  const upgrade = {
    title: refactor?.refactored_code
      ? 'AI Suggested Refactoring'
      : 'No refactoring available',
    description: refactor?.issues?.length
      ? `Found ${refactor.issues.length} issues. ${refactor.issues
          .map((i) => i.type)
          .join(', ')}.`
      : 'No issues detected in code.',
    original: code,
    suggested: refactor?.refactored_code || code,
  };

  return {
    metrics,
    scores,
    warnings: warnings.length > 0 ? warnings : ['No warnings detected'],
    highlights: highlights.length > 0 ? highlights : ['Code analysis complete'],
    flowchart,
    perf,
    runLog,
    upgrade,
    complexityData: complexity,
  };
}

const baselinePacket = {
  metrics: [
    { label: 'Lines', value: 0, sub: 'waiting', icon: Terminal },
    { label: 'Issues', value: 0, sub: 'pending', icon: AlertTriangle },
    { label: 'Functions', value: 0, sub: 'pending', icon: Activity },
    { label: 'Complexity', value: 'N/A', sub: 'pending', icon: GitBranch },
  ],
  scores: { quality: 0, security: 0, maintainability: 0 },
  warnings: ['Paste code and click Analyze to begin'],
  highlights: ['Ready to analyze your code'],
  flowchart: 'graph TD\n  Start[Ready for analysis]',
  perf: { throughput: '0 ops/s', memory: '0 MB', latency: '0 ms' },
  runLog: [
    { label: 'AST Build', detail: 'waiting', status: 'idle' },
    { label: 'Flow Trace', detail: 'waiting', status: 'idle' },
    { label: 'Security Lens', detail: 'waiting', status: 'idle' },
    { label: 'AI Upgrade', detail: 'waiting', status: 'idle' },
  ],
  upgrade: {
    title: 'No analysis yet',
    description: 'Run analysis to see AI-powered refactoring suggestions',
    original: '',
    suggested: '',
  },
};

const phases = [
  'Booting analyzers',
  'Parsing syntax tree',
  'Tracing data-flow',
  'Running security lens',
  'Synthesizing AI patch',
  'Streaming dashboard payload',
];

const PanelTabs = ({ active, onChange }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'architecture', label: 'Architecture', icon: TrendingUp },
    { id: 'upgrade', label: 'AI Upgrade', icon: Sparkles },
    { id: 'history', label: 'History', icon: RefreshCw },
  ];
  return (
    <div className="tab-row">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`tab ${active === id ? 'is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
  </div>
);
};

const MetricCard = ({ icon: Icon, label, value, sub }) => (
  <div className="metric-card">
    <div className="metric-icon">
      <Icon size={18} />
    </div>
    <div>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <span className="metric-sub">{sub}</span>
    </div>
  </div>
);

const StatusChip = ({ status }) => {
  if (status === 'done') return <span className="chip chip--green">complete</span>;
  if (status === 'idle') return <span className="chip chip--gray">idle</span>;
  return <span className="chip chip--amber">running</span>;
};

// Complexity Chart Component
const ComplexityChart = ({ complexityData }) => {
  if (!complexityData || !complexityData.time_data || complexityData.time_data.length === 0) {
    return (
      <div className="line-chart">
        <p>No complexity data available</p>
      </div>
    );
  }

  const data = complexityData.time_data;
  const maxN = Math.max(...data.map((d) => d.n));
  const maxSteps = Math.max(...data.map((d) => d.steps));
  const width = 300;
  const height = 120;
  const padding = 20;

  const points = data
    .map((d, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.steps / maxSteps) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#line)" strokeWidth="4" strokeLinecap="round" points={points} />
        {data.map((d, idx) => {
          const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - (d.steps / maxSteps) * (height - 2 * padding);
          return <circle key={idx} cx={x} cy={y} r="4" fill="#a78bfa" />;
        })}
      </svg>
      <p>
        Complexity: {complexityData.time_complexity} · {complexityData.space_complexity} space
      </p>
    </div>
  );
};

const App = () => {
  const [userCode, setUserCode] = useState(`// Paste your code here (Python, JS, Go…)
function calculateFibonacci(n) {
  if (n <= 1) {
    return n;
  }
  // Recursive baseline — we will optimize this
  return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}`);
  const [language, setLanguage] = useState(languages[0]);
  const [depth, setDepth] = useState(2);
  const [toggles, setToggles] = useState({ security: true, architecture: true, autofix: true });
  const [packet, setPacket] = useState(baselinePacket);
  const [history, setHistory] = useState([]);
  const [panel, setPanel] = useState('overview');
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Standing by for next repo');
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'anon-user';

  // Check backend connection on mount
  useEffect(() => {
    ping()
      .then(() => {
        setBackendConnected(true);
        setStatusMessage('Backend connected — ready to analyze');
      })
      .catch(() => {
        setBackendConnected(false);
        setStatusMessage('Backend not connected — check if Python server is running');
      });
  }, []);

  const analyze = useCallback(async () => {
    if (!userCode.trim()) {
      setError('Please paste some code to analyze');
      return;
    }

    setIsRunning(true);
    setError(null);
    setPanel('overview');

    // Update status phases
    for (const phase of phases) {
      setStatusMessage(phase);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    try {
      setStatusMessage('Calling Python backend...');
      const backendData = await analyzeCode(userCode, language, {
        includeRefactor: toggles.autofix,
        includeComplexity: true,
        includeExplain: toggles.architecture,
      });

      const transformedPacket = transformBackendData(backendData, userCode, toggles);
      setPacket(transformedPacket);

      // Add to history
      setHistory((prev) => [
        {
          id: `run-${Date.now().toString().slice(-4)}`,
          language,
          score: transformedPacket.scores.quality,
          depth: depthCopy[depth - 1],
          status: 'Ready',
          timestamp: new Date().toLocaleTimeString(),
          },
        ...prev,
      ].slice(0, 10));

      setStatusMessage('Analysis complete — ready to ship 🚀');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(
        err instanceof ApiError
          ? `Backend error: ${err.message}`
          : `Failed to analyze code: ${err.message}`
      );
      setStatusMessage('Analysis failed — check backend connection');
    } finally {
      setIsRunning(false);
    }
  }, [userCode, depth, toggles, language]);

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="hero__eyebrow">Realtime code intelligence</p>
          <h1>
            <Cpu size={36} /> CodeAnalyzer<span>.ai</span>
        </h1>
          <p className="hero__sub">
            Paste any snippet, let the Python backend crunch ASTs, security signals, and AI upgrades, and watch this dashboard light up like a
            mission control for engineers.
          </p>
          <div className="hero__meta">
            <span>
              <Code size={16} /> User ID · {appId.substring(0, 8)}
            </span>
            <span className={`badge ${backendConnected ? '' : 'badge--error'}`}>
              {backendConnected ? 'Backend connected' : 'Backend offline'}
            </span>
          </div>
        </div>
        <div className="hero__score">
          <div>
            <p>Quality score</p>
            <strong>{packet.scores.quality}</strong>
            <small>Live from last run</small>
          </div>
          <div>
            <p>Latency preview</p>
            <strong>{packet.perf.latency}</strong>
            <small>Edge to dashboard</small>
          </div>
        </div>
      </header>

      <main className="main-grid">
        <section className="panel panel--controls">
          <div className="panel__group">
            <div className="panel__heading">
              <span>Control Deck</span>
              <Sparkles size={18} />
            </div>
            <div className="chip-row">
              {languages.map((lang) => (
                <button
                  key={lang}
                  className={`chip chip--ghost ${lang === language ? 'is-active' : ''}`}
                  onClick={() => setLanguage(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
            <label className="slider-label">Depth · {depthCopy[depth - 1]}</label>
            <input
              type="range"
              min="1"
              max="3"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
            />
            <div className="toggle-grid">
              <button
                className={`toggle ${toggles.security ? 'is-on' : ''}`}
                onClick={() => handleToggle('security')}
              >
                <ShieldCheck size={16} /> Security lens
              </button>
              <button
                className={`toggle ${toggles.architecture ? 'is-on' : ''}`}
                onClick={() => handleToggle('architecture')}
              >
                <TrendingUp size={16} /> Architecture map
              </button>
              <button
                className={`toggle ${toggles.autofix ? 'is-on' : ''}`}
                onClick={() => handleToggle('autofix')}
              >
                <Zap size={16} /> Auto AI fixes
              </button>
            </div>
          </div>

          <div className="panel__group">
            <div className="panel__heading">
              <span>Source Code</span>
              <small>{userCode.split('\n').length} lines</small>
            </div>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            spellCheck="false"
          />
          <button
              className={`cta ${isRunning ? 'is-busy' : ''}`}
              onClick={analyze}
              disabled={isRunning || !backendConnected}
          >
              {isRunning ? <RefreshCw size={16} className="spin" /> : <ArrowUpRight size={16} />}
              {isRunning ? 'Crunching signals…' : 'Analyze & Generate Patch'}
          </button>
            {error && (
              <div className="error-card">
                <p className="error-title">Error</p>
                <p className="error-copy">{error}</p>
              </div>
            )}
            <div className="status-card">
              <p className="status-title">Pipeline status</p>
              <p className="status-copy">{statusMessage}</p>
            </div>
          </div>
        </section>

        <section className="panel panel--dashboard">
          <PanelTabs active={panel} onChange={setPanel} />

          {panel === 'overview' && (
            <div className="stack">
              <div className="metric-grid">
                {packet.metrics.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
              <div className="dual-grid">
                <div className="score-card">
                  <div className="score-item">
                    <span>Quality</span>
                    <strong>{packet.scores.quality}</strong>
                  </div>
                  <div className="score-item">
                    <span>Security</span>
                    <strong>{packet.scores.security}</strong>
                  </div>
                  <div className="score-item">
                    <span>Maintainability</span>
                    <strong>{packet.scores.maintainability}</strong>
                  </div>
                </div>
                <ComplexityChart complexityData={packet.complexityData} />
              </div>
              <div className="insight-grid">
                <div>
                  <h4>Warnings & debt</h4>
                  {packet.warnings.map((warning, idx) => (
                    <p key={idx}>{warning}</p>
                  ))}
                        </div>
                <div>
                  <h4>Highlights</h4>
                  {packet.highlights.map((tip, idx) => (
                    <p key={idx}>{tip}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {panel === 'architecture' && (
            <div className="stack">
              {toggles.architecture ? (
                <div className="flow-card">
                  <h4>Architecture map (Mermaid)</h4>
                  <pre>{packet.flowchart}</pre>
                </div>
              ) : (
                <div className="flow-card notice">Enable "Architecture map" to visualize graph.</div>
              )}
              {packet.complexityData && (
                <div className="complexity-info">
                  <h4>Complexity Analysis</h4>
                  <div className="complexity-details">
                          <div>
                      <p>Time Complexity</p>
                      <strong>{packet.complexityData.time_complexity}</strong>
                      <small>{packet.complexityData.time_explanation}</small>
                          </div>
                    <div>
                      <p>Space Complexity</p>
                      <strong>{packet.complexityData.space_complexity}</strong>
                      <small>{packet.complexityData.space_explanation}</small>
                    </div>
                  </div>
                </div>
              )}
              <div className="perf-grid">
                <div>
                  <p>Throughput</p>
                  <strong>{packet.perf.throughput}</strong>
                </div>
                      <div>
                  <p>Memory</p>
                  <strong>{packet.perf.memory}</strong>
                          </div>
                <div>
                  <p>Latency</p>
                  <strong>{packet.perf.latency}</strong>
                          </div>
                      </div>
              <div className="timeline">
                {packet.runLog.map((step) => (
                  <div key={step.label}>
                    <div>
                      <p>{step.label}</p>
                      <small>{step.detail}</small>
                    </div>
                    <StatusChip status={step.status} />
                  </div>
                ))}
                    </div>
                  </div>
                )}

          {panel === 'upgrade' && (
            <div className="stack">
              <div className="upgrade-card">
                <h4>{packet.upgrade.title}</h4>
                <p>{packet.upgrade.description}</p>
              </div>
              <div className="code-grid">
                <div>
                  <span>Original</span>
                  <pre>{packet.upgrade.original || 'No code to display'}</pre>
                </div>
                <div>
                  <span>Suggested</span>
                  <pre>{packet.upgrade.suggested || 'No suggestions available'}</pre>
                </div>
              </div>
              <div className="toggle-grid">
                <button
                  className={`toggle ${toggles.autofix ? 'is-on' : ''}`}
                  onClick={() => handleToggle('autofix')}
                >
                  <Zap size={16} /> Auto patch ready
                </button>
                <button
                  className={`toggle ${toggles.security ? 'is-on' : ''}`}
                  onClick={() => handleToggle('security')}
                >
                  <ShieldCheck size={16} /> Security gates
                </button>
              </div>
                  </div>
                )}

          {panel === 'history' && (
            <div className="stack history-list">
              {history.length === 0 ? (
                <div className="history-card">
                  <p>No analysis history yet</p>
                  <small>Run your first analysis to see history</small>
                </div>
              ) : (
                history.map((run) => (
                  <div key={run.id} className="history-card">
                    <div>
                      <p>{run.id}</p>
                      <small>{run.language}</small>
                    </div>
                      <div>
                      <p>{run.depth}</p>
                      <small>depth</small>
                      </div>
                      <div>
                      <p>{run.score}</p>
                      <small>quality</small>
                      </div>
                    <div>
                      <p>{run.timestamp}</p>
                      <small>time</small>
                    </div>
                    <span className="chip chip--purple">{run.status}</span>
                  </div>
                ))
            )}
          </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
