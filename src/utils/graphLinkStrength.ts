/**
 * Graph Link Strength Calculator
 * Calculates visual strength indicators for graph edges
 */

import type { GraphEdge } from './graphDataProcessor';
import type { LinkStrength, LinkStrengthInfo } from '../types/graph';

/**
 * Calculate link strength based on connection properties
 *
 * Strength levels:
 * - Strong: Bidirectional wiki links (A→B and B→A)
 * - Medium: Single direction wiki link
 * - Weak: Tag-based connection
 */
export function calculateLinkStrength(
  edge: GraphEdge,
  allEdges: GraphEdge[]
): LinkStrengthInfo {
  // Tag-based connections are always weak
  if (edge.type === 'tag') {
    return {
      strength: 'weak',
      isBidirectional: false,
      isTagBased: true,
      thickness: 1,
      isDashed: true,
    };
  }

  // For backlinks, check if bidirectional
  const reverseEdge = allEdges.find(
    (e) =>
      e.type === 'backlink' &&
      e.source === edge.target &&
      e.target === edge.source
  );

  const isBidirectional = !!reverseEdge;

  return {
    strength: isBidirectional ? 'strong' : 'medium',
    isBidirectional,
    isTagBased: false,
    thickness: isBidirectional ? 3 : 2,
    isDashed: false,
  };
}

/**
 * Get all link strength info for all edges
 * Efficient batch calculation with memoization
 */
export function calculateAllLinkStrengths(
  edges: GraphEdge[]
): Map<string, LinkStrengthInfo> {
  const strengthMap = new Map<string, LinkStrengthInfo>();

  edges.forEach((edge) => {
    const edgeKey = `${edge.source}->${edge.target}`;
    const strengthInfo = calculateLinkStrength(edge, edges);
    strengthMap.set(edgeKey, strengthInfo);
  });

  return strengthMap;
}

/**
 * Get edge key for lookup in strength map
 */
export function getEdgeKey(source: string, target: string): string {
  return `${source}->${target}`;
}

/**
 * Filter edges by strength threshold
 * Useful for reducing clutter in large graphs
 */
export function filterEdgesByStrength(
  edges: GraphEdge[],
  strengthMap: Map<string, LinkStrengthInfo>,
  minStrength: LinkStrength
): GraphEdge[] {
  const strengthOrder: LinkStrength[] = ['weak', 'medium', 'strong'];
  const minIndex = strengthOrder.indexOf(minStrength);

  return edges.filter((edge) => {
    const key = getEdgeKey(edge.source, edge.target);
    const info = strengthMap.get(key);
    if (!info) return true; // Include if no info

    const edgeIndex = strengthOrder.indexOf(info.strength);
    return edgeIndex >= minIndex;
  });
}

/**
 * Get color for link based on strength
 * Uses semantic tokens
 */
export function getLinkColor(strengthInfo: LinkStrengthInfo, isDarkMode: boolean): string {
  if (strengthInfo.isTagBased) {
    return isDarkMode ? 'var(--border-dark)' : 'var(--border-light)';
  }

  // Backlinks use cyan accent
  if (strengthInfo.isBidirectional) {
    return 'var(--accent-cyan)';
  }

  // Medium strength uses lighter cyan
  return isDarkMode ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 128, 128, 0.5)';
}

/**
 * Get opacity for link based on strength
 */
export function getLinkOpacity(strengthInfo: LinkStrengthInfo): number {
  switch (strengthInfo.strength) {
    case 'strong':
      return 0.8;
    case 'medium':
      return 0.6;
    case 'weak':
      return 0.4;
    default:
      return 0.5;
  }
}
