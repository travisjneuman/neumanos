/**
 * Diagram Types
 * Custom diagram editor data models
 */

export type DiagramElementType =
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'text'
  | 'freehand'
  | 'connector'
  | 'shape'; // P0: Shape library shapes

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FontWeight = 'normal' | 'bold';
export type TextAlign = 'left' | 'center' | 'right';
export type ConnectorType = 'straight' | 'curved' | 'orthogonal';

// P2: Hand-drawn style
export type DrawingStyle = 'normal' | 'hand-drawn' | 'cartoon';

export interface Point {
  x: number;
  y: number;
}

export interface CanvasState {
  zoom: number; // 1.0 = 100%
  pan: Point; // viewport offset
  gridSize: number; // 20px default
  snapToGrid: boolean;
}

export interface DiagramElement {
  id: string;
  type: DiagramElementType;

  // P0: Shape library reference
  shapeId?: string; // References ShapeDefinition if type === 'shape'
  pathData?: string; // SVG path for custom shapes

  // Position & size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees

  // Styling
  fill?: string; // hex color or 'transparent'
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  cornerRadius?: number; // for rectangles

  // P2: Hand-drawn style
  drawingStyle?: DrawingStyle; // default: 'normal'
  roughness?: number; // 0-3, how sketchy the lines are
  bowing?: number; // 0-5, how much lines curve

  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: FontWeight;
  textAlign?: TextAlign;

  // Connector-specific
  startPoint?: Point;
  endPoint?: Point;
  startShapeId?: string; // smart connector source
  endShapeId?: string; // smart connector target
  startArrow?: boolean;
  endArrow?: boolean;
  connectorType?: ConnectorType;

  // Path-specific (freehand)
  points?: Point[];

  // Z-index
  zIndex: number;

  // P0: Grouping support
  groupId?: string; // ID of group this element belongs to

  // P1: Layer management
  locked?: boolean; // Prevent editing/moving
  hidden?: boolean; // Hide from view
}

export interface DiagramGroup {
  id: string;
  elementIds: string[];
  createdAt: Date;
}

export interface Diagram {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string; // base64 PNG

  // Canvas state
  canvasState: CanvasState;

  // Elements
  elements: DiagramElement[];

  // P0: Groups
  groups?: DiagramGroup[];

  // Metadata
  tags?: string[];
  linkedNotes?: string[];
  linkedTasks?: string[];
}

export type ToolType = 'select' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'pen' | 'connector';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute';

export interface EditorState {
  currentTool: ToolType;
  selectedElementIds: string[];
  clipboard: DiagramElement[];
  isDragging: boolean;
  isDrawing: boolean;
}

export interface HistoryEntry {
  elements: DiagramElement[];
  canvasState: CanvasState;
}

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf' | 'json';
  fullDiagram?: boolean; // export entire diagram vs current viewport
  scale?: number; // for PNG export (1 = normal, 2 = 2x resolution)
}

// P1: Templates
export interface DiagramTemplate {
  id: string;
  name: string;
  description: string;
  category: 'flowchart' | 'orgchart' | 'system' | 'user-flow' | 'mindmap' | 'other';
  thumbnail?: string; // base64 PNG or URL
  elements: DiagramElement[];
  canvasState: Partial<CanvasState>;
}

// P1: Auto-layout
export type LayoutAlgorithm = 'tree' | 'force' | 'grid';

// P1: Layer management
export interface LayerState {
  locked: boolean;
  visible: boolean;
}
