/**
 * PresentationSidebar Component
 *
 * Slide thumbnail navigation for the presentation editor.
 * Shows thumbnails of all slides with drag-to-reorder support.
 */

import { useRef } from 'react';
import { Stage, Layer, Rect, Text as KonvaText, Circle, Line, Arrow } from 'react-konva';
import type Konva from 'konva';
import { Plus } from 'lucide-react';
import type { Slide, SlideElement } from '../../types';
import { SLIDE_WIDTH } from './PresentationCanvas';

interface PresentationSidebarProps {
  slides: Slide[];
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onAddSlide: () => void;
  onReorderSlides?: (fromIndex: number, toIndex: number) => void;
}

// Thumbnail dimensions
const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 90;
const THUMB_SCALE = THUMB_WIDTH / SLIDE_WIDTH;

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function SlideThumbnail({ slide, index, isActive, onClick }: SlideThumbnailProps) {
  const stageRef = useRef<Konva.Stage>(null);

  const renderElement = (element: SlideElement) => {
    const common = {
      id: element.id,
      x: element.x * THUMB_SCALE,
      y: element.y * THUMB_SCALE,
      rotation: element.rotation || 0,
      opacity: element.opacity || 1,
      listening: false,
    };

    switch (element.type) {
      case 'text':
        return (
          <KonvaText
            key={element.id}
            {...common}
            width={element.width * THUMB_SCALE}
            height={element.height * THUMB_SCALE}
            text={element.text?.content || 'Text'}
            fontSize={(element.text?.fontSize || 32) * THUMB_SCALE}
            fontFamily={element.text?.fontFamily || 'Inter'}
            fill={element.text?.color || '#1F2937'}
          />
        );

      case 'shape':
        if (element.shape?.type === 'ellipse') {
          return (
            <Circle
              key={element.id}
              {...common}
              x={(element.x + element.width / 2) * THUMB_SCALE}
              y={(element.y + element.height / 2) * THUMB_SCALE}
              radiusX={(element.width / 2) * THUMB_SCALE}
              radiusY={(element.height / 2) * THUMB_SCALE}
              fill={element.shape?.fill || '#E5E7EB'}
              stroke={element.shape?.stroke || '#374151'}
              strokeWidth={(element.shape?.strokeWidth || 2) * THUMB_SCALE}
            />
          );
        }

        if (element.shape?.type === 'line') {
          return (
            <Line
              key={element.id}
              {...common}
              points={[
                0,
                0,
                element.width * THUMB_SCALE,
                element.height * THUMB_SCALE,
              ]}
              stroke={element.shape?.stroke || '#374151'}
              strokeWidth={(element.shape?.strokeWidth || 3) * THUMB_SCALE}
            />
          );
        }

        if (element.shape?.type === 'arrow') {
          return (
            <Arrow
              key={element.id}
              {...common}
              points={[
                0,
                0,
                element.width * THUMB_SCALE,
                element.height * THUMB_SCALE,
              ]}
              fill={element.shape?.fill || '#374151'}
              stroke={element.shape?.stroke || '#374151'}
              strokeWidth={(element.shape?.strokeWidth || 3) * THUMB_SCALE}
              pointerLength={10 * THUMB_SCALE}
              pointerWidth={10 * THUMB_SCALE}
            />
          );
        }

        // Rectangle
        return (
          <Rect
            key={element.id}
            {...common}
            width={element.width * THUMB_SCALE}
            height={element.height * THUMB_SCALE}
            fill={element.shape?.fill || '#E5E7EB'}
            stroke={element.shape?.stroke || '#374151'}
            strokeWidth={(element.shape?.strokeWidth || 2) * THUMB_SCALE}
          />
        );

      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-accent-primary/10'
          : 'hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
      }`}
    >
      {/* Slide number */}
      <span
        className={`absolute top-1 left-1 text-xs font-medium z-10 ${
          isActive
            ? 'text-accent-primary'
            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
        }`}
      >
        {index + 1}
      </span>

      {/* Thumbnail canvas */}
      <div
        className={`rounded border-2 overflow-hidden ${
          isActive
            ? 'border-accent-primary shadow-md'
            : 'border-border-light dark:border-border-dark group-hover:border-accent-primary/50'
        }`}
      >
        <Stage ref={stageRef} width={THUMB_WIDTH} height={THUMB_HEIGHT}>
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={THUMB_WIDTH}
              height={THUMB_HEIGHT}
              fill={slide.background.color || '#FFFFFF'}
              listening={false}
            />

            {/* Elements */}
            {slide.elements.map(renderElement)}
          </Layer>
        </Stage>
      </div>
    </button>
  );
}

export function PresentationSidebar({
  slides,
  activeSlideIndex,
  onSlideSelect,
  onAddSlide,
}: PresentationSidebarProps) {
  return (
    <div className="w-48 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark overflow-y-auto">
      <div className="p-2 space-y-2">
        {/* Slide thumbnails */}
        {slides.map((slide, index) => (
          <SlideThumbnail
            key={slide.id}
            slide={slide}
            index={index}
            isActive={index === activeSlideIndex}
            onClick={() => onSlideSelect(index)}
          />
        ))}

        {/* Add slide button */}
        <button
          onClick={onAddSlide}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-accent-primary hover:bg-accent-primary/5 transition-colors text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-primary"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add slide</span>
        </button>
      </div>
    </div>
  );
}
