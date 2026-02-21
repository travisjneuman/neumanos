/**
 * PresentationCanvas Component
 *
 * Konva Stage for rendering a single slide.
 * Handles element rendering, selection, and transformation.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Text as KonvaText,
  Circle,
  Line,
  Arrow,
  Image as KonvaImage,
  Transformer,
  Group,
} from 'react-konva';
import type Konva from 'konva';
import useImage from 'use-image';
import type { Slide, SlideElement } from '../../types';

// Standard presentation dimensions (16:9)
export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

interface PresentationCanvasProps {
  slide: Slide;
  containerWidth: number;
  containerHeight: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onAddElement?: (element: SlideElement) => void;
  currentTool: 'select' | 'text' | 'rectangle' | 'ellipse' | 'line' | 'arrow' | 'image';
  isEditable?: boolean;
}

// Background image component for slides
function SlideBackgroundImage({
  imageUrl,
  width,
  height,
}: {
  imageUrl: string;
  width: number;
  height: number;
}) {
  const [image] = useImage(imageUrl, 'anonymous');

  return (
    <KonvaImage
      x={0}
      y={0}
      width={width}
      height={height}
      image={image}
      listening={false}
    />
  );
}

// Image element component
function ImageElement({
  element,
  onClick,
  onDragEnd,
  onTransformEnd,
}: {
  element: SlideElement;
  onClick: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const [image] = useImage(element.image?.src || '', 'anonymous');

  return (
    <KonvaImage
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation || 0}
      opacity={element.opacity || 1}
      image={image}
      draggable
      onClick={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

export function PresentationCanvas({
  slide,
  containerWidth,
  containerHeight,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onAddElement,
  currentTool,
  isEditable = true,
}: PresentationCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);

  // Calculate scale to fit container while maintaining aspect ratio
  const scale = Math.min(
    containerWidth / SLIDE_WIDTH,
    containerHeight / SLIDE_HEIGHT
  );

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current || !isEditable) return;

    if (selectedElementId) {
      const selectedNode = stageRef.current.findOne(`#${selectedElementId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
      } else {
        transformerRef.current.nodes([]);
      }
    } else {
      transformerRef.current.nodes([]);
    }

    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedElementId, isEditable]);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Click on empty area - deselect
      if (e.target === e.target.getStage()) {
        onSelectElement(null);
      }
    },
    [onSelectElement]
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isEditable || currentTool === 'select' || currentTool === 'image') return;
      if (e.target !== e.target.getStage()) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to unscaled coordinates
      const x = pointer.x / scale;
      const y = pointer.y / scale;

      setIsDrawing(true);
      setDrawStart({ x, y });
    },
    [currentTool, scale, isEditable]
  );

  const handleStageMouseUp = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing || !drawStart || !onAddElement || !isEditable) {
        setIsDrawing(false);
        setDrawStart(null);
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const endX = pointer.x / scale;
      const endY = pointer.y / scale;

      const width = Math.abs(endX - drawStart.x);
      const height = Math.abs(endY - drawStart.y);
      const x = Math.min(drawStart.x, endX);
      const y = Math.min(drawStart.y, endY);

      // Minimum size to create element - just create text on single click
      if (width < 20 && height < 20) {
        // Text tool: create with default size on click
        if ((currentTool as string) === 'text') {
          const newElement: SlideElement = {
            id: crypto.randomUUID(),
            type: 'text',
            x: drawStart.x,
            y: drawStart.y,
            width: 300,
            height: 50,
            text: {
              content: 'Text',
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: 'normal',
              fontStyle: 'normal',
              textAlign: 'left',
              color: '#1F2937',
            },
          };
          onAddElement(newElement);
          onSelectElement(newElement.id);
        }
        setIsDrawing(false);
        setDrawStart(null);
        return;
      }

      let newElement: SlideElement | null = null;

      switch (currentTool) {
        case 'text':
          newElement = {
            id: crypto.randomUUID(),
            type: 'text',
            x,
            y,
            width: Math.max(width, 100),
            height: Math.max(height, 40),
            text: {
              content: 'Text',
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: 'normal',
              fontStyle: 'normal',
              textAlign: 'left',
              color: '#1F2937',
            },
          };
          break;
        case 'rectangle':
          newElement = {
            id: crypto.randomUUID(),
            type: 'shape',
            x,
            y,
            width,
            height,
            shape: {
              type: 'rectangle',
              fill: '#E5E7EB',
              stroke: '#374151',
              strokeWidth: 2,
            },
          };
          break;
        case 'ellipse':
          newElement = {
            id: crypto.randomUUID(),
            type: 'shape',
            x,
            y,
            width,
            height,
            shape: {
              type: 'ellipse',
              fill: '#E5E7EB',
              stroke: '#374151',
              strokeWidth: 2,
            },
          };
          break;
        case 'line':
          newElement = {
            id: crypto.randomUUID(),
            type: 'shape',
            x: drawStart.x,
            y: drawStart.y,
            width: endX - drawStart.x,
            height: endY - drawStart.y,
            shape: {
              type: 'line',
              fill: 'transparent',
              stroke: '#374151',
              strokeWidth: 3,
            },
          };
          break;
        case 'arrow':
          newElement = {
            id: crypto.randomUUID(),
            type: 'shape',
            x: drawStart.x,
            y: drawStart.y,
            width: endX - drawStart.x,
            height: endY - drawStart.y,
            shape: {
              type: 'arrow',
              fill: '#374151',
              stroke: '#374151',
              strokeWidth: 3,
            },
          };
          break;
      }

      if (newElement) {
        onAddElement(newElement);
        onSelectElement(newElement.id);
      }

      setIsDrawing(false);
      setDrawStart(null);
    },
    [isDrawing, drawStart, currentTool, scale, onAddElement, onSelectElement, isEditable]
  );

  const handleElementClick = useCallback(
    (id: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isEditable) return;
      e.cancelBubble = true;
      onSelectElement(id);
    },
    [onSelectElement, isEditable]
  );

  const handleDragEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
      if (!isEditable) return;
      const node = e.target;
      onUpdateElement(id, {
        x: node.x(),
        y: node.y(),
      });
    },
    [onUpdateElement, isEditable]
  );

  const handleTransformEnd = useCallback(
    (id: string, e: Konva.KonvaEventObject<Event>) => {
      if (!isEditable) return;
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and apply to width/height
      node.scaleX(1);
      node.scaleY(1);

      onUpdateElement(id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * scaleX),
        height: Math.max(10, node.height() * scaleY),
        rotation: node.rotation(),
      });
    },
    [onUpdateElement, isEditable]
  );

  const renderBackground = () => {
    const bg = slide.background;

    if (bg.type === 'image' && bg.imageUrl) {
      return (
        <SlideBackgroundImage
          imageUrl={bg.imageUrl}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
        />
      );
    }

    if (bg.type === 'gradient' && bg.gradient) {
      const firstStop = bg.gradient.stops[0];
      return (
        <Rect
          x={0}
          y={0}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          fill={firstStop?.color || '#FFFFFF'}
          listening={false}
        />
      );
    }

    return (
      <Rect
        x={0}
        y={0}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        fill={bg.color || '#FFFFFF'}
        listening={false}
      />
    );
  };

  const renderElement = (element: SlideElement) => {
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      opacity: element.opacity || 1,
      draggable: isEditable,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(element.id, e),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(element.id, e),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(element.id, e),
    };

    switch (element.type) {
      case 'text':
        return (
          <KonvaText
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            text={element.text?.content || 'Text'}
            fontSize={element.text?.fontSize || 32}
            fontFamily={element.text?.fontFamily || 'Inter'}
            fontStyle={
              `${element.text?.fontWeight === 'bold' ? 'bold ' : ''}${element.text?.fontStyle === 'italic' ? 'italic' : ''}`.trim() || 'normal'
            }
            fill={element.text?.color || '#1F2937'}
            align={element.text?.textAlign || 'left'}
            verticalAlign="middle"
          />
        );

      case 'shape':
        if (element.shape?.type === 'ellipse') {
          return (
            <Group key={element.id} {...commonProps}>
              <Circle
                x={element.width / 2}
                y={element.height / 2}
                radiusX={element.width / 2}
                radiusY={element.height / 2}
                fill={element.shape?.fill || '#E5E7EB'}
                stroke={element.shape?.stroke || '#374151'}
                strokeWidth={element.shape?.strokeWidth || 2}
              />
            </Group>
          );
        }

        if (element.shape?.type === 'line') {
          return (
            <Line
              key={element.id}
              {...commonProps}
              points={[0, 0, element.width, element.height]}
              stroke={element.shape?.stroke || '#374151'}
              strokeWidth={element.shape?.strokeWidth || 3}
            />
          );
        }

        if (element.shape?.type === 'arrow') {
          return (
            <Arrow
              key={element.id}
              {...commonProps}
              points={[0, 0, element.width, element.height]}
              fill={element.shape?.fill || '#374151'}
              stroke={element.shape?.stroke || '#374151'}
              strokeWidth={element.shape?.strokeWidth || 3}
              pointerLength={15}
              pointerWidth={15}
            />
          );
        }

        // Rectangle (default)
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            fill={element.shape?.fill || '#E5E7EB'}
            stroke={element.shape?.stroke || '#374151'}
            strokeWidth={element.shape?.strokeWidth || 2}
            cornerRadius={4}
          />
        );

      case 'image':
        return (
          <ImageElement
            key={element.id}
            element={element}
            onClick={() => handleElementClick(element.id, {} as Konva.KonvaEventObject<MouseEvent>)}
            onDragEnd={(e) => handleDragEnd(element.id, e)}
            onTransformEnd={(e) => handleTransformEnd(element.id, e)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="flex items-center justify-center bg-surface-light-alt dark:bg-surface-dark"
      style={{ width: containerWidth, height: containerHeight }}
    >
      <div
        className="shadow-lg"
        style={{
          width: SLIDE_WIDTH * scale,
          height: SLIDE_HEIGHT * scale,
        }}
      >
        <Stage
          ref={stageRef}
          width={SLIDE_WIDTH * scale}
          height={SLIDE_HEIGHT * scale}
          scaleX={scale}
          scaleY={scale}
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
          style={{ cursor: currentTool === 'select' ? 'default' : 'crosshair' }}
        >
          <Layer>
            {/* Background */}
            {renderBackground()}

            {/* Elements */}
            {slide.elements.map(renderElement)}

            {/* Transformer for selection */}
            {isEditable && <Transformer ref={transformerRef} />}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
