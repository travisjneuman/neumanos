/**
 * Graph Data Processor
 * Transforms notes, tasks, and their relationships into graph data for visualization
 */

import type { Note } from '../types/notes';

export interface GraphNode {
  id: string;
  type: 'note' | 'tag';
  label: string;
  color: string; // Semantic color token
  size: number; // Based on connection count
  connections?: number; // P1: Connection count for tooltips
  metadata: {
    createdAt?: string;
    folder?: string;
    tags?: string[];
  };
}

/**
 * GraphNode with D3 simulation properties
 * D3 adds x, y, vx, vy, fx, fy during force simulation
 */
export interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string; // Node ID
  target: string; // Node ID
  type: 'backlink' | 'tag';
  strength: number; // For force simulation
}

/**
 * GraphEdge after D3 simulation processes it
 * D3 replaces source/target string IDs with actual node objects
 */
export interface SimulationEdge {
  source: SimulationNode;
  target: SimulationNode;
  type: 'backlink' | 'tag';
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphFilters {
  searchQuery?: string;
  selectedTags?: string[];
  selectedFolders?: string[];
  hideOrphans?: boolean;
  focusNodeId?: string;
  focusDepth?: number; // 1-3 hops from focused node
  colorBy?: 'folder' | 'tag' | 'none'; // P1: Color grouping
  sizeByConnections?: boolean; // P1: Node sizing (default: true)
}

/**
 * P1: Generate color palette for graph node groups
 * Returns HSL colors with good visual separation
 */
function generateColorPalette(count: number): string[] {
  const colors: string[] = [];
  const saturation = 70;
  const lightness = 55;

  for (let i = 0; i < count; i++) {
    // Distribute hues evenly around color wheel
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return colors;
}

/**
 * P1: Assign colors to nodes based on grouping strategy
 */
function assignNodeColors(
  nodes: GraphNode[],
  colorBy: 'folder' | 'tag' | 'none'
): Map<string, string> {
  const colorMap = new Map<string, string>();

  if (colorBy === 'none') {
    // Use default semantic colors
    return colorMap;
  }

  if (colorBy === 'folder') {
    // Group by folder
    const folders = new Set<string>();
    nodes.forEach((node) => {
      if (node.type === 'note') {
        const folder = node.metadata.folder || 'root';
        folders.add(folder);
      }
    });

    const folderArray = Array.from(folders).sort();
    const palette = generateColorPalette(folderArray.length);

    folderArray.forEach((folder, index) => {
      colorMap.set(folder, palette[index]);
    });

    return colorMap;
  }

  if (colorBy === 'tag') {
    // Group by primary tag (first tag if multiple)
    const tags = new Set<string>();
    nodes.forEach((node) => {
      if (node.type === 'note' && node.metadata.tags && node.metadata.tags.length > 0) {
        tags.add(node.metadata.tags[0]);
      }
    });

    const tagArray = Array.from(tags).sort();
    const palette = generateColorPalette(tagArray.length);

    tagArray.forEach((tag, index) => {
      colorMap.set(tag, palette[index]);
    });

    return colorMap;
  }

  return colorMap;
}

/**
 * Get all nodes within N degrees of separation from a target node
 * Uses breadth-first search to traverse the graph
 */
function getNodesWithinDepth(
  nodeId: string,
  depth: number,
  edges: GraphEdge[]
): Set<string> {
  const visited = new Set<string>([nodeId]);
  let currentLevel = [nodeId];

  for (let d = 0; d < depth; d++) {
    const nextLevel: string[] = [];

    for (const current of currentLevel) {
      // Find all directly connected nodes
      const connected = edges
        .filter(e => e.source === current || e.target === current)
        .map(e => e.source === current ? e.target : e.source);

      for (const neighbor of connected) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextLevel.push(neighbor);
        }
      }
    }

    currentLevel = nextLevel;
  }

  return visited;
}

/**
 * Build graph data from notes
 */
