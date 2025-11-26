import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ComplexityResponse } from '../types';

// Constants for limiting graph size
const MAX_DATA_POINTS = 10;
const MAX_N_VALUE = 50; // Cap input size at 50
const MAX_STEPS_VALUE = 1000; // Cap steps at 1000 for better visualization

interface ComplexityChartProps {
  complexity: ComplexityResponse | null;
}

export default function ComplexityChart({ complexity }: ComplexityChartProps) {
  if (!complexity) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-400">
        <div className="text-center">
          <p className="mb-2">No complexity data available</p>
          <p className="text-xs text-slate-500">Click "Analyze" to generate complexity analysis</p>
        </div>
      </div>
    );
  }

  // Limit data points and scale down large values
  const processData = (data: Array<{ n: number; steps: number }>) => {
    if (!data || data.length === 0) {
      return [
        { n: 1, steps: 1, type: 'Time' },
        { n: 5, steps: 5, type: 'Time' },
        { n: 10, steps: 10, type: 'Time' },
      ];
    }

    // Filter and limit data points
    let processed = data
      .filter((point) => point.n <= MAX_N_VALUE) // Only show up to n=50
      .slice(0, MAX_DATA_POINTS) // Limit to 10 points max
      .map((point) => ({
        n: Math.min(point.n || 0, MAX_N_VALUE),
        steps: Math.min(point.steps || 0, MAX_STEPS_VALUE), // Cap steps
        type: 'Time',
      }));

    // If no data after filtering, use fallback
    if (processed.length === 0) {
      processed = [
        { n: 1, steps: 1, type: 'Time' },
        { n: 10, steps: 10, type: 'Time' },
        { n: 20, steps: 20, type: 'Time' },
      ];
    }

    return processed;
  };

  const timeData = processData(complexity.time_data || []).map((d) => ({
    n: d.n,
    steps: d.steps,
    type: 'Time',
  }));
  const spaceData = processData(complexity.space_data || []).map((d) => ({
    n: d.n,
    steps: d.steps,
    type: 'Space',
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Complexity Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:border-cyan-300/90 hover:ring-2 hover:ring-cyan-400/70 hover:shadow-[0_55px_130px_rgba(6,182,212,0.45)]">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <span>⏱️</span>
            <span>Time Complexity</span>
          </h3>
          <p className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-3xl font-bold text-transparent">
            {complexity.time_complexity || 'Unknown'}
          </p>
          <p className="text-xs leading-relaxed text-slate-300">
            {complexity.time_explanation || 'No explanation available'}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-5 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:border-emerald-300/90 hover:ring-2 hover:ring-emerald-400/70 hover:shadow-[0_55px_130px_rgba(16,185,129,0.45)]">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <span>💾</span>
            <span>Space Complexity</span>
          </h3>
          <p className="mb-2 bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-3xl font-bold text-transparent">
            {complexity.space_complexity || 'Unknown'}
          </p>
          <p className="text-xs leading-relaxed text-slate-300">
            {complexity.space_explanation || 'No explanation available'}
          </p>
        </div>
      </div>

      {/* Two Separate Charts with Glowing Lines */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Time Complexity Chart with Glowing Cyan Line */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/70 to-slate-950/60 p-5 shadow-xl shadow-cyan-500/10 transition-all duration-300 hover:border-cyan-300/90 hover:ring-2 hover:ring-cyan-400/70 hover:shadow-[0_65px_150px_rgba(6,182,212,0.5)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-cyan-100">
              <span>⏱️</span>
              <span>Time Complexity</span>
            </h3>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
              n≤{MAX_N_VALUE}
            </span>
          </div>
          {timeData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-500">
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={timeData} 
                  margin={{ top: 15, right: 20, left: 10, bottom: 15 }}
                >
                  <defs>
                    <filter id="glow-cyan">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="timeLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#334155" 
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="n" 
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                    tick={{ fill: '#cbd5e1' }}
                    label={{ 
                      value: 'Input Size (n)', 
                      position: 'insideBottom', 
                      offset: -5,
                      style: { fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }
                    }}
                    domain={[0, MAX_N_VALUE]}
                    type="number"
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                    tick={{ fill: '#cbd5e1' }}
                    label={{ 
                      value: 'Operations', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }
                    }}
                    domain={[0, MAX_STEPS_VALUE]}
                    type="number"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(6, 182, 212, 0.5)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      padding: '10px',
                      boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
                    }}
                    labelStyle={{
                      color: '#06b6d4',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                    formatter={(value: number) => [value.toLocaleString(), '⏱️ Operations']}
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="url(#timeLineGradient)"
                    strokeWidth={4}
                    dot={{ 
                      fill: '#06b6d4', 
                      r: 6, 
                      strokeWidth: 3, 
                      stroke: '#0e7490',
                      filter: 'url(#glow-cyan)'
                    }}
                    activeDot={{ 
                      r: 8, 
                      fill: '#06b6d4',
                      stroke: '#3b82f6',
                      strokeWidth: 2,
                      filter: 'url(#glow-cyan)'
                    }}
                    style={{ filter: 'url(#glow-cyan)' }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Space Complexity Chart with Glowing Green Line */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/70 to-slate-950/60 p-5 shadow-xl shadow-emerald-500/10 transition-all duration-300 hover:border-emerald-300/90 hover:ring-2 hover:ring-emerald-400/70 hover:shadow-[0_65px_150px_rgba(16,185,129,0.5)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-100">
              <span>💾</span>
              <span>Space Complexity</span>
            </h3>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
              n≤{MAX_N_VALUE}
            </span>
          </div>
          {spaceData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-500">
              <p className="text-sm">No data available</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={spaceData} 
                  margin={{ top: 15, right: 20, left: 10, bottom: 15 }}
                >
                  <defs>
                    <filter id="glow-green">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    <linearGradient id="spaceLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#34d399" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#334155" 
                    opacity={0.3}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="n" 
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                    tick={{ fill: '#cbd5e1' }}
                    label={{ 
                      value: 'Input Size (n)', 
                      position: 'insideBottom', 
                      offset: -5,
                      style: { fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }
                    }}
                    domain={[0, MAX_N_VALUE]}
                    type="number"
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={11}
                    fontWeight={500}
                    tick={{ fill: '#cbd5e1' }}
                    label={{ 
                      value: 'Operations', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#94a3b8', fontSize: '11px', fontWeight: 600 }
                    }}
                    domain={[0, MAX_STEPS_VALUE]}
                    type="number"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      padding: '10px',
                      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                    }}
                    labelStyle={{
                      color: '#10b981',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                    formatter={(value: number) => [value.toLocaleString(), '💾 Memory']}
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="url(#spaceLineGradient)"
                    strokeWidth={4}
                    dot={{ 
                      fill: '#10b981', 
                      r: 6, 
                      strokeWidth: 3, 
                      stroke: '#059669',
                      filter: 'url(#glow-green)'
                    }}
                    activeDot={{ 
                      r: 8, 
                      fill: '#10b981',
                      stroke: '#34d399',
                      strokeWidth: 2,
                      filter: 'url(#glow-green)'
                    }}
                    style={{ filter: 'url(#glow-green)' }}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

