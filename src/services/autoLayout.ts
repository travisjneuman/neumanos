/**
 * Auto-Layout Service
 * Algorithms for automatic diagram arrangement
 */

import type { DiagramElement, Point } from '../types/diagrams';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

export interface LayoutResult {
  elements: DiagramElement[];
}

/**
 * Tree Layout (Hierarchical Top-Down)
 * Arranges elements in a tree structure
 */
export function applyTreeLayout(elements: DiagramElement[]): LayoutResult {
  if (elements.length === 0) return { elements };

  // Build parent-child relationships from connectors
  const childMap = new Map<string, Set<string>>();
  const parentMap = new Map<string, string>();

  // Find connectors (arrows/lines) and build relationships
  const connectors = elements.filter(
    (el) => (el.type === 'arrow' || el.type === 'line') && el.startShapeId && el.endShapeId
  );

  connectors.forEach((connector) => {
    if (!connector.startShapeId || !connector.endShapeId) return;

    const parent = connector.startShapeId;
    const child = connector.endShapeId;

    if (!childMap.has(parent)) {
      childMap.set(parent, new Set());
    }
    childMap.get(parent)!.add(child);
    parentMap.set(child, parent);
  });

  // Find root nodes (elements with no parents)
  const roots = elements.filter(
    (el) => el.type !== 'arrow' && el.type !== 'line' && !parentMap.has(el.id)
  );

  if (roots.length === 0) {
    // No hierarchy detected, fall back to grid layout
    return applyGridLayout(elements);
  }

  // Layout configuration
  const HORIZONTAL_SPACING = 150;
  const VERTICAL_SPACING = 120;
  const START_X = 50;
  const START_Y = 50;

  // Position elements by level
  const positioned = new Map<string, Point>();
  const levelWidths = new Map<number, number>();

  function layoutNode(nodeId: string, level: number, xOffset: number): number {
    const node = elements.find((el) => el.id === nodeId);
    if (!node || positioned.has(nodeId)) return xOffset;

    const children = Array.from(childMap.get(nodeId) || []);
    let currentX = xOffset;

    // Layout children first (post-order traversal)
    const childPositions: number[] = [];
    children.forEach((childId) => {
      const childX = layoutNode(childId, level + 1, currentX);
      childPositions.push(currentX + (childX - currentX) / 2);
      currentX = childX + HORIZONTAL_SPACING;
    });

    // Position this node
    let nodeX: number;
    if (children.length === 0) {
      // Leaf node
      nodeX = xOffset;
    } else {
      // Parent node - center over children
      const minChildX = Math.min(...childPositions);
      const maxChildX = Math.max(...childPositions);
      nodeX = (minChildX + maxChildX) / 2;
    }

    const nodeY = START_Y + level * VERTICAL_SPACING;
    positioned.set(nodeId, { x: nodeX, y: nodeY });

    // Update level width
    const levelWidth = levelWidths.get(level) || 0;
    levelWidths.set(level, Math.max(levelWidth, nodeX + node.width));

    return children.length === 0 ? xOffset : currentX - HORIZONTAL_SPACING;
  }

  // Layout from each root
  let currentX = START_X;
  roots.forEach((root) => {
    const endX = layoutNode(root.id, 0, currentX);
    currentX = endX + HORIZONTAL_SPACING * 2; // Space between trees
  });

  // Apply positions to elements
  const updatedElements = elements.map((el) => {
    if (el.type === 'arrow' || el.type === 'line') {
      // Update connector endpoints
      const startPos = positioned.get(el.startShapeId || '');
      const endPos = positioned.get(el.endShapeId || '');

      if (startPos && endPos) {
        const startElement = elements.find((e) => e.id === el.startShapeId);
        const endElement = elements.find((e) => e.id === el.endShapeId);

        return {
          ...el,
          x: startPos.x + (startElement?.width || 0) / 2,
          y: startPos.y + (startElement?.height || 0),
          endPoint: {
            x: endPos.x + (endElement?.width || 0) / 2,
            y: endPos.y,
          },
        };
      }
      return el;
    }

    const pos = positioned.get(el.id);
    return pos ? { ...el, x: pos.x, y: pos.y } : el;
  });

  return { elements: updatedElements };
}

/**
 * Force-Directed Layout (Organic)
 * Uses D3 force simulation for natural arrangement
 */
