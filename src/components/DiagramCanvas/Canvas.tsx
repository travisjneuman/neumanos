/**
 * Diagram Canvas Component
 * Konva Stage wrapper with infinite canvas, grid, pan, zoom
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text as KonvaText, Arrow, Transformer, Path } from 'react-konva';
import type Konva from 'konva';
import { useDiagramsStore } from '../../stores/useDiagramsStore';
import { useDiagramEditorStore } from '../../stores/useDiagramEditorStore';
import { getShapeDefinition } from '../../data/shapes/shapesLibrary';
import type { DiagramElement } from '../../types/diagrams';

interface CanvasProps {
  diagramId: string;
  width: number;
  height: number;
}

export function Canvas({ diagramId, width, height }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const diagram = useDiagramsStore((s) => s.getDiagram(diagramId));
  const updateDiagram = useDiagramsStore((s) => s.updateDiagram);

  const currentTool = useDiagramEditorStore((s) => s.currentTool);
  const selectedElementIds = useDiagramEditorStore((s) => s.selectedElementIds);
  const selectElement = useDiagramEditorStore((s) => s.selectElement);
  const clearSelection = useDiagramEditorStore((s) => s.clearSelection);

  const [elements, setElements] = useState<DiagramElement[]>(diagram?.elements || []);

  // Canvas pan/zoom state for infinite canvas
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Sync elements from diagram store
  useEffect(() => {
    if (diagram) {
      setElements(diagram.elements);
    }
  }, [diagram]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    const selectedNodes = selectedElementIds
      .map((id) => stageRef.current?.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== undefined);

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedElementIds]);

  // Handle canvas drag (panning) - update in real-time for grid to follow
  const handleStageDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Only update position if dragging the stage itself (not an element)
    if (e.target === e.target.getStage()) {
      setStagePos({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  }, []);

  // Handle wheel for zooming
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    // Zoom in/out with scroll
    const scaleBy = 1.1;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    // Clamp scale between 0.1 and 5
    const clampedScale = Math.min(5, Math.max(0.1, newScale));

    setScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [scale, stagePos]);

  if (!diagram) return null;

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty area - deselect
    if (e.target === e.target.getStage()) {
      clearSelection();
      return;
    }
  };

  const handleElementClick = (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
    // P1: Prevent interaction with locked elements
    const element = elements.find((el) => el.id === id);
    if (element?.locked) return;

    if (currentTool === 'select') {
      e.cancelBubble = true;
      selectElement(id, e.evt.shiftKey);
    }
  };

  const handleElementDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const draggedElement = elements.find((el) => el.id === id);
    if (!draggedElement) return;

    const deltaX = node.x() - draggedElement.x;
    const deltaY = node.y() - draggedElement.y;

    // If element is grouped, move all elements in the group
    if (draggedElement.groupId) {
      const updatedElements = elements.map((el) => {
        if (el.groupId === draggedElement.groupId) {
          return { ...el, x: el.x + deltaX, y: el.y + deltaY };
        }
        return el;
      });

      setElements(updatedElements);
      updateDiagram(diagramId, { elements: updatedElements });
    } else {
      // Move single element
      const updatedElements = elements.map((el) =>
        el.id === id ? { ...el, x: node.x(), y: node.y() } : el
      );

      setElements(updatedElements);
      updateDiagram(diagramId, { elements: updatedElements });
    }
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height
    node.scaleX(1);
    node.scaleY(1);

    const updatedElements = elements.map((el) =>
      el.id === id
        ? {
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          }
        : el
    );

    setElements(updatedElements);
    updateDiagram(diagramId, { elements: updatedElements });
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={scale}
      scaleY={scale}
      onClick={handleStageClick}
      onWheel={handleWheel}
      onDragMove={handleStageDragMove}
      draggable={currentTool === 'select'}
      className="bg-surface-light dark:bg-surface-dark"
    >
      {/* Grid Layer - renders infinite grid based on viewport */}
      <Layer listening={false}>
        <InfiniteGrid
          width={width}
          height={height}
          gridSize={diagram.canvasState.gridSize}
          stagePos={stagePos}
          scale={scale}
        />
      </Layer>

      {/* Elements Layer */}
      <Layer>
        {elements
          .filter((element) => !element.hidden) // P1: Filter out hidden elements
          .map((element) => (
            <DiagramElementComponent
              key={element.id}
              element={element}
              onClick={(e) => handleElementClick(element.id, e)}
              onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              onTransformEnd={(e) => handleTransformEnd(element.id, e)}
              draggable={currentTool === 'select' && !element.locked} // P1: Disable dragging locked elements
            />
          ))}

        {/* Transformer for selected elements */}
        <Transformer ref={transformerRef} />
      </Layer>
    </Stage>
  );
}

