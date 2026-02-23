/**
 * Note Selection Store
 *
 * Dedicated Zustand store for multi-select and bulk operations on notes.
 * Separated from useNotesStore to keep selection state ephemeral (not persisted).
 */

import { create } from 'zustand';

interface NoteSelectionStore {
  /** Set of currently selected note IDs */
  selectedNoteIds: Set<string>;
  /** Whether multi-select mode is active */
  isMultiSelectMode: boolean;
  /** Last selected note ID for shift+click range selection */
  lastSelectedNoteId: string | null;

  /** Toggle selection of a single note */
  toggleSelect: (noteId: string) => void;
  /** Select a range of notes (shift+click) */
  selectRange: (fromId: string, toId: string, allNoteIds: string[]) => void;
  /** Select all notes from the provided list */
  selectAll: (noteIds: string[]) => void;
  /** Clear all selections and exit multi-select mode */
  clearSelection: () => void;
  /** Toggle multi-select mode on/off */
  toggleMultiSelectMode: () => void;
  /** Enter multi-select mode (without toggling) */
  enterMultiSelectMode: () => void;
}

export const useNoteSelectionStore = create<NoteSelectionStore>()((set, get) => ({
  selectedNoteIds: new Set<string>(),
  isMultiSelectMode: false,
  lastSelectedNoteId: null,

  toggleSelect: (noteId: string) => {
    set((state) => {
      const next = new Set(state.selectedNoteIds);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return {
        selectedNoteIds: next,
        lastSelectedNoteId: noteId,
      };
    });
  },

  selectRange: (fromId: string, toId: string, allNoteIds: string[]) => {
    const fromIndex = allNoteIds.indexOf(fromId);
    const toIndex = allNoteIds.indexOf(toId);

    if (fromIndex === -1 || toIndex === -1) return;

    const startIdx = Math.min(fromIndex, toIndex);
    const endIdx = Math.max(fromIndex, toIndex);

    set((state) => {
      const next = new Set(state.selectedNoteIds);
      for (let i = startIdx; i <= endIdx; i++) {
        next.add(allNoteIds[i]);
      }
      return {
        selectedNoteIds: next,
        lastSelectedNoteId: toId,
      };
    });
  },

  selectAll: (noteIds: string[]) => {
    set({
      selectedNoteIds: new Set(noteIds),
    });
  },

  clearSelection: () => {
    set({
      selectedNoteIds: new Set<string>(),
      isMultiSelectMode: false,
      lastSelectedNoteId: null,
    });
  },

  toggleMultiSelectMode: () => {
    const isCurrentlyActive = get().isMultiSelectMode;
    if (isCurrentlyActive) {
      // Exiting: clear selection too
      set({
        isMultiSelectMode: false,
        selectedNoteIds: new Set<string>(),
        lastSelectedNoteId: null,
      });
    } else {
      set({ isMultiSelectMode: true });
    }
  },

  enterMultiSelectMode: () => {
    set({ isMultiSelectMode: true });
  },
}));
