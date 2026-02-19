/**
 * Graph Search Utility
 * Search and filter graph nodes based on various criteria
 */

import type { GraphNode, GraphEdge } from './graphDataProcessor';
import type { GraphSearchFilters } from '../types/graph';

/**
 * Search result with highlighting information
 */
export interface SearchResult {
  /** Matching node IDs */
  matchingNodeIds: Set<string>;
  /** All node IDs (for dimming non-matches) */
  allNodeIds: Set<string>;
  /** Match count */
  matchCount: number;
}

/**
 * Check if node matches text query
 */
function matchesTextQuery(node: GraphNode, query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return true;

  // Search in label
  if (node.label.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Search in tags (for note nodes)
  if (node.metadata.tags) {
    return node.metadata.tags.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    );
  }

  return false;
}

/**
 * Check if node matches tag filter
 */
function matchesTagFilter(node: GraphNode, tags: string[]): boolean {
  if (tags.length === 0) return true;

  // Tag nodes match if their tag is in the filter
  if (node.type === 'tag') {
    const tagName = node.label;
    return tags.includes(tagName);
  }

  // Note nodes match if they have any of the filtered tags
  if (node.type === 'note' && node.metadata.tags) {
    return node.metadata.tags.some((tag) => tags.includes(tag));
  }

  return false;
}

/**
 * Check if node matches type filter
 */
function matchesTypeFilter(
  node: GraphNode,
  nodeType: 'note' | 'tag' | 'both'
): boolean {
  if (nodeType === 'both') return true;
  return node.type === nodeType;
}

/**
 * Get all nodes connected to a specific node
 */
function getConnectedNodes(
  nodeId: string,
  edges: GraphEdge[]
): Set<string> {
  const connected = new Set<string>();
  connected.add(nodeId); // Include the node itself

  edges.forEach((edge) => {
    if (edge.source === nodeId) {
      connected.add(edge.target);
    }
    if (edge.target === nodeId) {
      connected.add(edge.source);
    }
  });

  return connected;
}

/**
 * Search and filter graph nodes
 * Returns set of matching node IDs for highlighting
 */
export function searchGraphNodes(
  nodes: GraphNode[],
  edges: GraphEdge[],
  filters: GraphSearchFilters
): SearchResult {
  const allNodeIds = new Set(nodes.map((n) => n.id));

  // If no filters, all nodes match
  if (
    !filters.query &&
    (!filters.tags || filters.tags.length === 0) &&
    (!filters.nodeType || filters.nodeType === 'both') &&
    !filters.connectedTo
  ) {
    return {
      matchingNodeIds: allNodeIds,
      allNodeIds,
      matchCount: nodes.length,
    };
  }

  // Apply filters progressively
  let matchingNodes = nodes;

  // Text query filter
  if (filters.query) {
    matchingNodes = matchingNodes.filter((node) =>
      matchesTextQuery(node, filters.query!)
    );
  }

  // Tag filter
  if (filters.tags && filters.tags.length > 0) {
    matchingNodes = matchingNodes.filter((node) =>
      matchesTagFilter(node, filters.tags!)
    );
  }

  // Type filter
  if (filters.nodeType && filters.nodeType !== 'both') {
    matchingNodes = matchingNodes.filter((node) =>
      matchesTypeFilter(node, filters.nodeType!)
    );
  }

  // Connection filter
  if (filters.connectedTo) {
    const connectedNodeIds = getConnectedNodes(filters.connectedTo, edges);
    matchingNodes = matchingNodes.filter((node) =>
      connectedNodeIds.has(node.id)
    );
  }

  const matchingNodeIds = new Set(matchingNodes.map((n) => n.id));

  return {
    matchingNodeIds,
    allNodeIds,
    matchCount: matchingNodes.length,
  };
}

/**
 * Debounce search to avoid excessive re-renders
 * Returns a debounced search function
 */
export function createDebouncedSearch(
  delay: number = 300
): (
  nodes: GraphNode[],
  edges: GraphEdge[],
  filters: GraphSearchFilters,
  callback: (result: SearchResult) => void
) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (nodes, edges, filters, callback) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const result = searchGraphNodes(nodes, edges, filters);
      callback(result);
    }, delay);
  };
}

/**
 * Check if a node should be highlighted (matching search)
 */
export function isNodeHighlighted(
  nodeId: string,
  searchResult: SearchResult | null
): boolean {
  if (!searchResult) return false;
  return searchResult.matchingNodeIds.has(nodeId);
}

/**
 * Check if a node should be dimmed (not matching search)
 */
export function isNodeDimmed(
  nodeId: string,
  searchResult: SearchResult | null
): boolean {
  if (!searchResult) return false;
  // Dim if there are matches but this node is not one of them
  if (searchResult.matchingNodeIds.size < searchResult.allNodeIds.size) {
    return !searchResult.matchingNodeIds.has(nodeId);
  }
  return false;
}

/**
 * Get visual style adjustments for search highlighting
 */
export interface SearchHighlightStyle {
  opacity: number;
  scale: number;
  strokeWidth: number;
}

export function getSearchHighlightStyle(
  nodeId: string,
  searchResult: SearchResult | null
): SearchHighlightStyle {
  if (!searchResult) {
    return { opacity: 1, scale: 1, strokeWidth: 2 };
  }

  const isHighlighted = isNodeHighlighted(nodeId, searchResult);
  const isDimmed = isNodeDimmed(nodeId, searchResult);

  if (isHighlighted) {
    return {
      opacity: 1,
      scale: 1.2,
      strokeWidth: 3,
    };
  }

  if (isDimmed) {
    return {
      opacity: 0.3,
      scale: 1,
      strokeWidth: 1,
    };
  }

  return { opacity: 1, scale: 1, strokeWidth: 2 };
}
