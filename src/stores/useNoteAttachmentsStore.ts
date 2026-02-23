/**
 * Note Attachments Store
 *
 * Zustand store for file attachments on notes.
 * Persisted to IndexedDB via syncedStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { createSyncedStorage } from '../lib/syncedStorage';
import { logger } from '../services/logger';

const log = logger.module('NoteAttachmentsStore');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface NoteAttachment {
  id: string;
  noteId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // base64 data URL
  createdAt: string;
}

interface NoteAttachmentsStore {
  attachments: Record<string, NoteAttachment>;

  addAttachment: (noteId: string, file: File) => Promise<NoteAttachment | null>;
  deleteAttachment: (id: string) => void;
  getAttachmentsByNote: (noteId: string) => NoteAttachment[];
  deleteAttachmentsByNote: (noteId: string) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const useNoteAttachmentsStore = create<NoteAttachmentsStore>()(
  persist(
    (set, get) => ({
      attachments: {},

      addAttachment: async (noteId: string, file: File): Promise<NoteAttachment | null> => {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          log.warn('File exceeds maximum size', {
            fileName: file.name,
            fileSize: file.size,
            maxSize: MAX_FILE_SIZE_BYTES,
          });
          return null;
        }

        try {
          const data = await fileToBase64(file);
          const attachment: NoteAttachment = {
            id: uuidv4(),
            noteId,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            data,
            createdAt: new Date().toISOString(),
          };

          set((state) => ({
            attachments: {
              ...state.attachments,
              [attachment.id]: attachment,
            },
          }));

          log.debug('Attachment added', { id: attachment.id, noteId, fileName: file.name });
          return attachment;
        } catch (error) {
          log.error('Failed to add attachment', { noteId, fileName: file.name, error });
          return null;
        }
      },

      deleteAttachment: (id: string) => {
        const attachment = get().attachments[id];
        if (!attachment) {
          log.warn('Attachment not found', { id });
          return;
        }

        set((state) => {
          const { [id]: _deleted, ...remaining } = state.attachments;
          return { attachments: remaining };
        });

        log.debug('Attachment deleted', { id, fileName: attachment.fileName });
      },

      getAttachmentsByNote: (noteId: string): NoteAttachment[] => {
        return Object.values(get().attachments)
          .filter((a) => a.noteId === noteId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },

      deleteAttachmentsByNote: (noteId: string) => {
        const state = get();
        const remaining: Record<string, NoteAttachment> = {};
        let deletedCount = 0;

        Object.entries(state.attachments).forEach(([id, attachment]) => {
          if (attachment.noteId !== noteId) {
            remaining[id] = attachment;
          } else {
            deletedCount++;
          }
        });

        if (deletedCount > 0) {
          set({ attachments: remaining });
          log.debug('Deleted attachments for note', { noteId, count: deletedCount });
        }
      },
    }),
    {
      name: 'note-attachments',
      storage: createJSONStorage(() => createSyncedStorage()),
      version: 1,
      partialize: (state) => ({
        attachments: state.attachments,
      }),
    },
  ),
);
