/**
 * Graph View Type Definitions
 * Types for graph visualization features
 */

/**
 * Link strength levels based on connection type
 */
export type LinkStrength = 'strong' | 'medium' | 'weak';

/**
 * Search filters for graph nodes
 */
export interface GraphSearchFilters {
  /** Text search query for node titles/content */
  query?: string;
  /** Filter by specific tags */
  tags?: string[];
  /** Filter by node type */
  nodeType?: 'note' | 'tag' | 'both';
  /** Show only nodes connected to this node */
  connectedTo?: string;
}

/**
 * Orphan node suggestion for creating connections
 */
export interface OrphanSuggestion {
  /** Note ID of the orphan */
  orphanId: string;
  /** Suggested note to link to */
  suggestedNoteId: string;
  /** Suggestion reason */
  reason: 'similar-title' | 'same-folder' | 'recent-edit' | 'similar-content';
  /** Confidence score (0-1) */
  confidence: number;
  /** Suggested tag (if reason is tag-based) */
  suggestedTag?: string;
}

/**
 * Link strength details for an edge
 */
export interface LinkStrengthInfo {
  /** Strength level */
  strength: LinkStrength;
  /** Is bidirectional */
  isBidirectional: boolean;
  /** Is tag-based connection */
  isTagBased: boolean;
  /** Visual thickness in pixels */
  thickness: number;
  /** Should use dashed line */
  isDashed: boolean;
}

/**
 * Orphan node details
 */
export interface OrphanNode {
  /** Node ID */
  nodeId: string;
  /** Node title */
  title: string;
  /** Suggested connections */
  suggestions: OrphanSuggestion[];
  /** When it was created */
  createdAt: string;
}
