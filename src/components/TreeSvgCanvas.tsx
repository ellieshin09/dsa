import { TreeLayoutResult } from '../algorithms/binaryTree';

interface TreeSvgCanvasProps {
  layout: TreeLayoutResult;
  activeNodeId?: string | null;
  visitedNodeIds?: Set<string>;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

export default function TreeSvgCanvas({
  layout,
  activeNodeId = null,
  visitedNodeIds,
  selectedNodeId = null,
  onSelectNode,
  emptyTitle = 'NO TREE NODES CONSTRUCTED',
  emptySubtitle = 'Insert nodes or generate a sample tree to inspect the visual hierarchy.',
}: TreeSvgCanvasProps) {
  if (layout.nodes.length === 0) {
    return (
      <div className="w-full min-h-[340px] bg-[#D9D9D9] border border-[#121212] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 border border-[#121212] bg-[#F5F0E6] flex items-center justify-center mb-4 font-mono text-sm font-bold text-[#D9531E]">
          ∅
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
          {emptyTitle}
        </p>
        <p className="mt-2 text-sm text-[#6B6B6B] max-w-md">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#D9D9D9] border border-[#121212] overflow-x-auto">
      <div className="min-w-[540px] flex justify-center p-2">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full h-auto max-h-[460px]"
          role="img"
          aria-label="Binary Tree Diagram"
        >
          {/* Edges */}
          {layout.edges.map((edge) => (
            <g key={`${edge.fromId}-${edge.toId}`}>
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={edge.isPlaceholder ? '#6B6B6B' : '#121212'}
                strokeWidth={edge.isPlaceholder ? 1.5 : 2}
                strokeDasharray={edge.isPlaceholder ? '5 4' : undefined}
              />
            </g>
          ))}

          {/* Nodes */}
          {layout.nodes.map((node) => {
            const isActive = activeNodeId === node.id;
            const isVisited = visitedNodeIds ? visitedNodeIds.has(node.id) : false;
            const isSelected = selectedNodeId === node.id;

            let fill = '#FFFFFF';
            let stroke = '#121212';
            let textColor = '#111111';
            let strokeWidth = 2;

            if (node.isPlaceholder) {
              fill = '#ECE8DF';
              stroke = '#6B6B6B';
              textColor = '#6B6B6B';
              strokeWidth = 1.5;
            } else if (isActive) {
              fill = '#D9531E';
              stroke = '#121212';
              textColor = '#FFFFFF';
              strokeWidth = 2.5;
            } else if (isVisited) {
              fill = '#1E2640';
              stroke = '#121212';
              textColor = '#FFFFFF';
              strokeWidth = 2;
            } else if (isSelected) {
              fill = '#F5F0E6';
              stroke = '#D9531E';
              textColor = '#111111';
              strokeWidth = 3;
            }

            const displayLabel =
              node.value.length > 6 ? `${node.value.slice(0, 5)}…` : node.value;
            const radius = node.isPlaceholder ? 19 : 23;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => {
                  if (!node.isPlaceholder && onSelectNode) {
                    onSelectNode(node.id);
                  }
                }}
                className={!node.isPlaceholder && onSelectNode ? 'cursor-pointer' : undefined}
              >
                {isSelected && !node.isPlaceholder && (
                  <circle
                    r={radius + 5}
                    fill="none"
                    stroke="#D9531E"
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                  />
                )}
                <circle
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={node.isPlaceholder ? '4 3' : undefined}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontFamily="IBM Plex Mono, monospace"
                  fontSize={node.isPlaceholder ? 10 : node.value.length > 4 ? 11 : 13}
                  fontWeight={700}
                >
                  {displayLabel}
                </text>
                {node.side !== 'root' && (
                  <text
                    x={node.side === 'left' ? -radius - 6 : radius + 6}
                    y={-radius + 6}
                    textAnchor="middle"
                    fill="#1E2640"
                    fontFamily="IBM Plex Mono, monospace"
                    fontSize={9}
                    fontWeight={700}
                  >
                    {node.side === 'left' ? 'L' : 'R'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