export function buildGraphData(
  notes: Record<string, Note>,
  filters: GraphFilters = {}
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();
  const tagNodeMap = new Map<string, GraphNode>();

  // Get all notes as array
  const notesArray = Object.values(notes);

  // Filter notes based on search/folder filters
  let filteredNotes = notesArray;

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredNotes = filteredNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }

  if (filters.selectedFolders && filters.selectedFolders.length > 0) {
    filteredNotes = filteredNotes.filter((note) =>
      filters.selectedFolders!.includes(note.folderId || 'root')
    );
  }

  // Create note nodes
  filteredNotes.forEach((note) => {
    const node: GraphNode = {
      id: note.id,
      type: 'note',
      label: note.title || 'Untitled',
      color: 'var(--accent-cyan)', // Semantic token for notes
      size: 10, // Base size, will be updated based on connections
      metadata: {
        createdAt: note.createdAt.toString(),
        folder: note.folderId || undefined,
        tags: note.tags || [],
      },
    };
    nodes.push(node);
    nodeMap.set(note.id, node);
  });

  // Create tag nodes and tag edges
  const allTags = new Set<string>();
  filteredNotes.forEach((note) => {
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach((tag) => allTags.add(tag));
    }
  });

  // Filter by selected tags if provided
  let tagsToInclude = Array.from(allTags);
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    tagsToInclude = tagsToInclude.filter((tag) =>
      filters.selectedTags!.includes(tag)
    );
  }

  tagsToInclude.forEach((tag) => {
    const tagNode: GraphNode = {
      id: `tag:${tag}`,
      type: 'tag',
      label: tag,
      color: 'var(--accent-magenta)', // Semantic token for tags
      size: 8, // Tags slightly smaller
      metadata: {
        tags: [tag],
      },
    };
    nodes.push(tagNode);
    tagNodeMap.set(tag, tagNode);
  });

  // Create tag edges (note → tag)
  filteredNotes.forEach((note) => {
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach((tag) => {
        if (tagNodeMap.has(tag)) {
          edges.push({
            source: note.id,
            target: `tag:${tag}`,
            type: 'tag',
            strength: 0.5, // Weaker than backlinks
          });
        }
      });
    }
  });

  // Create edges from linkedNotes (notes that this note links TO)
  filteredNotes.forEach((note) => {
    if (note.linkedNotes && note.linkedNotes.length > 0) {
      note.linkedNotes.forEach((linkedNoteId: string) => {
        // Only create edge if target note exists in filtered set
        if (nodeMap.has(linkedNoteId)) {
          edges.push({
            source: note.id,
            target: linkedNoteId,
            type: 'backlink',
            strength: 1.0, // Stronger connection
          });
        }
      });
    }
  });

  // P1: Calculate connection counts for all nodes (used for sizing and tooltips)
  const connectionCounts = new Map<string, number>();
  edges.forEach((edge) => {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
  });

  // Store connection count in metadata for tooltips
  nodes.forEach((node) => {
    node.connections = connectionCounts.get(node.id) || 0;
  });

  // Update node sizes based on connection count (if enabled)
  if (filters.sizeByConnections !== false) { // Default to true if not specified
    nodes.forEach((node) => {
      const count = node.connections || 0;
      // Size scales with connections: 10-30 for notes, 8-20 for tags
      const baseSize = node.type === 'note' ? 10 : 8;
      const maxSize = node.type === 'note' ? 30 : 20;
      node.size = Math.min(baseSize + count * 2, maxSize);
    });
  }
  // If sizeByConnections is false, keep default sizes (already set at node creation)

  // P1: Apply color grouping if specified
  if (filters.colorBy && filters.colorBy !== 'none') {
    const colorMap = assignNodeColors(nodes, filters.colorBy);

    nodes.forEach((node) => {
      if (node.type === 'note') {
        let groupKey: string | undefined;

        if (filters.colorBy === 'folder') {
          groupKey = node.metadata.folder || 'root';
        } else if (filters.colorBy === 'tag' && node.metadata.tags && node.metadata.tags.length > 0) {
          groupKey = node.metadata.tags[0];
        }

        if (groupKey && colorMap.has(groupKey)) {
          node.color = colorMap.get(groupKey)!;
        }
      }
      // Tag nodes keep their default magenta color
    });
  }

  // Filter orphan nodes if requested
  let finalNodes = nodes;
  let finalEdges = edges;

  if (filters.hideOrphans) {
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    finalNodes = nodes.filter((node) => connectedNodeIds.has(node.id));
  }

  // Focus mode: show only nodes within N hops of focused node
  if (filters.focusNodeId && filters.focusDepth) {
    const focusedNodeIds = getNodesWithinDepth(
      filters.focusNodeId,
      filters.focusDepth,
      edges
    );

    finalNodes = finalNodes.filter(n => focusedNodeIds.has(n.id));
    finalEdges = edges.filter(e =>
      focusedNodeIds.has(e.source) && focusedNodeIds.has(e.target)
    );
  }

  return {
    nodes: finalNodes,
    edges: finalEdges,
  };
}

/**
 * Get unique folders from notes
 */
export function getUniqueFolders(notes: Record<string, Note>): string[] {
  const folders = new Set<string>();
  Object.values(notes).forEach((note) => {
    if (note.folderId) {
      folders.add(note.folderId);
    } else {
      folders.add('root');
    }
  });
  return Array.from(folders);
}

/**
 * Get unique tags from notes
 */
export function getUniqueTags(notes: Record<string, Note>): string[] {
  const tags = new Set<string>();
  Object.values(notes).forEach((note) => {
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}

/**
 * P1: Get color groups for legend display
 * Returns map of group names to colors
 */
export function getColorGroups(
  graphData: GraphData,
  colorBy: 'folder' | 'tag' | 'none'
): Map<string, { color: string; count: number }> {
  const groups = new Map<string, { color: string; count: number }>();

  if (colorBy === 'none') {
    return groups;
  }

  graphData.nodes.forEach((node) => {
    if (node.type === 'note') {
      let groupKey: string | undefined;

      if (colorBy === 'folder') {
        groupKey = node.metadata.folder || 'root';
      } else if (colorBy === 'tag' && node.metadata.tags && node.metadata.tags.length > 0) {
        groupKey = node.metadata.tags[0];
      }

      if (groupKey) {
        const existing = groups.get(groupKey);
        if (existing) {
          existing.count++;
        } else {
          groups.set(groupKey, { color: node.color, count: 1 });
        }
      }
    }
  });

  return groups;
}