// Infinite Grid Component - draws grid lines relative to viewport
interface InfiniteGridProps {
  width: number;
  height: number;
  gridSize: number;
  stagePos: { x: number; y: number };
  scale: number;
}

function InfiniteGrid({ width, height, gridSize, stagePos, scale }: InfiniteGridProps) {
  const lines: React.ReactElement[] = [];

  // Calculate the visible area in canvas coordinates
  // The stage position is negative when panned (canvas moves opposite to drag)
  const viewLeft = -stagePos.x / scale;
  const viewTop = -stagePos.y / scale;
  const viewRight = viewLeft + width / scale;
  const viewBottom = viewTop + height / scale;

  // Add buffer for smooth scrolling (render extra lines outside viewport)
  const buffer = gridSize * 2;
  const startX = Math.floor((viewLeft - buffer) / gridSize) * gridSize;
  const endX = Math.ceil((viewRight + buffer) / gridSize) * gridSize;
  const startY = Math.floor((viewTop - buffer) / gridSize) * gridSize;
  const endY = Math.ceil((viewBottom + buffer) / gridSize) * gridSize;

  // Vertical lines
  for (let x = startX; x <= endX; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke="#333333"
        strokeWidth={0.5 / scale} // Keep consistent line width regardless of zoom
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke="#333333"
        strokeWidth={0.5 / scale}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}

// Diagram Element Component (renders different shapes)
interface DiagramElementComponentProps {
  element: DiagramElement;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
  draggable: boolean;
}

function DiagramElementComponent({
  element,
  onClick,
  onDragEnd,
  onTransformEnd,
  draggable,
}: DiagramElementComponentProps) {
  const commonProps = {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    draggable,
    onClick,
    onDragEnd,
    onTransformEnd,
  };

  const styleProps = {
    fill: element.fill || 'transparent',
    stroke: element.stroke || '#000000',
    strokeWidth: element.strokeWidth || 2,
  };

  // P0: Handle shape library shapes
  if (element.type === 'shape' && element.shapeId) {
    const shapeDef = getShapeDefinition(element.shapeId);

    // Path-based shape
    if (element.pathData || shapeDef?.pathData) {
      return (
        <Path
          {...commonProps}
          {...styleProps}
          data={element.pathData || shapeDef?.pathData || ''}
          scaleX={element.width / (shapeDef?.defaultProps.width || element.width)}
          scaleY={element.height / (shapeDef?.defaultProps.height || element.height)}
        />
      );
    }

    // Primitive-based shape
    if (shapeDef?.primitiveType === 'rectangle') {
      return (
        <Rect
          {...commonProps}
          {...styleProps}
          width={element.width}
          height={element.height}
          cornerRadius={element.cornerRadius || 0}
        />
      );
    }

    if (shapeDef?.primitiveType === 'circle') {
      return (
        <Circle
          {...commonProps}
          {...styleProps}
          radius={Math.min(element.width, element.height) / 2}
        />
      );
    }

    if (shapeDef?.primitiveType === 'ellipse') {
      return (
        <Circle
          {...commonProps}
          {...styleProps}
          radiusX={element.width / 2}
          radiusY={element.height / 2}
        />
      );
    }
  }

  switch (element.type) {
    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          {...styleProps}
          width={element.width}
          height={element.height}
          cornerRadius={element.cornerRadius || 0}
        />
      );

    case 'circle':
      return (
        <Circle
          {...commonProps}
          {...styleProps}
          radius={Math.min(element.width, element.height) / 2}
        />
      );

    case 'ellipse':
      return (
        <Circle
          {...commonProps}
          {...styleProps}
          radiusX={element.width / 2}
          radiusY={element.height / 2}
        />
      );

    case 'text':
      return (
        <KonvaText
          {...commonProps}
          text={element.text || 'Text'}
          fontSize={element.fontSize || 16}
          fontFamily={element.fontFamily || 'Arial'}
          fontStyle={element.fontWeight === 'bold' ? 'bold' : 'normal'}
          fill={element.fill || '#000000'}
          align={element.textAlign || 'left'}
          width={element.width}
        />
      );

    case 'line':
      return (
        <Line
          {...commonProps}
          {...styleProps}
          points={[
            0,
            0,
            element.endPoint ? element.endPoint.x - element.x : element.width,
            element.endPoint ? element.endPoint.y - element.y : element.height,
          ]}
        />
      );

    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          {...styleProps}
          points={[
            0,
            0,
            element.endPoint ? element.endPoint.x - element.x : element.width,
            element.endPoint ? element.endPoint.y - element.y : element.height,
          ]}
          pointerLength={10}
          pointerWidth={10}
        />
      );

    default:
      return null;
  }
}
