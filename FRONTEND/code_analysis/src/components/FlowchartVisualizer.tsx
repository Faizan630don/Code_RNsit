import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ReactFlowProvider,
  Position,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import type { Flowchart } from '../types';

interface FlowchartVisualizerProps {
  flowchart: Flowchart | null;
  explanation: string;
}

const MAX_LABEL_CHARS = 28;

const formatLabel = (label: string) => {
  if (!label) return '';
  if (label.length <= MAX_LABEL_CHARS) return label;
  const words = label.split(' ');
  let chunk = '';
  const lines: string[] = [];
  words.forEach((word) => {
    if ((chunk + word).length > MAX_LABEL_CHARS) {
      lines.push(chunk.trim());
      chunk = '';
    }
    chunk += `${word} `;
  });
  if (chunk.trim()) lines.push(chunk.trim());
  return lines.join('\n');
};

// Custom Diamond Node for decisions - Beautiful neon design
const DiamondNode = ({ data }: { data: { label: string; complexity_score: number } }) => {
  const isHighComplexity = data.complexity_score > 5;
  const borderColor = isHighComplexity ? '#f87171' : '#22d3ee';
  const glowColor = isHighComplexity ? 'rgba(248, 113, 113, 0.8)' : 'rgba(34, 211, 238, 0.8)';
  const bgGradient =
    'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(30, 41, 59, 0.9))';
  const size = 130;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        filter: `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 30px ${glowColor})`,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          background: bgGradient,
          border: `4px solid ${borderColor}`,
          transform: 'rotate(45deg)',
          position: 'absolute',
          boxShadow: `
            0 0 25px ${glowColor},
            0 0 40px ${glowColor},
            inset 0 0 15px ${glowColor},
            inset 0 0 25px rgba(255, 255, 255, 0.1)
          `,
          borderRadius: '8px',
        }}
      />
      <div
        style={{
          transform: 'rotate(-45deg)',
          color: '#f1f5f9',
          fontSize: '12px',
          fontWeight: '700',
          textAlign: 'center',
          padding: '12px',
          position: 'relative',
          zIndex: 1,
          maxWidth: size,
          wordBreak: 'break-word',
          textShadow: `0 0 12px ${glowColor}, 0 0 20px ${glowColor}`,
          lineHeight: '1.4',
        }}
      >
        {formatLabel(data.label)}
      </div>
    </div>
  );
};

// Custom Start/End Node - Stunning neon design
const TerminalNode = ({ data }: { data: { label: string; type: string } }) => {
  const isStart = data.type === 'start';
  const bgGradient = isStart 
    ? 'linear-gradient(135deg, #a855f7, #7c3aed, #6d28d9)'
    : 'linear-gradient(135deg, #f87171, #ef4444, #dc2626)';
  const glowColor = isStart ? 'rgba(168, 85, 247, 0.9)' : 'rgba(248, 113, 113, 0.9)';
  const borderColor = isStart ? '#9333ea' : '#f87171';
  
  return (
    <div
      className="terminal-node"
      style={{
        padding: '16px 28px',
        background: bgGradient,
        color: '#ffffff',
        borderRadius: '28px',
        fontWeight: '800',
        fontSize: '15px',
        letterSpacing: '0.5px',
        border: `3px solid ${borderColor}`,
        boxShadow: `
          0 0 25px ${glowColor},
          0 0 40px ${glowColor},
          0 0 60px ${glowColor},
          inset 0 0 20px rgba(255, 255, 255, 0.15),
          inset 0 2px 4px rgba(255, 255, 255, 0.2)
        `,
        textShadow: `
          0 0 10px rgba(0, 0, 0, 0.8),
          0 2px 4px rgba(0, 0, 0, 0.5),
          0 0 20px ${glowColor}
        `,
        filter: `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 20px ${glowColor})`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
          transition: 'left 0.5s ease',
        }}
        className="shimmer-effect"
      />
      {formatLabel(data.label)}
    </div>
  );
};

