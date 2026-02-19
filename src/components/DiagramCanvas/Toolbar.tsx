/**
 * Diagram Toolbar Component
 * Tool selection for diagram editor
 */

import { useState } from 'react';
import { useDiagramEditorStore } from '../../stores/useDiagramEditorStore';
import type { ToolType, AlignmentType, DiagramElement, LayoutAlgorithm } from '../../types/diagrams';
import { AutoLayoutMenu } from './AutoLayoutMenu';
import { StyleSelector } from './StyleSelector';
import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  Download,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  AlignHorizontalDistributeCenter,
  Layers,
  GitBranch,
  Palette,
} from 'lucide-react';

const tools: Array<{ type: ToolType; icon: React.ReactNode; label: string }> = [
  { type: 'select', icon: <MousePointer2 className="w-5 h-5" />, label: 'Select' },
  { type: 'rectangle', icon: <Square className="w-5 h-5" />, label: 'Rectangle' },
  { type: 'circle', icon: <Circle className="w-5 h-5" />, label: 'Circle' },
  { type: 'line', icon: <Minus className="w-5 h-5" />, label: 'Line' },
  { type: 'arrow', icon: <ArrowRight className="w-5 h-5" />, label: 'Arrow' },
  { type: 'text', icon: <Type className="w-5 h-5" />, label: 'Text' },
];

const alignmentTools: Array<{ type: AlignmentType; icon: React.ReactNode; label: string }> = [
  { type: 'left', icon: <AlignLeft className="w-5 h-5" />, label: 'Align Left' },
  { type: 'center', icon: <AlignCenter className="w-5 h-5" />, label: 'Align Center' },
  { type: 'right', icon: <AlignRight className="w-5 h-5" />, label: 'Align Right' },
  { type: 'top', icon: <AlignHorizontalJustifyCenter className="w-5 h-5" style={{ transform: 'rotate(90deg)' }} />, label: 'Align Top' },
  { type: 'middle', icon: <AlignVerticalJustifyCenter className="w-5 h-5" />, label: 'Align Middle' },
  { type: 'bottom', icon: <AlignHorizontalJustifyCenter className="w-5 h-5" style={{ transform: 'rotate(90deg) scaleX(-1)' }} />, label: 'Align Bottom' },
  { type: 'distribute', icon: <AlignHorizontalDistributeCenter className="w-5 h-5" />, label: 'Distribute Evenly' },
];

interface ToolbarProps {
  onExport?: () => void;
  elements: DiagramElement[];
  onUpdateElements: (elements: DiagramElement[]) => void;
  onApplyLayout?: (algorithm: LayoutAlgorithm) => void;
}

