/**
 * Diagram Editor Store
 * Manages editor state (tool, selection, clipboard, undo/redo)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiagramElement, ToolType, HistoryEntry, CanvasState, AlignmentType, DrawingStyle } from '../types/diagrams';

interface DiagramEditorState {
  // Current tool
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;

  // P0: Shape palette state
  shapePaletteOpen: boolean;
  toggleShapePalette: () => void;

  // P1: Layer panel state
  layerPanelOpen: boolean;
  toggleLayerPanel: () => void;

  // P2: Hand-drawn style settings
  globalDrawingStyle: DrawingStyle;
  globalRoughness: number;
  globalBowing: number;
  setGlobalDrawingStyle: (style: DrawingStyle) => void;
  setGlobalRoughness: (roughness: number) => void;
  setGlobalBowing: (bowing: number) => void;

  // Selection
  selectedElementIds: string[];
  selectElement: (id: string, addToSelection?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;

  // Clipboard
  clipboard: DiagramElement[];
  copy: (elements: DiagramElement[]) => void;
  paste: () => DiagramElement[];

  // Drawing state
  isDragging: boolean;
  isDrawing: boolean;
  setIsDragging: (dragging: boolean) => void;
  setIsDrawing: (drawing: boolean) => void;

  // P0: Grouping (receives elements + callback to update diagram)
  groupElements: (elements: DiagramElement[], onUpdate: (updates: DiagramElement[]) => void) => string;
  ungroupElements: (elements: DiagramElement[], groupId: string, onUpdate: (updates: DiagramElement[]) => void) => void;
  getGroupId: (elementId: string, elements: DiagramElement[]) => string | undefined;

  // P0: Alignment (receives elements + callback to update diagram)
  alignElements: (
    elementIds: string[],
    elements: DiagramElement[],
    type: AlignmentType,
    onUpdate: (updates: DiagramElement[]) => void
  ) => void;

  // Undo/Redo
  history: HistoryEntry[];
  currentHistoryIndex: number;
  maxHistorySize: number;
  pushHistory: (elements: DiagramElement[], canvasState: CanvasState) => void;
  undo: () => HistoryEntry | undefined;
  redo: () => HistoryEntry | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useDiagramEditorStore = create<DiagramEditorState>()(
  persist(
    (set, get) => ({
  // Tool
  currentTool: 'select',
  setCurrentTool: (tool) => set({ currentTool: tool }),

  // P0: Shape palette
  shapePaletteOpen: true,
  toggleShapePalette: () => set((state) => ({ shapePaletteOpen: !state.shapePaletteOpen })),

  // P1: Layer panel
  layerPanelOpen: true,
  toggleLayerPanel: () => set((state) => ({ layerPanelOpen: !state.layerPanelOpen })),

  // P2: Hand-drawn style settings
  globalDrawingStyle: 'normal',
  globalRoughness: 1.5,
  globalBowing: 1,
  setGlobalDrawingStyle: (style) => set({ globalDrawingStyle: style }),
  setGlobalRoughness: (roughness) => set({ globalRoughness: roughness }),
  setGlobalBowing: (bowing) => set({ globalBowing: bowing }),

  // Selection
  selectedElementIds: [],

  selectElement: (id, addToSelection = false) => {
    set((state) => {
      if (addToSelection) {
        // Toggle selection
        const isCurrentlySelected = state.selectedElementIds.includes(id);
        return {
          selectedElementIds: isCurrentlySelected
            ? state.selectedElementIds.filter((sid) => sid !== id)
            : [...state.selectedElementIds, id],
        };
      } else {
        return { selectedElementIds: [id] };
      }
    });
  },

  selectMultiple: (ids) => set({ selectedElementIds: ids }),

  clearSelection: () => set({ selectedElementIds: [] }),

  isSelected: (id) => get().selectedElementIds.includes(id),

  // Clipboard
  clipboard: [],

  copy: (elements) => {
    set({ clipboard: elements.map((el) => ({ ...el })) });
  },

  paste: () => {
    const { clipboard } = get();
    if (clipboard.length === 0) return [];

    // Create new elements with new IDs and offset position
    const pastedElements = clipboard.map((el) => ({
      ...el,
      id: crypto.randomUUID(),
      x: el.x + 20, // Offset by 20px
      y: el.y + 20,
    }));

    return pastedElements;
  },

  // Drawing state
  isDragging: false,
  isDrawing: false,
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  // P0: Grouping
  groupElements: (elements, onUpdate) => {
    const { selectedElementIds } = get();
    const groupId = crypto.randomUUID();

    // Assign groupId to selected elements
    const updatedElements = elements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, groupId } : el
    );

    onUpdate(updatedElements);
    return groupId;
  },

  ungroupElements: (elements, groupId, onUpdate) => {
    // Remove groupId from elements in the group
    const updatedElements = elements.map((el) =>
      el.groupId === groupId ? { ...el, groupId: undefined } : el
    );

    onUpdate(updatedElements);
  },

  getGroupId: (elementId, elements) => {
    const element = elements.find((el) => el.id === elementId);
    return element?.groupId;
  },

  // P0: Alignment
  alignElements: (elementIds, elements, type, onUpdate) => {
    const selectedElements = elements.filter((el) => elementIds.includes(el.id));
    if (selectedElements.length < 2) return;

    // Calculate bounding box for alignment reference
    const getBounds = (el: DiagramElement) => {
      const rotation = el.rotation || 0;
      if (rotation === 0) {
        return {
          left: el.x,
          right: el.x + el.width,
          top: el.y,
          bottom: el.y + el.height,
          centerX: el.x + el.width / 2,
          centerY: el.y + el.height / 2,
        };
      }

      // For rotated shapes, use the center point
      return {
        left: el.x,
        right: el.x + el.width,
        top: el.y,
        bottom: el.y + el.height,
        centerX: el.x + el.width / 2,
        centerY: el.y + el.height / 2,
      };
    };

    const bounds = selectedElements.map((el) => ({
      element: el,
      bounds: getBounds(el),
    }));

    let updatedElements = [...elements];

    switch (type) {
      case 'left': {
        const leftmost = Math.min(...bounds.map((b) => b.bounds.left));
        updatedElements = elements.map((el) => {
          const bound = bounds.find((b) => b.element.id === el.id);
          return bound ? { ...el, x: leftmost } : el;
        });
        break;
      }

      case 'center': {
        const centerX =
          bounds.reduce((sum, b) => sum + b.bounds.centerX, 0) / bounds.length;
        updatedElements = elements.map((el) => {
          const bound = bounds.find((b) => b.element.id === el.id);
          return bound ? { ...el, x: centerX - el.width / 2 } : el;
        });
        break;
      }

      case 'right': {
        const rightmost = Math.max(...bounds.map((b) => b.bounds.right));
        updatedElements = elements.map((el) => {
          const bound = bounds.find((b) => b.element.id === el.id);
          return bound ? { ...el, x: rightmost - el.width } : el;
        });
        break;
      }

      case 'top': {
        const topmost = Math.min(...bounds.map((b) => b.bounds.top));
        updatedElements = elements.map((el) => {
          const bound = bounds.find((b) => b.element.id === el.id);
          return bound ? { ...el, y: topmost } : el;
        });
        break;
      }

      case 'middle': {
        const centerY =
          bounds.reduce((sum, b) => sum + b.bounds.centerY, 0) / bounds.length;
        updatedElements = elements.map((el) => {
          const bound = bounds.find((b) => b.element.id === el.id);
          return bound ? { ...el, y: centerY - el.height / 2 } : el;
        });
        break;
      }

      case 'bottom': {
        const bottommost = Math.max(...bounds.map((b) => b.bounds.bottom));
        updatedElements = elements.map((el) => {
          const bound = bounds.find((b) => b.element.id === el.id);
          return bound ? { ...el, y: bottommost - el.height } : el;
        });
        break;
      }

      case 'distribute': {
        // Determine orientation based on variance
        const xVariance = Math.max(...bounds.map((b) => b.bounds.centerX)) - Math.min(...bounds.map((b) => b.bounds.centerX));
        const yVariance = Math.max(...bounds.map((b) => b.bounds.centerY)) - Math.min(...bounds.map((b) => b.bounds.centerY));

        if (xVariance > yVariance) {
          // Distribute horizontally
          const sorted = [...bounds].sort((a, b) => a.bounds.centerX - b.bounds.centerX);
          const first = sorted[0].bounds.centerX;
          const last = sorted[sorted.length - 1].bounds.centerX;
          const spacing = (last - first) / (sorted.length - 1);

          updatedElements = elements.map((el) => {
            const index = sorted.findIndex((s) => s.element.id === el.id);
            if (index === -1) return el;
            const newCenterX = first + spacing * index;
            return { ...el, x: newCenterX - el.width / 2 };
          });
        } else {
          // Distribute vertically
          const sorted = [...bounds].sort((a, b) => a.bounds.centerY - b.bounds.centerY);
          const first = sorted[0].bounds.centerY;
          const last = sorted[sorted.length - 1].bounds.centerY;
          const spacing = (last - first) / (sorted.length - 1);

          updatedElements = elements.map((el) => {
            const index = sorted.findIndex((s) => s.element.id === el.id);
            if (index === -1) return el;
            const newCenterY = first + spacing * index;
            return { ...el, y: newCenterY - el.height / 2 };
          });
        }
        break;
      }
    }

    onUpdate(updatedElements);
  },

  // Undo/Redo
  history: [],
  currentHistoryIndex: -1,
  maxHistorySize: 50,

  pushHistory: (elements, canvasState) => {
    set((state) => {
      // Remove any redo history (everything after current index)
      const newHistory = state.history.slice(0, state.currentHistoryIndex + 1);

      // Add new entry
      newHistory.push({
        elements: elements.map((el) => ({ ...el })), // Deep clone
        canvasState: { ...canvasState },
      });

      // Limit history size
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
        return {
          history: newHistory,
          currentHistoryIndex: newHistory.length - 1,
        };
      }

      return {
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    const { history, currentHistoryIndex } = get();
    if (currentHistoryIndex <= 0) return undefined;

    const newIndex = currentHistoryIndex - 1;
    set({ currentHistoryIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { history, currentHistoryIndex } = get();
    if (currentHistoryIndex >= history.length - 1) return undefined;

    const newIndex = currentHistoryIndex + 1;
    set({ currentHistoryIndex: newIndex });
    return history[newIndex];
  },

  canUndo: () => {
    const { currentHistoryIndex } = get();
    return currentHistoryIndex > 0;
  },

  canRedo: () => {
    const { history, currentHistoryIndex } = get();
    return currentHistoryIndex < history.length - 1;
  },
}),
    {
      name: 'diagram-editor-store',
      partialize: (state) => ({
        // Only persist style settings, not editor state
        globalDrawingStyle: state.globalDrawingStyle,
        globalRoughness: state.globalRoughness,
        globalBowing: state.globalBowing,
        shapePaletteOpen: state.shapePaletteOpen,
        layerPanelOpen: state.layerPanelOpen,
      }),
      version: 1,
    },
  ),
);
