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

// Decision Node (Blue) with rounded shape and light shadow
const DiamondNode = ({ data }: { data: { label: string; complexity_score: number; tooltip?: string } }) => {
  const size = 120;
  const borderColor = '#3b82f6';
  const bgGradient = 'linear-gradient(135deg, #0b1220, #0e1726)';
  return (
    <div title={data.tooltip || 'Checks if recursion should stop'} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div
        style={{
          width: size,
          height: size,
          background: bgGradient,
          border: `2px solid ${borderColor}`,
          transform: 'rotate(45deg)',
          position: 'absolute',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          borderRadius: '12px',
        }}
      />
      <div style={{ transform: 'rotate(-45deg)', color: '#e2e8f0', fontSize: '12px', fontWeight: 700, textAlign: 'center', padding: '10px', position: 'relative', zIndex: 1, maxWidth: size, wordBreak: 'break-word', lineHeight: '1.4' }}>
        {formatLabel(data.label)}
      </div>
    </div>
  );
};

// Start/End Node (Green) rounded with light shadow
const TerminalNode = ({ data }: { data: { label: string; type: string; tooltip?: string } }) => {
  const bgGradient = 'linear-gradient(135deg, #22c55e, #16a34a)';
  return (
    <div title={data.tooltip || (data.type === 'start' ? 'Start of flow' : 'End of flow')} style={{ padding: '14px 24px', background: bgGradient, color: '#052e12', borderRadius: 24, fontWeight: 800, fontSize: 14, letterSpacing: '0.3px', border: '2px solid #16a34a', boxShadow: '0 6px 14px rgba(0,0,0,0.25)' }}>
      {formatLabel(data.label)}
    </div>
  );
};

// Process Node with variants and light styling
const ProcessNode = ({ data }: { data: { label: string; complexity_score: number; variant?: 'base' | 'recursive' | 'default'; tooltip?: string } }) => {
  let borderColor = '#64748b';
  let bg = 'linear-gradient(135deg, #0b1220, #0e1726)';
  let textColor = '#e2e8f0';
  if (data.variant === 'base') {
    borderColor = '#f59e0b';
    bg = 'linear-gradient(135deg, #1f1b0a, #2a230b)';
    textColor = '#fef3c7';
  } else if (data.variant === 'recursive') {
    borderColor = '#ef4444';
    bg = 'linear-gradient(135deg, #1a0e0e, #220e0e)';
    textColor = '#fecaca';
  }
  return (
    <div title={data.tooltip} style={{ padding: '12px 20px', background: bg, color: textColor, borderRadius: 12, border: `2px solid ${borderColor}`, fontWeight: 700, fontSize: 13, minWidth: 140, textAlign: 'center', boxShadow: '0 6px 14px rgba(0,0,0,0.25)', lineHeight: 1.5 }}>
      {formatLabel(data.label)}
    </div>
  );
};

const nodeTypes = {
  diamond: DiamondNode,
  terminal: TerminalNode,
  process: ProcessNode,
};

function classifyVariant(label: string): { variant: 'base' | 'recursive' | 'default'; tooltip?: string } {
  const lower = (label || '').toLowerCase();
  if (lower.includes('return n') || lower.includes('base')) {
    return { variant: 'base', tooltip: 'Stops recursion and returns value' };
  }
  if (lower.includes('fib(') || (lower.includes('return') && (lower.includes('n-1') || lower.includes('n - 1') || lower.includes('n-2') || lower.includes('n - 2')))) {
    return { variant: 'recursive', tooltip: 'Breaks the problem into subproblems' };
  }
  return { variant: 'default', tooltip: undefined };
}

