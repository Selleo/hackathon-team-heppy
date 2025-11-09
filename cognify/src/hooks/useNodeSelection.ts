"use client";

import { useState, useCallback, useMemo } from "react";
import type { GraphNode, GraphEdge } from "@/hooks/useGraphStream";

export function useNodeSelection(nodes: GraphNode[], edges: GraphEdge[]) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeLabel, setSelectedNodeLabel] = useState<string>("");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Get related nodes for navigation
  const getRelatedNodes = useCallback(
    (nodeId: string) => {
      if (!nodeId) return [];

      // Find all connected nodes (incoming + outgoing)
      const connectedNodeIds = new Set<string>();

      edges.forEach((edge) => {
        if (edge.source === nodeId) {
          connectedNodeIds.add(edge.target);
        }
        if (edge.target === nodeId) {
          connectedNodeIds.add(edge.source);
        }
      });

      // Get node details and sort alphabetically
      return Array.from(connectedNodeIds)
        .map((id) => {
          const node = nodes.find((n) => n.id === id);
          return node ? { id, label: node.label } : null;
        })
        .filter((n): n is { id: string; label: string } => n !== null)
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [nodes, edges],
  );

  // Navigate to related node
  const navigateToRelatedNode = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedNodeId) return;

      const relatedNodes = getRelatedNodes(selectedNodeId);
      if (relatedNodes.length === 0) return;

      const currentIndex = relatedNodes.findIndex(
        (n) => n.id === selectedNodeId,
      );
      let nextIndex: number;

      if (direction === "next") {
        nextIndex = (currentIndex + 1) % relatedNodes.length;
      } else {
        nextIndex =
          currentIndex <= 0 ? relatedNodes.length - 1 : currentIndex - 1;
      }

      const nextNode = relatedNodes[nextIndex];
      if (nextNode) {
        setSelectedNodeId(nextNode.id);
        setSelectedNodeLabel(nextNode.label);
      }
    },
    [selectedNodeId, getRelatedNodes],
  );

  // Select a node and open sheet
  const selectNode = useCallback((nodeId: string, nodeLabel: string) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeLabel(nodeLabel);
    setSheetOpen(true);
  }, []);

  // Check if node has related nodes
  const hasRelatedNodes = useMemo(() => {
    if (!selectedNodeId) return false;
    return getRelatedNodes(selectedNodeId).length > 0;
  }, [selectedNodeId, getRelatedNodes]);

  return {
    selectedNodeId,
    selectedNodeLabel,
    sheetOpen,
    setSheetOpen,
    selectNode,
    navigateToRelatedNode,
    hasRelatedNodes,
  };
}