export function applyForceLayout(elements: DiagramElement[]): LayoutResult {
  if (elements.length === 0) return { elements };

  // Filter out connectors for simulation
  const nodes = elements
    .filter((el) => el.type !== 'arrow' && el.type !== 'line')
    .map((el) => ({
      id: el.id,
      x: el.x + el.width / 2,
      y: el.y + el.height / 2,
      width: el.width,
      height: el.height,
    }));

  // Build links from connectors
  const links = elements
    .filter((el) => (el.type === 'arrow' || el.type === 'line') && el.startShapeId && el.endShapeId)
    .map((el) => ({
      source: el.startShapeId!,
      target: el.endShapeId!,
    }));

  // Run force simulation
  const simulation = forceSimulation(nodes as any)
    .force(
      'link',
      forceLink(links as any)
        .id((d: any) => d.id)
        .distance(150)
    )
    .force('charge', forceManyBody().strength(-500))
    .force('center', forceCenter(400, 300))
    .force(
      'collision',
      forceCollide().radius((d: any) => Math.max(d.width, d.height) / 2 + 20)
    )
    .stop();

  // Run simulation synchronously
  for (let i = 0; i < 300; ++i) {
    simulation.tick();
  }

  // Apply positions to elements
  const nodePositions = new Map(
    nodes.map((n) => [n.id, { x: n.x! - n.width / 2, y: n.y! - n.height / 2 }])
  );

  const updatedElements = elements.map((el) => {
    if (el.type === 'arrow' || el.type === 'line') {
      // Update connector endpoints
      const startPos = nodePositions.get(el.startShapeId || '');
      const endPos = nodePositions.get(el.endShapeId || '');

      if (startPos && endPos) {
        const startElement = elements.find((e) => e.id === el.startShapeId);
        const endElement = elements.find((e) => e.id === el.endShapeId);

        return {
          ...el,
          x: startPos.x + (startElement?.width || 0) / 2,
          y: startPos.y + (startElement?.height || 0) / 2,
          endPoint: {
            x: endPos.x + (endElement?.width || 0) / 2,
            y: endPos.y + (endElement?.height || 0) / 2,
          },
        };
      }
      return el;
    }

    const pos = nodePositions.get(el.id);
    return pos ? { ...el, x: pos.x, y: pos.y } : el;
  });

  return { elements: updatedElements };
}

/**
 * Grid Layout (Snap to Grid with Even Spacing)
 * Arranges elements in a uniform grid
 */
export function applyGridLayout(elements: DiagramElement[]): LayoutResult {
  if (elements.length === 0) return { elements };

  // Filter shapes (exclude connectors)
  const shapes = elements.filter((el) => el.type !== 'arrow' && el.type !== 'line');

  if (shapes.length === 0) return { elements };

  // Grid configuration
  const GRID_SIZE = 20;
  const PADDING = 40;
  const MIN_SPACING_X = 150;
  const MIN_SPACING_Y = 120;

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(shapes.length));

  // Find max dimensions for uniform sizing
  const maxWidth = Math.max(...shapes.map((s) => s.width));
  const maxHeight = Math.max(...shapes.map((s) => s.height));

  const cellWidth = Math.max(maxWidth + MIN_SPACING_X, MIN_SPACING_X);
  const cellHeight = Math.max(maxHeight + MIN_SPACING_Y, MIN_SPACING_Y);

  // Snap to grid
  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  // Position shapes in grid
  const positioned = new Map<string, Point>();

  shapes.forEach((shape, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const x = snapToGrid(PADDING + col * cellWidth);
    const y = snapToGrid(PADDING + row * cellHeight);

    positioned.set(shape.id, { x, y });
  });

  // Apply positions
  const updatedElements = elements.map((el) => {
    if (el.type === 'arrow' || el.type === 'line') {
      // Update connector endpoints
      const startPos = positioned.get(el.startShapeId || '');
      const endPos = positioned.get(el.endShapeId || '');

      if (startPos && endPos) {
        const startElement = elements.find((e) => e.id === el.startShapeId);
        const endElement = elements.find((e) => e.id === el.endShapeId);

        return {
          ...el,
          x: startPos.x + (startElement?.width || 0) / 2,
          y: startPos.y + (startElement?.height || 0) / 2,
          endPoint: {
            x: endPos.x + (endElement?.width || 0) / 2,
            y: endPos.y + (endElement?.height || 0) / 2,
          },
        };
      }
      return el;
    }

    const pos = positioned.get(el.id);
    return pos ? { ...el, x: pos.x, y: pos.y } : el;
  });

  return { elements: updatedElements };
}

/**
 * Apply layout algorithm based on type
 */
export function applyLayout(
  elements: DiagramElement[],
  algorithm: 'tree' | 'force' | 'grid',
  selectedIds?: string[]
): LayoutResult {
  // If specific elements selected, only layout those
  const elementsToLayout = selectedIds && selectedIds.length > 0
    ? elements.filter((el) => selectedIds.includes(el.id) ||
        (el.type === 'arrow' || el.type === 'line') &&
        (selectedIds.includes(el.startShapeId || '') || selectedIds.includes(el.endShapeId || '')))
    : elements;

  const otherElements = selectedIds && selectedIds.length > 0
    ? elements.filter((el) => !selectedIds.includes(el.id) &&
        !(el.type === 'arrow' || el.type === 'line') ||
        (!selectedIds.includes(el.startShapeId || '') && !selectedIds.includes(el.endShapeId || '')))
    : [];

  let result: LayoutResult;

  switch (algorithm) {
    case 'tree':
      result = applyTreeLayout(elementsToLayout);
      break;
    case 'force':
      result = applyForceLayout(elementsToLayout);
      break;
    case 'grid':
      result = applyGridLayout(elementsToLayout);
      break;
    default:
      return { elements };
  }

  // Merge with unselected elements
  if (otherElements.length > 0) {
    return {
      elements: [...result.elements, ...otherElements].sort((a, b) => a.zIndex - b.zIndex),
    };
  }

  return result;
}