function getLayoutedElements(flowchart: Flowchart) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 110, ranksep: 140, marginx: 80, marginy: 80, align: 'center' });

  const initialNodes: Node[] = flowchart.nodes.map((node) => {
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

    const variantInfo = nodeType === 'process' ? classifyVariant(node.label) : { variant: 'default', tooltip: node.type === 'decision' ? 'Checks if recursion should stop' : undefined };
    return {
      id: node.id,
      type: nodeType,
      data: { label: node.label, type: node.type, complexity_score: node.complexity_score, variant: variantInfo.variant, tooltip: variantInfo.tooltip },
      position: { x: 0, y: 0 },
      sourcePosition,
      targetPosition,
    };
  });

  let nodes: Node[] = [...initialNodes];
  const nodeIds = new Set(nodes.map((node) => node.id));

  // Build edges with curved paths and color based on variant
  let edges: Edge[] = flowchart.edges
    .filter((edge) => nodeIds.has(edge.from_node) && nodeIds.has(edge.to_node))
    .map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.from_node);
    const targetNode = nodes.find((n) => n.id === edge.to_node);
    let stroke = 'rgba(100, 116, 139, 0.9)';
    if (sourceNode?.type === 'process' && sourceNode.data?.variant === 'recursive') stroke = 'rgba(239, 68, 68, 0.95)';
    if (targetNode?.type === 'process' && targetNode.data?.variant === 'base') stroke = 'rgba(245, 158, 11, 0.95)';
    return {
      id: `${edge.from_node}-${edge.to_node}`,
      source: edge.from_node,
      target: edge.to_node,
      label: edge.label || '',
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 18, height: 18 },
      style: { stroke, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' },
      labelStyle: { fill: '#94a3b8', fontWeight: 700, fontSize: '12px', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.4)' },
      animated: true,
    } as Edge;
  });

  // Augment recursion: split recursive return into two sub-calls
  const recursiveNodes = nodes.filter((n) => n.type === 'process' && n.data?.variant === 'recursive');
  recursiveNodes.forEach((rec) => {
    const leftId = `${rec.id}_sub_1`;
    const rightId = `${rec.id}_sub_2`;
    const leftNode: Node = {
      id: leftId,
      type: 'process',
      data: { label: 'fib(n-1)', complexity_score: rec.data?.complexity_score || 1, variant: 'recursive', tooltip: 'Breaks the problem into subproblems' },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    const rightNode: Node = {
      id: rightId,
      type: 'process',
      data: { label: 'fib(n-2)', complexity_score: rec.data?.complexity_score || 1, variant: 'recursive', tooltip: 'Breaks the problem into subproblems' },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
    nodes.push(leftNode, rightNode);
    nodeIds.add(leftId);
    nodeIds.add(rightId);

    // Redirect outgoing edges from recursive node to both sub-calls
    const outgoing = edges.filter((e) => e.source === rec.id);
    // Remove original outgoing edges from recursive node
    edges = edges.filter((e) => e.source !== rec.id);
    outgoing.forEach((e) => {
      edges.push({ ...e, id: `${leftId}-${e.target}`, source: leftId });
      edges.push({ ...e, id: `${rightId}-${e.target}`, source: rightId });
    });

    // Add edges from recursive node to its two sub-calls for clear branching
    edges.push({
      id: `${rec.id}-${leftId}`,
      source: rec.id,
      target: leftId,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(239, 68, 68, 0.95)', width: 18, height: 18 },
      style: { stroke: 'rgba(239, 68, 68, 0.95)', strokeWidth: 3 },
      animated: true,
    } as Edge);
    edges.push({
      id: `${rec.id}-${rightId}`,
      source: rec.id,
      target: rightId,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(239, 68, 68, 0.95)', width: 18, height: 18 },
      style: { stroke: 'rgba(239, 68, 68, 0.95)', strokeWidth: 3 },
      animated: true,
    } as Edge);
  });

  nodes.forEach((node) => {
    if (node.type === 'diamond') {
      g.setNode(node.id, { width: 140, height: 140 });
    } else if (node.type === 'terminal') {
      g.setNode(node.id, { width: 180, height: 72 });
    } else if (node.data?.label === 'fib(n-1)' || node.data?.label === 'fib(n-2)') {
      g.setNode(node.id, { width: 150, height: 70 });
    } else {
      g.setNode(node.id, { width: 200, height: 90 });
    }
  });

  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  try {
    dagre.layout(g);
  } catch (error) {
    console.error('⚠️ Dagre layout failed, falling back to simple layout:', error);
    return {
      nodes: nodes.map((node, index) => ({
        ...node,
        position: { x: (index % 2) * 250, y: Math.floor(index / 2) * 160 },
      })),
      edges,
    };
  }

  nodes.forEach((node, index) => {
    const nodeWithPosition = g.node(node.id);
    if (!nodeWithPosition) {
      node.position = { x: (index % 2) * 250, y: Math.floor(index / 2) * 160 };
      return;
    }
    let offsetX = 70;
    let offsetY = 35;
    if (node.type === 'diamond') {
      offsetX = 70;
      offsetY = 70;
    } else if (node.type === 'terminal') {
      offsetX = 90;
      offsetY = 36;
    } else if (node.data?.label === 'fib(n-1)' || node.data?.label === 'fib(n-2)') {
      offsetX = 75;
      offsetY = 35;
    } else {
      offsetX = 100;
      offsetY = 45;
    }
    node.position = { x: nodeWithPosition.x - offsetX, y: nodeWithPosition.y - offsetY };
  });

  return { nodes, edges };
}

export default function FlowchartVisualizer({ flowchart, explanation }: FlowchartVisualizerProps) {
  const { nodes, edges } = useMemo(() => {
    if (!flowchart) return { nodes: [], edges: [] };
    return getLayoutedElements(flowchart);
  }, [flowchart]);

  const defaultEdgeOptions = {
    type: ConnectionLineType.SmoothStep,
    animated: true,
    style: { stroke: 'rgba(148, 163, 184, 0.9)', strokeWidth: 3 },
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
            fitViewOptions={{ padding: 0.3, maxZoom: 2, minZoom: 0.5 }}
            className="bg-transparent"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnScroll={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={true}
            panOnDrag={false}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{
              stroke: 'rgba(148, 163, 184, 0.7)',
              strokeWidth: 3,
            }}
          >
            <Background 
              color="#0f172a" 
              gap={24}
              size={1.5}
              style={{ opacity: 0.4 }}
            />
            <Controls 
              className="bg-slate-900/90 border border-[#33415599] backdrop-blur-md"
              style={{
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                borderRadius: '10px',
              }}
              showInteractive={false}
            />
            <MiniMap
              className="bg-slate-900/90 border border-[#33415599] backdrop-blur-md"
              style={{
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                borderRadius: '10px',
              }}
              nodeColor={(node) => {
                if (node.type === 'terminal') return '#22c55e';
                if (node.type === 'diamond') return '#3b82f6';
                if (node.data?.variant === 'base') return '#f59e0b';
                if (node.data?.variant === 'recursive') return '#ef4444';
                return '#64748b';
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
