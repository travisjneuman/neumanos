/**
 * Note Version Store
 *
 * Tracks version history for notes.
 * Saves snapshots when significant content changes are detected.
 * Persisted to IndexedDB via syncedStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { createSyncedStorage } from '../lib/syncedStorage';
import { NOTE_CONSTANTS } from '../types/notes';
import type { NoteVersion } from '../types/notes';
import { logger } from '../services/logger';

const log = logger.module('NoteVersionStore');

interface NoteVersionStore {
  /** Map of noteId -> array of versions (newest first) */
  versions: Record<string, NoteVersion[]>;

  /** Save a new version snapshot */
  saveVersion: (params: {
    noteId: string;
    title: string;
    content: string;
    contentText: string;
  }) => void;

  /** Get all versions for a note */
  getVersions: (noteId: string) => NoteVersion[];

  /** Get a specific version */
  getVersion: (noteId: string, versionId: string) => NoteVersion | undefined;

  /** Delete a specific version */
  deleteVersion: (noteId: string, versionId: string) => void;

  /** Delete all versions for a note */
  deleteNoteVersions: (noteId: string) => void;

  /** Get the latest version for comparison */
  getLatestVersion: (noteId: string) => NoteVersion | undefined;

  /** Check if content has changed enough to warrant a new version */
  shouldSaveVersion: (noteId: string, currentContentText: string) => boolean;
}

/**
 * Generate a change summary by comparing old and new content
 */
function generateChangeSummary(oldText: string, newText: string): string {
  const oldLen = oldText.length;
  const newLen = newText.length;
  const diff = newLen - oldLen;

  if (oldLen === 0) return 'Initial version';
  if (diff > 0) return `Added ${diff} characters`;
  if (diff < 0) return `Removed ${Math.abs(diff)} characters`;
  return 'Content modified';
}

export const useNoteVersionStore = create<NoteVersionStore>()(
  persist(
    (set, get) => ({
      versions: {},

      saveVersion: ({ noteId, title, content, contentText }) => {
        const wordCount = contentText.trim().split(/\s+/).filter(Boolean).length;
        const latestVersion = get().getLatestVersion(noteId);
        const changeSummary = generateChangeSummary(
          latestVersion?.contentText || '',
          contentText
        );

        const newVersion: NoteVersion = {
          id: uuidv4(),
          noteId,
          title,
          content,
          contentText,
          savedAt: new Date(),
          wordCount,
          changeSummary,
        };

        set((state) => {
          const noteVersions = state.versions[noteId] || [];
          // Add new version at the beginning, trim to max
          const updatedVersions = [
            newVersion,
            ...noteVersions,
          ].slice(0, NOTE_CONSTANTS.MAX_VERSIONS_PER_NOTE);

          return {
            versions: {
              ...state.versions,
              [noteId]: updatedVersions,
            },
          };
        });

        log.debug('Version saved', { noteId, versionId: newVersion.id, changeSummary });
      },

      getVersions: (noteId) => {
        return get().versions[noteId] || [];
      },

      getVersion: (noteId, versionId) => {
        const noteVersions = get().versions[noteId] || [];
        return noteVersions.find((v) => v.id === versionId);
      },

      deleteVersion: (noteId, versionId) => {
        set((state) => {
          const noteVersions = state.versions[noteId] || [];
          return {
            versions: {
              ...state.versions,
              [noteId]: noteVersions.filter((v) => v.id !== versionId),
            },
          };
        });
        log.debug('Version deleted', { noteId, versionId });
      },

      deleteNoteVersions: (noteId) => {
        set((state) => {
          const { [noteId]: _deleted, ...remaining } = state.versions;
          return { versions: remaining };
        });
        log.debug('All versions deleted for note', { noteId });
      },

      getLatestVersion: (noteId) => {
        const noteVersions = get().versions[noteId] || [];
        return noteVersions[0]; // Newest first
      },

      shouldSaveVersion: (noteId, currentContentText) => {
        const latestVersion = get().getLatestVersion(noteId);
        if (!latestVersion) return true; // No versions yet, always save

        // Check minimum content change threshold
        const lengthDiff = Math.abs(
          currentContentText.length - latestVersion.contentText.length
        );
        if (lengthDiff < NOTE_CONSTANTS.MIN_CONTENT_CHANGE_FOR_VERSION) {
          return false;
        }

        return true;
      },
    }),
    {
      name: 'note-versions',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      partialize: (state) => ({
        versions: state.versions,
      }),
      onRehydrateStorage: () => (state) => {
        log.debug('Note version store rehydrating');
        if (state) {
          try {
            if (state.versions && typeof state.versions === 'object') {
              // Convert date strings back to Date objects
              Object.values(state.versions).forEach((noteVersions) => {
                if (Array.isArray(noteVersions)) {
                  noteVersions.forEach((version) => {
                    if (typeof version.savedAt === 'string') {
                      version.savedAt = new Date(version.savedAt);
                    }
                  });
                }
              });
            } else {
              state.versions = {};
            }
          } catch (err) {
            log.error('Error during version store rehydration', { error: err });
            state.versions = {};
          }
        }
        log.info('Note version store rehydrated');
      },
    }
  )
);
