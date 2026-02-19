/**
 * DependencyLine Component
 * Renders SVG arrow connecting dependent tasks with different styles per dependency type
 */

import type { Task, DependencyType } from '../../types';
import { dateToX, ROW_HEIGHT, type ZoomLevel } from './utils';

interface DependencyLineProps {
  sourceTask: Task;
  targetTask: Task;
  dependencyType: DependencyType;
  lag: number;
  sourceRowIndex: number;
  targetRowIndex: number;
  timelineStart: Date;
  zoom: ZoomLevel;
}

export function DependencyLine({
  sourceTask,
  targetTask,
  dependencyType,
  lag,
  sourceRowIndex,
  targetRowIndex,
  timelineStart,
  zoom,
}: DependencyLineProps) {
  // Calculate points based on dependency type
  const getConnectionPoints = () => {
    const sourceStartDate = sourceTask.startDate ? new Date(sourceTask.startDate) : null;
    const sourceDueDate = sourceTask.dueDate ? new Date(sourceTask.dueDate) : null;
    const targetStartDate = targetTask.startDate ? new Date(targetTask.startDate) : null;
    const targetDueDate = targetTask.dueDate ? new Date(targetTask.dueDate) : null;

    switch (dependencyType) {
      case 'finish-to-start': {
        // Source end → Target start
        if (!sourceDueDate || !targetStartDate) return null;
        return {
          sourceX: 150 + dateToX(sourceDueDate, timelineStart, zoom),
          targetX: 150 + dateToX(targetStartDate, timelineStart, zoom),
          sourceY: sourceRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
          targetY: targetRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
        };
      }
      case 'start-to-start': {
        // Source start → Target start
        if (!sourceStartDate || !targetStartDate) return null;
        return {
          sourceX: 150 + dateToX(sourceStartDate, timelineStart, zoom),
          targetX: 150 + dateToX(targetStartDate, timelineStart, zoom),
          sourceY: sourceRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
          targetY: targetRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
        };
      }
      case 'finish-to-finish': {
        // Source end → Target end
        if (!sourceDueDate || !targetDueDate) return null;
        return {
          sourceX: 150 + dateToX(sourceDueDate, timelineStart, zoom),
          targetX: 150 + dateToX(targetDueDate, timelineStart, zoom),
          sourceY: sourceRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
          targetY: targetRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
        };
      }
      case 'start-to-finish': {
        // Source start → Target end (rare)
        if (!sourceStartDate || !targetDueDate) return null;
        return {
          sourceX: 150 + dateToX(sourceStartDate, timelineStart, zoom),
          targetX: 150 + dateToX(targetDueDate, timelineStart, zoom),
          sourceY: sourceRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
          targetY: targetRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2,
        };
      }
      default:
        return null;
    }
  };

  const points = getConnectionPoints();
  if (!points) return null;

  const { sourceX, targetX, sourceY, targetY } = points;

  // Apply lag offset to target X position (positive = delay, negative = lead)
  const lagOffsetDays = lag || 0;
  // Rough estimation: 1 day = ~20px at week zoom (adjust based on zoom)
  const lagOffsetPixels = lagOffsetDays * 20 * (zoom === 'day' ? 3 : zoom === 'week' ? 1 : 0.3);
  const adjustedTargetX = targetX + lagOffsetPixels;

  // Generate path with bezier curve
  const midX = (sourceX + adjustedTargetX) / 2;
  const path = `M ${sourceX} ${sourceY}
                Q ${midX} ${sourceY}, ${midX} ${(sourceY + targetY) / 2}
                Q ${midX} ${targetY}, ${adjustedTargetX - 10} ${targetY}`;

  // Different stroke styles per dependency type
  const strokeStyles = {
    'finish-to-start': '', // Solid (default)
    'start-to-start': '5,5', // Dashed
    'finish-to-finish': '2,3', // Dotted
    'start-to-finish': '5,2,2,2', // Dash-dot
  };

  const strokeDasharray = strokeStyles[dependencyType];

  // Unique marker ID per dependency type
  const markerId = `arrowhead-${dependencyType}`;

  return (
    <g className="dependency-line">
      {/* Arrow path */}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeDasharray={strokeDasharray}
        className="text-accent-primary/50"
        markerEnd={`url(#${markerId})`}
      />

      {/* Arrowhead marker (unique per type) */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill="currentColor"
            className="text-accent-primary/50"
          />
        </marker>
      </defs>

      {/* Tooltip group (optional: show type and lag on hover) */}
      {lag !== 0 && (
        <title>
          {dependencyType.toUpperCase().replace(/-/g, ' ')}
          {lag > 0 ? ` (+${lag} day lag)` : ` (${lag} day lead)`}
        </title>
      )}
    </g>
  );
}
