/**
 * Save Status Store
 * Tracks the global save status of all data changes
 * Provides visual feedback to users that their work is safe
 */

import { create } from 'zustand';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusStore {
  status: SaveStatus;
  lastSaveTime: Date | null;
  errorMessage: string | null;

  setSaving: () => void;
  setSaved: () => void;
  setError: (message: string) => void;
  setIdle: () => void;
}

export const useSaveStatus = create<SaveStatusStore>((set) => ({
  status: 'idle',
  lastSaveTime: null,
  errorMessage: null,

  setSaving: () => set({ status: 'saving', errorMessage: null }),

  setSaved: () => set({
    status: 'saved',
    lastSaveTime: new Date(),
    errorMessage: null,
  }),

  setError: (message: string) => set({
    status: 'error',
    errorMessage: message,
  }),

  setIdle: () => set({ status: 'idle', errorMessage: null }),
}));

/**
 * Helper functions to access save status outside React components
 * Used by storage adapters to track save operations
 */
export const saveStatusActions = {
  setSaving: () => useSaveStatus.getState().setSaving(),
  setSaved: () => useSaveStatus.getState().setSaved(),
  setError: (message: string) => useSaveStatus.getState().setError(message),
  setIdle: () => useSaveStatus.getState().setIdle(),
};
