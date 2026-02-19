/**
 * Shape Library Types
 * Defines pre-built shapes for diagrams (flowcharts, UML, network, etc.)
 */

import type { DiagramElement } from './diagrams';

export type ShapeCategory =
  | 'flowchart'
  | 'basic'
  | 'uml'
  | 'network'
  | 'cloud-computing' // P2
  | 'people' // P2
  | 'data-flow' // P2
  | 'charts'; // P2

export interface ShapeDefinition {
  id: string;
  name: string;
  category: ShapeCategory;
  keywords: string[]; // For search/filter
  thumbnail: string; // Icon name or SVG preview

  // Shape can be either a primitive or custom path
  primitiveType?: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'diamond';
  pathData?: string; // SVG path for complex shapes

  // Default properties when shape is added to canvas
  defaultProps: Partial<DiagramElement>;
}

export interface ShapeLibrary {
  flowchart: ShapeDefinition[];
  basic: ShapeDefinition[];
  uml: ShapeDefinition[];
  network: ShapeDefinition[];
  'cloud-computing': ShapeDefinition[]; // P2
  people: ShapeDefinition[]; // P2
  'data-flow': ShapeDefinition[]; // P2
  charts: ShapeDefinition[]; // P2
}
