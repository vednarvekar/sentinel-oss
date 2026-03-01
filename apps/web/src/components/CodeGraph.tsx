import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mockOverview } from "@/lib/mock-data";

const groupColors: Record<string, string> = {
  reconciler: "#58a6ff",
  dom: "#3fb950",
  core: "#d29922",
  scheduler: "#bc8cff",
};

const CodeGraph = () => {
  const initialNodes: Node[] = useMemo(
    () =>
      mockOverview.graph_nodes.map((node, i) => ({
        id: node.id,
        position: {
          x: 100 + (i % 4) * 200 + (Math.random() * 40 - 20),
          y: 60 + Math.floor(i / 4) * 150 + (Math.random() * 30 - 15),
        },
        data: { label: node.label },
        style: {
          background: "#161b22",
          color: groupColors[node.group] || "#c9d1d9",
          border: `1px solid ${groupColors[node.group] || "#30363d"}`,
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "11px",
          fontFamily: "'JetBrains Mono', monospace",
        },
      })),
    []
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      mockOverview.graph_edges.map((edge, i) => ({
        id: `e-${i}`,
        source: edge.source,
        target: edge.target,
        animated: true,
        style: { stroke: "#30363d", strokeWidth: 1 },
      })),
    []
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      <Background color="#30363d" gap={20} size={1} />
      <Controls
        showInteractive={false}
        style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "6px" }}
      />
    </ReactFlow>
  );
};

export default CodeGraph;