// Custom Process Node - Beautiful neon design with complexity-based colors
const ProcessNode = ({ data }: { data: { label: string; complexity_score: number } }) => {
  const isHighComplexity = data.complexity_score > 5;
  const isMediumComplexity = data.complexity_score > 3;
  
  // Enhanced color scheme: Red for high, Purple for medium, Cyan for low
  let borderColor, glowColor, bgGradient, textColor;
  if (isHighComplexity) {
    borderColor = '#f87171';
    glowColor = 'rgba(248, 113, 113, 0.8)';
    bgGradient = 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(30, 41, 59, 0.92))';
    textColor = '#fecaca';
  } else if (isMediumComplexity) {
    borderColor = '#a855f7';
    glowColor = 'rgba(168, 85, 247, 0.8)';
    bgGradient = 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(30, 41, 59, 0.92))';
    textColor = '#e9d5ff';
  } else {
    borderColor = '#22d3ee';
    glowColor = 'rgba(34, 211, 238, 0.8)';
    bgGradient = 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(30, 41, 59, 0.92))';
    textColor = '#cffafe';
  }

  return (
    <div
      className="process-node"
      style={{
        padding: '16px 24px',
        background: bgGradient,
        color: textColor,
        borderRadius: '14px',
        border: `3px solid ${borderColor}`,
        fontWeight: '700',
        fontSize: '14px',
        letterSpacing: '0.3px',
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: `
          0 0 20px ${glowColor},
          0 0 35px ${glowColor},
          0 0 50px ${glowColor},
          inset 0 0 15px rgba(255, 255, 255, 0.08),
          inset 0 2px 4px rgba(255, 255, 255, 0.1)
        `,
        textShadow: `
          0 0 10px ${glowColor},
          0 0 20px ${glowColor},
          0 2px 4px rgba(0, 0, 0, 0.5)
        `,
        filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 15px ${glowColor})`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        lineHeight: '1.5',
      }}
    >
      {formatLabel(data.label)}
    </div>
  );
};

const nodeTypes = {
  diamond: DiamondNode,
  terminal: TerminalNode,
  process: ProcessNode,
};

function getLayoutedElements(flowchart: Flowchart) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 110, ranksep: 140, marginx: 80, marginy: 80 });

  const nodes: Node[] = flowchart.nodes.map((node) => {
    let nodeType = 'process';
    if (node.type === 'decision') nodeType = 'diamond';
    if (node.type === 'start' || node.type === 'end') nodeType = 'terminal';

    let sourcePosition: Position = Position.Bottom;
    let targetPosition: Position = Position.Top;

    if (nodeType === 'terminal' && node.type === 'start') {
      targetPosition = Position.Bottom;
      sourcePosition = Position.Bottom;
    } else if (nodeType === 'terminal' && node.type === 'end') {
      targetPosition = Position.Top;
      sourcePosition = Position.Top;
    } else if (nodeType === 'diamond') {
      sourcePosition = Position.Bottom;
      targetPosition = Position.Top;
    } else {
      sourcePosition = Position.Bottom;
      targetPosition = Position.Top;
    }

    return {
      id: node.id,
      type: nodeType,
      data: { label: node.label, type: node.type, complexity_score: node.complexity_score },
      position: { x: 0, y: 0 },
      sourcePosition,
      targetPosition,
    };
  });

  const edges: Edge[] = flowchart.edges.map((edge) => ({
    id: `${edge.from_node}-${edge.to_node}`,
    source: edge.from_node,
    target: edge.to_node,
    label: edge.label || '',
    type: 'step',
    markerEnd: { 
      type: MarkerType.ArrowClosed,
      color: '#22d3ee',
      width: 24,
      height: 24,
      },
    style: { 
      stroke: 'rgba(34, 211, 238, 0.95)',
      strokeWidth: 5,
      strokeLinejoin: 'round',
      strokeLinecap: 'round',
      filter: `
        drop-shadow(0 0 6px rgba(34, 211, 238, 1))
        drop-shadow(0 0 12px rgba(34, 211, 238, 0.8))
        drop-shadow(0 0 18px rgba(34, 211, 238, 0.6))
      `,
    },
    labelStyle: { 
      fill: '#22d3ee', 
      fontWeight: 800,
      fontSize: '13px',
      textShadow: `
        0 0 10px rgba(34, 211, 238, 1),
        0 0 20px rgba(34, 211, 238, 0.8)
      `,
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      padding: '6px 12px',
      borderRadius: '8px',
      border: '2px solid rgba(34, 211, 238, 0.6)',
      boxShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
    },
    animated: true,
    animatedStrokeWidth: 4,
  }));

  nodes.forEach((node) => {
    // Set different sizes based on node type - larger for better visibility
    if (node.type === 'diamond') {
      g.setNode(node.id, { width: 150, height: 150 });
    } else if (node.type === 'terminal') {
      g.setNode(node.id, { width: 190, height: 80 });
    } else {
      g.setNode(node.id, { width: 200, height: 90 });
    }
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach((node) => {
    const nodeWithPosition = g.node(node.id);
    let offsetX = 75;
    let offsetY = 40;
    
    if (node.type === 'diamond') {
      offsetX = 75;
      offsetY = 75;
    } else if (node.type === 'terminal') {
      offsetX = 95;
      offsetY = 40;
    } else {
      offsetX = 100;
      offsetY = 45;
    }
    
    node.position = {
      x: nodeWithPosition.x - offsetX,
      y: nodeWithPosition.y - offsetY,
    };
  });

  return { nodes, edges };
}

export default function FlowchartVisualizer({ flowchart, explanation }: FlowchartVisualizerProps) {
  const { nodes, edges } = useMemo(() => {
    if (!flowchart) return { nodes: [], edges: [] };
    return getLayoutedElements(flowchart);
  }, [flowchart]);

  const defaultEdgeOptions = {
    type: ConnectionLineType.Step,
    animated: true,
    style: {
      stroke: 'rgba(34, 211, 238, 0.95)',
      strokeWidth: 5,
    },
  };

  if (!flowchart) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <p>No flowchart data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar">
      {/* Flowchart - Stunning neon design */}
      <div className="flex-shrink-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-cyan-500/40 overflow-hidden shadow-2xl" style={{ 
        height: '550px', 
        minHeight: '450px',
        boxShadow: `
          0 0 40px rgba(34, 211, 238, 0.3),
          0 0 80px rgba(34, 211, 238, 0.2),
          inset 0 0 60px rgba(34, 211, 238, 0.05)
        `,
      }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.4, maxZoom: 2, minZoom: 0.4 }}
            className="bg-transparent"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll={false}
            zoomOnScroll={false}
            preventScrolling={true}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={ConnectionLineType.Step}
            connectionLineStyle={{
              stroke: 'rgba(34, 211, 238, 0.7)',
              strokeWidth: 4,
            }}
          >
            <Background 
              color="#0f172a" 
              gap={24}
              size={1.5}
              style={{ opacity: 0.4 }}
            />
            <Controls 
              className="bg-slate-900/98 border-cyan-500/50 backdrop-blur-lg shadow-2xl"
              style={{
                boxShadow: `
                  0 8px 32px rgba(34, 211, 238, 0.4),
                  0 0 20px rgba(34, 211, 238, 0.3)
                `,
                borderRadius: '12px',
              }}
              showInteractive={false}
            />
            <MiniMap
              className="bg-slate-900/98 border-cyan-500/50 backdrop-blur-lg"
              style={{
                boxShadow: `
                  0 8px 32px rgba(34, 211, 238, 0.4),
                  0 0 20px rgba(34, 211, 238, 0.3)
                `,
                borderRadius: '12px',
              }}
              nodeColor={(node) => {
                if (node.type === 'terminal') {
                  const isStart = node.data?.type === 'start';
                  return isStart ? '#a855f7' : '#f87171';
                }
                if (node.type === 'diamond') return '#22d3ee';
                // Process nodes - check complexity
                const complexity = node.data?.complexity_score || 0;
                if (complexity > 5) return '#f87171';
                if (complexity > 3) return '#a855f7';
                return '#22d3ee';
              }}
              maskColor="rgba(0, 0, 0, 0.8)"
              pannable={true}
              zoomable={true}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Explanation - Beautiful styled section */}
      <div className="flex-shrink-0 p-5 bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-xl border-2 border-cyan-500/30 shadow-lg">
        <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-lg">
          <span className="text-2xl">📝</span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Explanation</span>
        </h3>
        <div className="overflow-visible">
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

