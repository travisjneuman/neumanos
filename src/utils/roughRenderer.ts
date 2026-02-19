/**
 * Rough.js Renderer for Hand-Drawn Style Diagrams
 * Converts Konva shapes to Rough.js for sketchy, hand-drawn appearance
 */

import rough from 'roughjs';
import type { DiagramElement, DrawingStyle } from '../types/diagrams';

// Cache for rendered rough shapes to prevent re-rendering every frame
const roughCache = new Map<string, string>();

/**
 * Generate a cache key for a diagram element
 */
function getCacheKey(element: DiagramElement): string {
  return `${element.id}-${element.drawingStyle}-${element.roughness}-${element.bowing}-${element.width}-${element.height}-${element.rotation || 0}`;
}

/**
 * Render a diagram element with Rough.js for hand-drawn style
 * Returns SVG path data that can be applied to Konva shapes
 */
export function renderRoughShape(
  element: DiagramElement,
  roughness = 1,
  bowing = 1
): string {
  const cacheKey = getCacheKey(element);

  // Return cached version if available
  if (roughCache.has(cacheKey)) {
    return roughCache.get(cacheKey)!;
  }

  // Create a temporary SVG element for Rough.js
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const rc = rough.svg(svg);

  let roughElement: SVGGElement | null = null;

  // Render based on element type
  switch (element.type) {
    case 'rectangle':
      roughElement = rc.rectangle(
        0,
        0,
        element.width,
        element.height,
        {
          roughness,
          bowing,
          stroke: element.stroke || '#000000',
          strokeWidth: element.strokeWidth || 2,
          fill: element.fill && element.fill !== 'transparent' ? element.fill : undefined,
          fillStyle: 'solid',
        }
      );
      break;

    case 'circle': {
      const diameter = Math.min(element.width, element.height);
      roughElement = rc.circle(
        element.width / 2,
        element.height / 2,
        diameter,
        {
          roughness,
          bowing,
          stroke: element.stroke || '#000000',
          strokeWidth: element.strokeWidth || 2,
          fill: element.fill && element.fill !== 'transparent' ? element.fill : undefined,
          fillStyle: 'solid',
        }
      );
      break;
    }

    case 'ellipse':
      roughElement = rc.ellipse(
        element.width / 2,
        element.height / 2,
        element.width,
        element.height,
        {
          roughness,
          bowing,
          stroke: element.stroke || '#000000',
          strokeWidth: element.strokeWidth || 2,
          fill: element.fill && element.fill !== 'transparent' ? element.fill : undefined,
          fillStyle: 'solid',
        }
      );
      break;

    case 'line':
    case 'arrow':
      if (element.startPoint && element.endPoint) {
        roughElement = rc.line(
          element.startPoint.x,
          element.startPoint.y,
          element.endPoint.x,
          element.endPoint.y,
          {
            roughness,
            bowing,
            stroke: element.stroke || '#000000',
            strokeWidth: element.strokeWidth || 2,
          }
        );
      }
      break;

    case 'connector':
      if (element.startPoint && element.endPoint) {
        roughElement = rc.line(
          element.startPoint.x,
          element.startPoint.y,
          element.endPoint.x,
          element.endPoint.y,
          {
            roughness,
            bowing: bowing * 2, // Extra bowing for connectors
            stroke: element.stroke || '#000000',
            strokeWidth: element.strokeWidth || 2,
          }
        );
      }
      break;

    case 'freehand':
      if (element.points && element.points.length > 1) {
        const points = element.points.map((p) => [p.x, p.y] as [number, number]);
        roughElement = rc.linearPath(points, {
          roughness,
          bowing,
          stroke: element.stroke || '#000000',
          strokeWidth: element.strokeWidth || 2,
        });
      }
      break;

    case 'shape':
      // For custom shapes from library, fall back to rectangle outline
      roughElement = rc.rectangle(
        0,
        0,
        element.width,
        element.height,
        {
          roughness,
          bowing,
          stroke: element.stroke || '#000000',
          strokeWidth: element.strokeWidth || 2,
          fill: element.fill && element.fill !== 'transparent' ? element.fill : undefined,
          fillStyle: 'solid',
        }
      );
      break;

    default:
      // Text elements don't need rough rendering
      return '';
  }

  if (!roughElement) {
    return '';
  }

  // Extract path data from the rough element
  const paths = roughElement.querySelectorAll('path');
  let pathData = '';

  paths.forEach((path) => {
    if (path.getAttribute('d')) {
      pathData += path.getAttribute('d') + ' ';
    }
  });

  // Cache the result
  roughCache.set(cacheKey, pathData.trim());

  return pathData.trim();
}

/**
 * Apply hand-drawn style to a Konva shape
 * This modifies the shape's rendering to use Rough.js
 */
export function applyHandDrawnStyle(
  element: DiagramElement,
  style: DrawingStyle = 'normal'
): string | null {
  if (style === 'normal') {
    return null; // No rough rendering for normal style
  }

  // Cartoon style: lower roughness, higher bowing
  if (style === 'cartoon') {
    return renderRoughShape(element, 0.5, 3);
  }

  // Hand-drawn style: use element's custom roughness/bowing or defaults
  const roughness = element.roughness ?? 1.5;
  const bowing = element.bowing ?? 1;

  return renderRoughShape(element, roughness, bowing);
}

/**
 * Clear the rough shape cache
 * Call this when shapes are deleted or modified significantly
 */
export function clearRoughCache(elementId?: string): void {
  if (elementId) {
    // Clear cache entries for specific element
    const keysToDelete: string[] = [];
    roughCache.forEach((_, key) => {
      if (key.startsWith(elementId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => roughCache.delete(key));
  } else {
    // Clear entire cache
    roughCache.clear();
  }
}

/**
 * Get rough rendering configuration for a style preset
 */
export function getRoughConfig(style: DrawingStyle): { roughness: number; bowing: number } {
  switch (style) {
    case 'hand-drawn':
      return { roughness: 1.5, bowing: 1 };
    case 'cartoon':
      return { roughness: 0.5, bowing: 3 };
    case 'normal':
    default:
      return { roughness: 0, bowing: 0 };
  }
}