export function Toolbar({ onExport, elements, onUpdateElements, onApplyLayout }: ToolbarProps) {
  const currentTool = useDiagramEditorStore((s) => s.currentTool);
  const setCurrentTool = useDiagramEditorStore((s) => s.setCurrentTool);
  const selectedElementIds = useDiagramEditorStore((s) => s.selectedElementIds);
  const groupElements = useDiagramEditorStore((s) => s.groupElements);
  const ungroupElements = useDiagramEditorStore((s) => s.ungroupElements);
  const alignElements = useDiagramEditorStore((s) => s.alignElements);
  const getGroupId = useDiagramEditorStore((s) => s.getGroupId);
  const layerPanelOpen = useDiagramEditorStore((s) => s.layerPanelOpen);
  const toggleLayerPanel = useDiagramEditorStore((s) => s.toggleLayerPanel);

  // P2: Hand-drawn style settings
  const globalDrawingStyle = useDiagramEditorStore((s) => s.globalDrawingStyle);
  const globalRoughness = useDiagramEditorStore((s) => s.globalRoughness);
  const globalBowing = useDiagramEditorStore((s) => s.globalBowing);
  const setGlobalDrawingStyle = useDiagramEditorStore((s) => s.setGlobalDrawingStyle);
  const setGlobalRoughness = useDiagramEditorStore((s) => s.setGlobalRoughness);
  const setGlobalBowing = useDiagramEditorStore((s) => s.setGlobalBowing);

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Check if any selected element is grouped
  const hasGroupedSelection = selectedElementIds.length > 0 &&
    selectedElementIds.some((id) => {
      const groupId = getGroupId(id, elements);
      return groupId !== undefined;
    });

  const handleGroup = () => {
    if (selectedElementIds.length < 2) return;
    groupElements(elements, onUpdateElements);
  };

  const handleUngroup = () => {
    if (selectedElementIds.length === 0) return;

    // Find the groupId of the first selected element
    const firstGroupId = getGroupId(selectedElementIds[0], elements);
    if (!firstGroupId) return;

    ungroupElements(elements, firstGroupId, onUpdateElements);
  };

  const handleAlign = (type: AlignmentType) => {
    if (selectedElementIds.length < 2) return;
    alignElements(selectedElementIds, elements, type, onUpdateElements);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark">
      {/* Tools */}
      <div className="flex flex-col gap-1">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => setCurrentTool(tool.type)}
            className={`
              p-3 rounded-lg transition-colors
              ${
                currentTool === tool.type
                  ? 'bg-primary-light dark:bg-primary-dark text-white'
                  : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
              }
            `}
            title={tool.label}
            aria-label={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-px bg-border-light dark:bg-border-dark my-2" />

      {/* Grouping */}
      <div className="flex flex-col gap-1">
        <button
          onClick={handleGroup}
          disabled={selectedElementIds.length < 2}
          className={`
            p-3 rounded-lg transition-colors
            ${
              selectedElementIds.length < 2
                ? 'text-text-light-tertiary dark:text-text-dark-tertiary cursor-not-allowed opacity-50'
                : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
            }
          `}
          title="Group (Ctrl+G)"
          aria-label="Group selected elements"
        >
          <Group className="w-5 h-5" />
        </button>
        <button
          onClick={handleUngroup}
          disabled={!hasGroupedSelection}
          className={`
            p-3 rounded-lg transition-colors
            ${
              !hasGroupedSelection
                ? 'text-text-light-tertiary dark:text-text-dark-tertiary cursor-not-allowed opacity-50'
                : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
            }
          `}
          title="Ungroup (Ctrl+Shift+G)"
          aria-label="Ungroup selected elements"
        >
          <Ungroup className="w-5 h-5" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-border-light dark:bg-border-dark my-2" />

      {/* Alignment */}
      <div className="flex flex-col gap-1">
        {alignmentTools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => handleAlign(tool.type)}
            disabled={selectedElementIds.length < 2}
            className={`
              p-3 rounded-lg transition-colors
              ${
                selectedElementIds.length < 2
                  ? 'text-text-light-tertiary dark:text-text-dark-tertiary cursor-not-allowed opacity-50'
                  : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
              }
            `}
            title={tool.label}
            aria-label={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-px bg-border-light dark:bg-border-dark my-2" />

      {/* Auto-Layout */}
      <div className="flex flex-col gap-1 relative">
        <button
          onClick={() => setShowLayoutMenu(!showLayoutMenu)}
          disabled={elements.length === 0}
          className={`
            p-3 rounded-lg transition-colors
            ${
              elements.length === 0
                ? 'text-text-light-tertiary dark:text-text-dark-tertiary cursor-not-allowed opacity-50'
                : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
            }
          `}
          title="Auto-Layout"
          aria-label="Apply auto-layout"
        >
          <GitBranch className="w-5 h-5" />
        </button>

        {/* Layout Menu Dropdown */}
        {showLayoutMenu && onApplyLayout && (
          <div className="absolute left-16 top-0 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg p-2 z-10 w-64">
            <AutoLayoutMenu
              onApplyLayout={(algorithm) => {
                onApplyLayout(algorithm);
                setShowLayoutMenu(false);
              }}
              disabled={elements.length === 0}
            />
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="h-px bg-border-light dark:bg-border-dark my-2" />

      {/* P2: Style Menu & Layer Panel Toggle */}
      <div className="flex flex-col gap-1">
        {/* Style Menu */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className={`
              p-3 rounded-lg transition-colors
              ${
                showStyleMenu
                  ? 'bg-primary-light dark:bg-primary-dark text-white'
                  : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
              }
            `}
            title="Drawing Style"
            aria-label="Toggle style menu"
          >
            <Palette className="w-5 h-5" />
          </button>

          {showStyleMenu && (
            <div className="absolute left-16 top-0 z-50 w-80">
              <StyleSelector
                currentStyle={globalDrawingStyle}
                roughness={globalRoughness}
                bowing={globalBowing}
                onStyleChange={setGlobalDrawingStyle}
                onRoughnessChange={setGlobalRoughness}
                onBowingChange={setGlobalBowing}
              />
            </div>
          )}
        </div>

        {/* Layer Panel Toggle */}
        <button
          onClick={toggleLayerPanel}
          className={`
            p-3 rounded-lg transition-colors
            ${
              layerPanelOpen
                ? 'bg-primary-light dark:bg-primary-dark text-white'
                : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
            }
          `}
          title="Toggle Layers Panel"
          aria-label="Toggle layers panel"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Separator */}
      <div className="h-px bg-border-light dark:bg-border-dark my-2" />

      {/* Actions */}
      <div className="flex flex-col gap-1">
        {onExport && (
          <button
            onClick={onExport}
            className="p-3 rounded-lg text-text-light-primary dark:text-text-dark-primary hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors"
            title="Export"
            aria-label="Export diagram"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
