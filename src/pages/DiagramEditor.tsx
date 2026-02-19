/**
 * Diagram Editor Page
 * Full-screen diagram editing with Konva canvas
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreErrorBoundary } from '../components/StoreErrorBoundary';
import { useDiagramsStore } from '../stores/useDiagramsStore';
import { useDiagramEditorStore } from '../stores/useDiagramEditorStore';
import { Canvas } from '../components/DiagramCanvas/Canvas';
import { Toolbar } from '../components/DiagramCanvas/Toolbar';
import { ShapePalette } from '../components/DiagramCanvas/ShapePalette';
import { LayerPanel } from '../components/DiagramCanvas/LayerPanel';
import { applyLayout } from '../services/autoLayout';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import type { Diagram, DiagramElement, LayoutAlgorithm } from '../types/diagrams';
import type { ShapeDefinition } from '../types/shapes';

export default function DiagramEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const getDiagram = useDiagramsStore((s) => s.getDiagram);
  const updateDiagram = useDiagramsStore((s) => s.updateDiagram);
  const currentTool = useDiagramEditorStore((s) => s.currentTool);
  const shapePaletteOpen = useDiagramEditorStore((s) => s.shapePaletteOpen);
  const toggleShapePalette = useDiagramEditorStore((s) => s.toggleShapePalette);
  const layerPanelOpen = useDiagramEditorStore((s) => s.layerPanelOpen);
  const selectElement = useDiagramEditorStore((s) => s.selectElement);
  const selectedElementIds = useDiagramEditorStore((s) => s.selectedElementIds);

  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // P0: Drag-and-drop state for shape palette
  const [dragState, setDragState] = useState<{
    active: boolean;
    shape: ShapeDefinition | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }>({
    active: false,
    shape: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/diagrams');
      return;
    }

    const foundDiagram = getDiagram(id);
    if (!foundDiagram) {
      navigate('/diagrams');
      return;
    }

    setDiagram(foundDiagram);
    setTitle(foundDiagram.title);
  }, [id, getDiagram, navigate]);

  // Update canvas size using ResizeObserver for accurate sizing
  // Must depend on diagram because container only renders after diagram loads
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      // Only update if we have valid dimensions
      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    };

    // Use ResizeObserver for reliable container sizing
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    // Also update on initial mount after a brief delay to ensure layout is complete
    requestAnimationFrame(updateSize);

    return () => {
      resizeObserver.disconnect();
    };
  }, [diagram]);

  // Re-measure canvas when panels toggle (shape palette or layer panel)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // Delay to allow panel transition to complete (panels use duration-300 = 300ms)
    const timeout = setTimeout(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    }, 320);

    return () => clearTimeout(timeout);
  }, [shapePaletteOpen, layerPanelOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!diagram) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedElementIds = useDiagramEditorStore.getState().selectedElementIds;
      const clearSelection = useDiagramEditorStore.getState().clearSelection;
      const copy = useDiagramEditorStore.getState().copy;
      const paste = useDiagramEditorStore.getState().paste;
      const undo = useDiagramEditorStore.getState().undo;
      const redo = useDiagramEditorStore.getState().redo;
      const canUndo = useDiagramEditorStore.getState().canUndo();
      const canRedo = useDiagramEditorStore.getState().canRedo();
      const groupElements = useDiagramEditorStore.getState().groupElements;
      const ungroupElements = useDiagramEditorStore.getState().ungroupElements;
      const getGroupId = useDiagramEditorStore.getState().getGroupId;

      // Delete selected elements
      if (e.key === 'Delete' && selectedElementIds.length > 0) {
        const updatedElements = diagram.elements.filter(
          (el) => !selectedElementIds.includes(el.id)
        );
        updateDiagram(diagram.id, { elements: updatedElements });
        setDiagram({ ...diagram, elements: updatedElements });
        clearSelection();
      }

      // Copy (Ctrl+C)
      if (e.ctrlKey && e.key === 'c' && selectedElementIds.length > 0) {
        const selectedElements = diagram.elements.filter((el) =>
          selectedElementIds.includes(el.id)
        );
        copy(selectedElements);
      }

      // Paste (Ctrl+V)
      if (e.ctrlKey && e.key === 'v') {
        const pastedElements = paste();
        if (pastedElements.length > 0) {
          const updatedElements = [...diagram.elements, ...pastedElements];
          updateDiagram(diagram.id, { elements: updatedElements });
          setDiagram({ ...diagram, elements: updatedElements });
        }
      }

      // Group (Ctrl+G)
      if (e.ctrlKey && e.key === 'g' && !e.shiftKey && selectedElementIds.length >= 2) {
        e.preventDefault();
        groupElements(diagram.elements, (updatedElements) => {
          updateDiagram(diagram.id, { elements: updatedElements });
          setDiagram({ ...diagram, elements: updatedElements });
        });
      }

      // Ungroup (Ctrl+Shift+G)
      if (e.ctrlKey && e.shiftKey && e.key === 'G' && selectedElementIds.length > 0) {
        e.preventDefault();
        const firstGroupId = getGroupId(selectedElementIds[0], diagram.elements);
        if (firstGroupId) {
          ungroupElements(diagram.elements, firstGroupId, (updatedElements) => {
            updateDiagram(diagram.id, { elements: updatedElements });
            setDiagram({ ...diagram, elements: updatedElements });
          });
        }
      }

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey && canUndo) {
        const historyEntry = undo();
        if (historyEntry) {
          updateDiagram(diagram.id, {
            elements: historyEntry.elements,
            canvasState: historyEntry.canvasState,
          });
          setDiagram({
            ...diagram,
            elements: historyEntry.elements,
            canvasState: historyEntry.canvasState,
          });
        }
      }

      // Redo (Ctrl+Shift+Z or Ctrl+Y)
      if (((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) && canRedo) {
        const historyEntry = redo();
        if (historyEntry) {
          updateDiagram(diagram.id, {
            elements: historyEntry.elements,
            canvasState: historyEntry.canvasState,
          });
          setDiagram({
            ...diagram,
            elements: historyEntry.elements,
            canvasState: historyEntry.canvasState,
          });
        }
      }

      // Select all (Ctrl+A)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        useDiagramEditorStore.getState().selectMultiple(diagram.elements.map((el) => el.id));
      }

      // Escape - clear selection
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [diagram, updateDiagram]);

  const handleSave = useCallback(() => {
    if (!diagram) return;

    setIsSaving(true);
    updateDiagram(diagram.id, {
      title,
      elements: diagram.elements,
      canvasState: diagram.canvasState,
    });

    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  }, [diagram, title, updateDiagram]);

  // Auto-save with debouncing (2 seconds after last change)
  useEffect(() => {
    if (!diagram) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 2000);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [diagram, title, handleSave]);

  const handleBack = () => {
    handleSave();
    navigate('/diagrams');
  };

  const handleAddShape = useCallback(() => {
    if (!diagram) return;

    const newElement: DiagramElement = {
      id: crypto.randomUUID(),
      type: currentTool as DiagramElement['type'],
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      width: currentTool === 'text' ? 200 : 100,
      height: currentTool === 'text' ? 50 : 100,
      zIndex: diagram.elements.length,
      fill: currentTool === 'text' ? 'transparent' : '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
    };

    // Add type-specific properties
    if (currentTool === 'text') {
      newElement.text = 'Double-click to edit';
      newElement.fontSize = 16;
      newElement.fontFamily = 'Arial';
    }

    const updatedElements = [...diagram.elements, newElement];
    updateDiagram(diagram.id, { elements: updatedElements });
    setDiagram({ ...diagram, elements: updatedElements });
  }, [diagram, currentTool, updateDiagram]);

  // P1: Auto-layout handler
  const handleApplyLayout = useCallback((algorithm: LayoutAlgorithm) => {
    if (!diagram) return;

    const { elements: layoutedElements } = applyLayout(
      diagram.elements,
      algorithm,
      selectedElementIds.length > 0 ? selectedElementIds : undefined
    );

    updateDiagram(diagram.id, { elements: layoutedElements });
    setDiagram({ ...diagram, elements: layoutedElements });
  }, [diagram, selectedElementIds, updateDiagram]);

  // P0: Shape palette drag-and-drop handlers
  const handleShapeDragStart = useCallback((shape: ShapeDefinition, startX: number, startY: number) => {
    setDragState({
      active: true,
      shape,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
  }, []);

  useEffect(() => {
    if (!dragState.active) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragState((prev) => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!diagram || !dragState.shape || !canvasContainerRef.current) {
        setDragState({
          active: false,
          shape: null,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        });
        return;
      }

      // Check if mouse is over canvas
      const canvasRect = canvasContainerRef.current.getBoundingClientRect();
      const isOverCanvas =
        e.clientX >= canvasRect.left &&
        e.clientX <= canvasRect.right &&
        e.clientY >= canvasRect.top &&
        e.clientY <= canvasRect.bottom;

      if (isOverCanvas) {
        // Calculate canvas coordinates
        const canvasX = e.clientX - canvasRect.left;
        const canvasY = e.clientY - canvasRect.top;

        // Create new element from shape definition
        const newElement: DiagramElement = {
          id: crypto.randomUUID(),
          ...dragState.shape.defaultProps,
          shapeId: dragState.shape.id,
          pathData: dragState.shape.pathData,
          x: canvasX - (dragState.shape.defaultProps.width || 100) / 2,
          y: canvasY - (dragState.shape.defaultProps.height || 100) / 2,
          zIndex: diagram.elements.length,
        } as DiagramElement;

        // Add to diagram
        const updatedElements = [...diagram.elements, newElement];
        updateDiagram(diagram.id, { elements: updatedElements });
        setDiagram({ ...diagram, elements: updatedElements });

        // Select the new element
        useDiagramEditorStore.getState().selectElement(newElement.id);
      }

      setDragState({
        active: false,
        shape: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.active, dragState.shape, diagram, updateDiagram]);

  if (!diagram) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-text-light-secondary dark:text-text-dark-secondary">
          Loading diagram...
        </div>
      </div>
    );
  }

  return (
    <StoreErrorBoundary storeName="diagrams">
      <div className="flex flex-col h-screen bg-surface-light dark:bg-surface-dark">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-lg transition-colors"
              aria-label="Back to diagrams"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-accent-primary rounded px-2 py-1"
              placeholder="Untitled Diagram"
            />

            {isSaving && (
              <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Saving...
              </span>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </header>

        {/* Editor Area */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Toolbar */}
          <Toolbar
            elements={diagram.elements}
            onUpdateElements={(updatedElements) => {
              updateDiagram(diagram.id, { elements: updatedElements });
              setDiagram({ ...diagram, elements: updatedElements });
            }}
            onApplyLayout={handleApplyLayout}
          />

          {/* P0: Shape Palette */}
          <ShapePalette
            onShapeDragStart={handleShapeDragStart}
            isOpen={shapePaletteOpen}
            onToggle={toggleShapePalette}
          />

          {/* Canvas Container - flex-1 fills remaining space, min-h-0 prevents flex overflow */}
          <div className="flex-1 relative min-h-0 min-w-0 overflow-hidden" ref={canvasContainerRef}>
            {/* Add Shape Button (shows when non-select tool is active) */}
            {currentTool !== 'select' && (
              <button
                onClick={handleAddShape}
                className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg shadow-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add {currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}
              </button>
            )}

            {/* Canvas */}
            <Canvas diagramId={diagram.id} width={canvasSize.width} height={canvasSize.height} />

            {/* Empty state hint */}
            {diagram.elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-text-light-tertiary dark:text-text-dark-tertiary">
                  <p className="text-lg mb-2">Select a tool and click "Add" to create shapes</p>
                  <p className="text-sm">Or drag existing shapes to move them</p>
                </div>
              </div>
            )}
          </div>

          {/* P1: Layer Panel */}
          <LayerPanel
            elements={diagram.elements}
            selectedElementIds={selectedElementIds}
            onSelectElement={selectElement}
            onUpdateElements={(updatedElements) => {
              updateDiagram(diagram.id, { elements: updatedElements });
              setDiagram({ ...diagram, elements: updatedElements });
            }}
            isOpen={layerPanelOpen}
            onToggle={useDiagramEditorStore.getState().toggleLayerPanel}
          />
        </div>

        {/* P0: Drag Preview Ghost */}
        {dragState.active && dragState.shape && (
          <div
            className="fixed pointer-events-none z-50 opacity-50"
            style={{
              left: dragState.currentX - (dragState.shape.defaultProps.width || 100) / 2,
              top: dragState.currentY - (dragState.shape.defaultProps.height || 100) / 2,
              width: dragState.shape.defaultProps.width || 100,
              height: dragState.shape.defaultProps.height || 100,
            }}
          >
            <div className="w-full h-full border-2 border-accent-primary bg-accent-primary/10 rounded flex items-center justify-center text-xs text-accent-primary">
              {dragState.shape.name}
            </div>
          </div>
        )}
      </div>
    </StoreErrorBoundary>
  );
}
