/**
 * Graph Orphan Detection
 * Identifies isolated nodes and suggests connections
 */

import type { GraphNode, GraphEdge } from './graphDataProcessor';
import type { OrphanNode, OrphanSuggestion } from '../types/graph';
import type { Note } from '../types/notes';

/**
 * Detect orphan nodes (nodes with no connections)
 */
export function detectOrphans(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Set<string> {
  const connectedNodeIds = new Set<string>();

  // Mark all nodes that have at least one connection
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // Orphans are nodes not in the connected set
  const orphanIds = new Set<string>();
  nodes.forEach((node) => {
    // Only notes can be orphans (tag nodes are expected to have no connections)
    if (node.type === 'note' && !connectedNodeIds.has(node.id)) {
      orphanIds.add(node.id);
    }
  });

  return orphanIds;
}

/**
 * Calculate string similarity using Levenshtein distance
 * Returns score 0-1 (1 = identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  // Create distance matrix
  const matrix: number[][] = [];
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const distance = matrix[len2][len1];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

/**
 * Generate connection suggestions for an orphan node
 */
export function generateConnectionSuggestions(
  orphanId: string,
  orphanNode: GraphNode,
  allNodes: GraphNode[],
  notes: Record<string, Note>
): OrphanSuggestion[] {
  const suggestions: OrphanSuggestion[] = [];
  const orphanNote = notes[orphanId];

  if (!orphanNote) return suggestions;

  // Get other note nodes (exclude the orphan itself and tag nodes)
  const otherNotes = allNodes.filter(
    (node) => node.type === 'note' && node.id !== orphanId
  );

  // Suggestion 1: Similar title
  otherNotes.forEach((node) => {
    const similarity = calculateSimilarity(orphanNode.label, node.label);
    if (similarity > 0.5) {
      // 50% similarity threshold
      suggestions.push({
        orphanId,
        suggestedNoteId: node.id,
        reason: 'similar-title',
        confidence: similarity,
      });
    }
  });

  // Suggestion 2: Same folder
  if (orphanNote.folderId) {
    otherNotes.forEach((node) => {
      const noteData = notes[node.id];
      if (noteData && noteData.folderId === orphanNote.folderId) {
        suggestions.push({
          orphanId,
          suggestedNoteId: node.id,
          reason: 'same-folder',
          confidence: 0.7,
        });
      }
    });
  }

  // Suggestion 3: Recently edited (within 7 days)
  const orphanDate = new Date(orphanNote.createdAt);
  const sevenDaysAgo = new Date(orphanDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  otherNotes.forEach((node) => {
    const noteData = notes[node.id];
    if (noteData) {
      const noteDate = new Date(noteData.updatedAt || noteData.createdAt);
      if (noteDate >= sevenDaysAgo && noteDate <= orphanDate) {
        suggestions.push({
          orphanId,
          suggestedNoteId: node.id,
          reason: 'recent-edit',
          confidence: 0.6,
        });
      }
    }
  });

  // Suggestion 4: Similar content (basic word matching)
  const orphanWords = new Set(
    orphanNote.content
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4) // Only words longer than 4 chars
  );

  if (orphanWords.size > 0) {
    otherNotes.forEach((node) => {
      const noteData = notes[node.id];
      if (noteData && noteData.content) {
        const noteWords = noteData.content
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 4);

        // Count common words
        const commonWords = noteWords.filter((w) => orphanWords.has(w));
        const similarity = commonWords.length / Math.max(orphanWords.size, 1);

        if (similarity > 0.2) {
          // 20% common words
          suggestions.push({
            orphanId,
            suggestedNoteId: node.id,
            reason: 'similar-content',
            confidence: Math.min(similarity * 2, 0.9), // Scale up but cap at 0.9
          });
        }
      }
    });
  }

  // Suggestion 5: Suggest adding common tags
  // Find most common tags in the folder
  if (orphanNote.folderId) {
    const tagFrequency = new Map<string, number>();

    otherNotes.forEach((node) => {
      const noteData = notes[node.id];
      if (noteData && noteData.folderId === orphanNote.folderId && noteData.tags) {
        noteData.tags.forEach((tag) => {
          tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
        });
      }
    });

    // Get top 3 tags
    const topTags = Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topTags.forEach(([tag]) => {
      // Find a note with this tag to suggest
      const noteWithTag = otherNotes.find((node) => {
        const noteData = notes[node.id];
        return noteData?.tags?.includes(tag);
      });

      if (noteWithTag) {
        suggestions.push({
          orphanId,
          suggestedNoteId: noteWithTag.id,
          reason: 'same-folder',
          confidence: 0.5,
          suggestedTag: tag,
        });
      }
    });
  }

  // Sort by confidence (highest first) and deduplicate
  const uniqueSuggestions = new Map<string, OrphanSuggestion>();
  suggestions.forEach((suggestion) => {
    const existing = uniqueSuggestions.get(suggestion.suggestedNoteId);
    if (!existing || existing.confidence < suggestion.confidence) {
      uniqueSuggestions.set(suggestion.suggestedNoteId, suggestion);
    }
  });

  return Array.from(uniqueSuggestions.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Top 5 suggestions
}

/**
 * Get all orphan nodes with suggestions
 */
export function getOrphansWithSuggestions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  notes: Record<string, Note>
): OrphanNode[] {
  const orphanIds = detectOrphans(nodes, edges);
  const orphanNodes: OrphanNode[] = [];

  orphanIds.forEach((orphanId) => {
    const node = nodes.find((n) => n.id === orphanId);
    const note = notes[orphanId];

    if (node && note) {
      const suggestions = generateConnectionSuggestions(
        orphanId,
        node,
        nodes,
        notes
      );

      orphanNodes.push({
        nodeId: orphanId,
        title: node.label,
        suggestions,
        createdAt: note.createdAt.toString(),
      });
    }
  });

  // Sort by creation date (newest first)
  return orphanNodes.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Check if a node is an orphan
 */
export function isOrphan(nodeId: string, orphanIds: Set<string>): boolean {
  return orphanIds.has(nodeId);
}
