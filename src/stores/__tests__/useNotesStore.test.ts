/**
 * Notes Store Tests
 *
 * Tests the Zustand notes store for CRUD operations, queries,
 * tags, templates, and daily notes functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock logger
vi.mock('../../services/logger', () => ({
  logger: {
    module: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock syncedStorage
vi.mock('../../lib/syncedStorage', () => ({
  createSyncedStorage: vi.fn(() => ({
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
}));

// Mock useUndoStore
vi.mock('../useUndoStore', () => ({
  useUndoStore: {
    getState: () => ({
      addUndoAction: vi.fn(() => 'mock-undo-id'),
    }),
  },
}));

// Mock useSettingsStore
vi.mock('../useSettingsStore', () => ({
  useSettingsStore: {
    getState: () => ({
      dailyNotesFolderId: null,
    }),
  },
}));

// Mock useProjectContextStore
vi.mock('../useProjectContextStore', () => ({
  useProjectContextStore: {
    getState: () => ({
      activeProjectIds: [],
    }),
  },
  matchesProjectFilter: vi.fn(() => true),
}));

// Mock utils
vi.mock('../../utils/backlinks', () => ({
  extractWikiLinks: vi.fn(() => []),
  resolveLinksToIds: vi.fn(() => []),
  getBacklinks: vi.fn(() => []),
}));

vi.mock('../../services/dailyNotes', () => ({
  getDailyNote: vi.fn(() => null),
  createDailyNote: vi.fn((date: Date, _notes: Record<string, unknown>, folderId: string | null) => ({
    id: `daily-${date.toISOString().split('T')[0]}`,
    title: `Daily Note - ${date.toLocaleDateString()}`,
    content: '',
    folderId: folderId,
    tags: ['daily'],
    isPinned: false,
    isArchived: false,
    isFavorite: false,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
    linkedNoteIds: [],
  })),
}));

vi.mock('../../utils/blockReferences', () => ({
  findBlockInContent: vi.fn(() => null),
}));

vi.mock('../../utils/notePreview', () => ({
  createNotePreview: vi.fn((note) => ({
    id: note.id,
    title: note.title,
    preview: note.content?.substring(0, 100) || '',
    tags: note.tags || [],
  })),
}));

// Mock indexedDB service to prevent unhandled rejections
vi.mock('../../services/indexedDB', () => ({
  indexedDBService: {
    deleteNoteImages: vi.fn(() => Promise.resolve()),
  },
}));

// Import after mocking
import { useNotesStore } from '../useNotesStore';

describe('useNotesStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useNotesStore.getState();
    act(() => {
      store.clearAllNotes();
    });
    vi.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    describe('createNote', () => {
      it('should create a note with default values', () => {
        const store = useNotesStore.getState();

        const note = store.createNote();

        expect(note).toBeDefined();
        expect(note.id).toBeDefined();
        expect(note.title).toBe('Untitled Note');
        expect(note.content).toBe('');
        expect(note.tags).toEqual([]);
        expect(note.isPinned).toBe(false);
        expect(note.isArchived).toBe(false);
        // isFavorite is optional and undefined by default
        expect(note.isFavorite).toBeFalsy();
      });

      it('should create a note with custom values', () => {
        const store = useNotesStore.getState();

        const note = store.createNote({
          title: 'Test Note',
          content: 'Test content',
          tags: ['test', 'example'],
          folderId: 'folder-1',
        });

        expect(note.title).toBe('Test Note');
        expect(note.content).toBe('Test content');
        expect(note.tags).toEqual(['test', 'example']);
        expect(note.folderId).toBe('folder-1');
      });

      it('should add created note to store', () => {
        const store = useNotesStore.getState();

        const note = store.createNote({ title: 'New Note' });
        const retrieved = store.getNote(note.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.title).toBe('New Note');
      });
    });

    describe('getNote', () => {
      it('should return undefined for non-existent note', () => {
        const store = useNotesStore.getState();

        const note = store.getNote('non-existent');

        expect(note).toBeUndefined();
      });

      it('should return the correct note', () => {
        const store = useNotesStore.getState();
        const created = store.createNote({ title: 'Find Me' });

        const note = store.getNote(created.id);

        expect(note?.title).toBe('Find Me');
      });
    });

    describe('updateNote', () => {
      it('should update note fields', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Original' });

        store.updateNote(note.id, { title: 'Updated' });

        const updated = store.getNote(note.id);
        expect(updated?.title).toBe('Updated');
      });

      it('should update multiple fields at once', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Original' });

        store.updateNote(note.id, {
          title: 'Updated Title',
          content: 'New content',
          tags: ['updated'],
        });

        const updated = store.getNote(note.id);
        expect(updated?.title).toBe('Updated Title');
        expect(updated?.content).toBe('New content');
        expect(updated?.tags).toEqual(['updated']);
      });

      it('should update updatedAt timestamp', async () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Original' });
        const originalUpdatedAt = note.updatedAt.getTime();

        // Small delay to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));

        store.updateNote(note.id, { title: 'Updated' });

        const updated = store.getNote(note.id);
        // updatedAt should be later than the original
        expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt);
      });

      it('should not update non-existent note', () => {
        const store = useNotesStore.getState();

        // Should not throw
        expect(() => {
          store.updateNote('non-existent', { title: 'Test' });
        }).not.toThrow();
      });
    });

    describe('deleteNote', () => {
      it('should remove note from store', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'To Delete' });

        store.deleteNote(note.id);

        const deleted = store.getNote(note.id);
        expect(deleted).toBeUndefined();
      });

      it('should not throw when deleting non-existent note', () => {
        const store = useNotesStore.getState();

        expect(() => {
          store.deleteNote('non-existent');
        }).not.toThrow();
      });

      it('should clear activeNoteId if deleted note was active', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Active Note' });
        store.setActiveNote(note.id);

        store.deleteNote(note.id);

        expect(useNotesStore.getState().activeNoteId).toBeNull();
      });
    });

    describe('duplicateNote', () => {
      it('should create a copy of the note', () => {
        const store = useNotesStore.getState();
        const original = store.createNote({
          title: 'Original',
          content: 'Test content',
          tags: ['test'],
        });

        const duplicate = store.duplicateNote(original.id);

        expect(duplicate).toBeDefined();
        expect(duplicate?.id).not.toBe(original.id);
        expect(duplicate?.title).toBe('Original (Copy)');
        expect(duplicate?.content).toBe('Test content');
        expect(duplicate?.tags).toEqual(['test']);
      });

      it('should return null for non-existent note', () => {
        const store = useNotesStore.getState();

        const duplicate = store.duplicateNote('non-existent');

        expect(duplicate).toBeNull();
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('deleteNotes', () => {
      it('should delete multiple notes', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Note 1' });
        const note2 = store.createNote({ title: 'Note 2' });
        const note3 = store.createNote({ title: 'Note 3' });

        store.deleteNotes([note1.id, note2.id]);

        expect(store.getNote(note1.id)).toBeUndefined();
        expect(store.getNote(note2.id)).toBeUndefined();
        expect(store.getNote(note3.id)).toBeDefined();
      });
    });

    describe('moveNote', () => {
      it('should move note to different folder', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Mobile Note', folderId: 'folder-1' });

        store.moveNote(note.id, 'folder-2');

        const moved = store.getNote(note.id);
        expect(moved?.folderId).toBe('folder-2');
      });

      it('should move note to root (null folder)', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Mobile Note', folderId: 'folder-1' });

        store.moveNote(note.id, null);

        const moved = store.getNote(note.id);
        expect(moved?.folderId).toBeNull();
      });
    });

    describe('moveNotesToFolder', () => {
      it('should move multiple notes to folder', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Note 1', folderId: null });
        const note2 = store.createNote({ title: 'Note 2', folderId: null });

        store.moveNotesToFolder([note1.id, note2.id], 'target-folder');

        expect(store.getNote(note1.id)?.folderId).toBe('target-folder');
        expect(store.getNote(note2.id)?.folderId).toBe('target-folder');
      });
    });

    describe('archiveNotes', () => {
      it('should archive multiple notes', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Note 1' });
        const note2 = store.createNote({ title: 'Note 2' });

        store.archiveNotes([note1.id, note2.id]);

        expect(store.getNote(note1.id)?.isArchived).toBe(true);
        expect(store.getNote(note2.id)?.isArchived).toBe(true);
      });
    });

    describe('unarchiveNotes', () => {
      it('should unarchive multiple notes', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Note 1' });
        const note2 = store.createNote({ title: 'Note 2' });
        store.archiveNotes([note1.id, note2.id]);

        store.unarchiveNotes([note1.id, note2.id]);

        expect(store.getNote(note1.id)?.isArchived).toBe(false);
        expect(store.getNote(note2.id)?.isArchived).toBe(false);
      });
    });
  });

  describe('Query Operations', () => {
    describe('getAllNotes', () => {
      it('should return all notes', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1' });
        store.createNote({ title: 'Note 2' });
        store.createNote({ title: 'Note 3' });

        const notes = store.getAllNotes();

        expect(notes).toHaveLength(3);
      });

      it('should return empty array when no notes', () => {
        const store = useNotesStore.getState();

        const notes = store.getAllNotes();

        expect(notes).toEqual([]);
      });
    });

    describe('getNotesByFolder', () => {
      it('should return notes in specific folder', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1', folderId: 'folder-1' });
        store.createNote({ title: 'Note 2', folderId: 'folder-1' });
        store.createNote({ title: 'Note 3', folderId: 'folder-2' });

        const notes = store.getNotesByFolder('folder-1');

        expect(notes).toHaveLength(2);
        expect(notes.every(n => n.folderId === 'folder-1')).toBe(true);
      });

      it('should return root notes when folderId is null', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Root Note', folderId: null });
        store.createNote({ title: 'Folder Note', folderId: 'folder-1' });

        const notes = store.getNotesByFolder(null);

        expect(notes).toHaveLength(1);
        expect(notes[0].title).toBe('Root Note');
      });
    });

    describe('searchNotes', () => {
      it('should find notes by title', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Meeting Notes' });
        store.createNote({ title: 'Shopping List' });
        store.createNote({ title: 'Project Notes' });

        const results = store.searchNotes('Notes');

        expect(results.length).toBeGreaterThanOrEqual(2);
      });

      it('should find notes by content', () => {
        const store = useNotesStore.getState();
        // searchNotes uses contentText field (plain text for indexing), not content (Lexical JSON)
        store.createNote({ title: 'Note 1', contentText: 'Contains search term' });
        store.createNote({ title: 'Note 2', contentText: 'Different content' });

        const results = store.searchNotes('search term');

        expect(results.length).toBeGreaterThanOrEqual(1);
      });

      it('should return empty array for no matches', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1' });

        const results = store.searchNotes('xyz123notfound');

        expect(results).toEqual([]);
      });

      it('should be case insensitive', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'UPPERCASE Note' });

        const results = store.searchNotes('uppercase');

        expect(results.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getNotesBy', () => {
      it('should filter notes by predicate', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Will be pinned' });
        store.createNote({ title: 'Not Pinned' });

        // Pin the first note
        store.togglePin(note1.id);

        const pinnedNotes = store.getNotesBy(n => n.isPinned);

        expect(pinnedNotes).toHaveLength(1);
        expect(pinnedNotes[0].title).toBe('Will be pinned');
      });
    });
  });

  describe('Pin/Archive/Favorite', () => {
    describe('togglePin', () => {
      it('should pin an unpinned note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });

        store.togglePin(note.id);

        expect(store.getNote(note.id)?.isPinned).toBe(true);
      });

      it('should unpin a pinned note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });
        store.togglePin(note.id);

        store.togglePin(note.id);

        expect(store.getNote(note.id)?.isPinned).toBe(false);
      });
    });

    describe('toggleArchive', () => {
      it('should archive an unarchived note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });

        store.toggleArchive(note.id);

        expect(store.getNote(note.id)?.isArchived).toBe(true);
      });

      it('should unarchive an archived note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });
        store.toggleArchive(note.id);

        store.toggleArchive(note.id);

        expect(store.getNote(note.id)?.isArchived).toBe(false);
      });
    });

    describe('toggleFavorite', () => {
      it('should favorite an unfavorited note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });

        store.toggleFavorite(note.id);

        expect(store.getNote(note.id)?.isFavorite).toBe(true);
      });

      it('should unfavorite a favorited note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });
        store.toggleFavorite(note.id);

        store.toggleFavorite(note.id);

        expect(store.getNote(note.id)?.isFavorite).toBe(false);
      });
    });
  });

  describe('Tags', () => {
    describe('addTag', () => {
      it('should add a tag to note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });

        store.addTag(note.id, 'new-tag');

        expect(store.getNote(note.id)?.tags).toContain('new-tag');
      });

      it('should not add duplicate tags', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test', tags: ['existing'] });

        store.addTag(note.id, 'existing');

        expect(store.getNote(note.id)?.tags.filter(t => t === 'existing')).toHaveLength(1);
      });
    });

    describe('removeTag', () => {
      it('should remove a tag from note', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test', tags: ['tag1', 'tag2'] });

        store.removeTag(note.id, 'tag1');

        const tags = store.getNote(note.id)?.tags;
        expect(tags).not.toContain('tag1');
        expect(tags).toContain('tag2');
      });
    });

    describe('getAllTags', () => {
      it('should return all unique tags', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1', tags: ['tag1', 'tag2'] });
        store.createNote({ title: 'Note 2', tags: ['tag2', 'tag3'] });

        const tags = store.getAllTags();

        expect(tags).toContain('tag1');
        expect(tags).toContain('tag2');
        expect(tags).toContain('tag3');
        // No duplicates
        expect(tags.filter(t => t === 'tag2')).toHaveLength(1);
      });
    });

    describe('getTagUsageCounts', () => {
      it('should return usage count per tag', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1', tags: ['shared', 'unique1'] });
        store.createNote({ title: 'Note 2', tags: ['shared', 'unique2'] });
        store.createNote({ title: 'Note 3', tags: ['shared'] });

        const counts = store.getTagUsageCounts();

        expect(counts.get('shared')).toBe(3);
        expect(counts.get('unique1')).toBe(1);
        expect(counts.get('unique2')).toBe(1);
      });
    });

    describe('bulkAddTag', () => {
      it('should add tag to multiple notes', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Note 1' });
        const note2 = store.createNote({ title: 'Note 2' });

        store.bulkAddTag([note1.id, note2.id], 'bulk-tag');

        expect(store.getNote(note1.id)?.tags).toContain('bulk-tag');
        expect(store.getNote(note2.id)?.tags).toContain('bulk-tag');
      });
    });

    describe('bulkRemoveTag', () => {
      it('should remove tag from multiple notes', () => {
        const store = useNotesStore.getState();
        const note1 = store.createNote({ title: 'Note 1', tags: ['remove-me'] });
        const note2 = store.createNote({ title: 'Note 2', tags: ['remove-me'] });

        store.bulkRemoveTag([note1.id, note2.id], 'remove-me');

        expect(store.getNote(note1.id)?.tags).not.toContain('remove-me');
        expect(store.getNote(note2.id)?.tags).not.toContain('remove-me');
      });
    });
  });

  describe('UI State', () => {
    describe('setActiveNote', () => {
      it('should set active note id', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });

        store.setActiveNote(note.id);

        expect(useNotesStore.getState().activeNoteId).toBe(note.id);
      });

      it('should clear active note when set to null', () => {
        const store = useNotesStore.getState();
        const note = store.createNote({ title: 'Test' });
        store.setActiveNote(note.id);

        store.setActiveNote(null);

        expect(useNotesStore.getState().activeNoteId).toBeNull();
      });
    });

    describe('setSortConfig', () => {
      it('should update sort configuration', () => {
        const store = useNotesStore.getState();

        store.setSortConfig({ field: 'title', order: 'asc' });

        const state = useNotesStore.getState();
        expect(state.sortConfig.field).toBe('title');
        expect(state.sortConfig.order).toBe('asc');
      });
    });

    describe('setFilter', () => {
      it('should update filter', () => {
        const store = useNotesStore.getState();

        // NoteFilter is a string type: 'all' | 'favorites' | 'pinned' | 'archived' | 'unarchived'
        store.setFilter('favorites');

        const state = useNotesStore.getState();
        expect(state.filter).toBe('favorites');
      });
    });
  });

  describe('Templates', () => {
    describe('getAllNoteTemplates', () => {
      it('should return built-in templates', () => {
        const store = useNotesStore.getState();

        const templates = store.getAllNoteTemplates();

        expect(templates.length).toBeGreaterThan(0);
        expect(templates.some(t => t.id === 'meeting-notes')).toBe(true);
      });
    });

    describe('createNoteFromTemplate', () => {
      it('should create note from template', () => {
        const store = useNotesStore.getState();

        const note = store.createNoteFromTemplate('meeting-notes');

        expect(note).toBeDefined();
        // Template description is stored in contentText (plain text for indexing)
        expect(note?.contentText).toContain('Meeting Notes');
        expect(note?.tags).toContain('meeting');
      });

      it('should return null for non-existent template', () => {
        const store = useNotesStore.getState();

        const note = store.createNoteFromTemplate('non-existent');

        expect(note).toBeNull();
      });
    });

    describe('createNoteTemplate', () => {
      it('should create custom template', () => {
        const store = useNotesStore.getState();

        const template = store.createNoteTemplate({
          name: 'Custom Template',
          description: 'Custom content',
          category: 'Custom',
        });

        expect(template.id).toBeDefined();
        expect(template.name).toBe('Custom Template');
        expect(template.isBuiltIn).toBe(false);
      });
    });

    describe('deleteNoteTemplate', () => {
      it('should delete custom template', () => {
        const store = useNotesStore.getState();
        const template = store.createNoteTemplate({
          name: 'To Delete',
          description: 'Will be deleted',
        });

        store.deleteNoteTemplate(template.id);

        const found = store.getNoteTemplate(template.id);
        expect(found).toBeUndefined();
      });
    });
  });

  describe('Import/Export', () => {
    describe('exportNotes', () => {
      it('should return all notes for export', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1' });
        store.createNote({ title: 'Note 2' });

        const exported = store.exportNotes();

        expect(exported).toHaveLength(2);
      });
    });

    describe('importNotes', () => {
      it('should import notes with merge=false (replace)', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Existing' });

        const now = new Date();
        const toImport = [
          {
            id: 'imported-1',
            title: 'Imported Note',
            content: '',
            contentText: '',
            folderId: null,
            tags: [],
            projectIds: [],
            isPinned: false,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          },
        ];

        store.importNotes(toImport as any, false);

        // Access notes directly from state to bypass filter
        const state = useNotesStore.getState();
        const notesList = Object.values(state.notes);
        expect(notesList.some(n => n.title === 'Imported Note')).toBe(true);
        // merge=false replaces all notes, so 'Existing' should be gone
        expect(notesList.some(n => n.title === 'Existing')).toBe(false);
      });

      it('should import notes with merge=true (add)', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Existing' });

        // Access notes directly from state to get accurate count
        const initialCount = Object.keys(useNotesStore.getState().notes).length;

        const now = new Date();
        const toImport = [
          {
            id: 'imported-2',
            title: 'Imported Note',
            content: '',
            contentText: '',
            folderId: null,
            tags: [],
            projectIds: [],
            isPinned: false,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
          },
        ];

        store.importNotes(toImport as any, true);

        // Access notes directly from state to bypass filter
        const state = useNotesStore.getState();
        const notesList = Object.values(state.notes);
        expect(notesList.length).toBe(initialCount + 1);
        // merge=true keeps existing notes
        expect(notesList.some(n => n.title === 'Existing')).toBe(true);
        expect(notesList.some(n => n.title === 'Imported Note')).toBe(true);
      });
    });

    describe('clearAllNotes', () => {
      it('should remove all notes', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1' });
        store.createNote({ title: 'Note 2' });

        store.clearAllNotes();

        expect(store.getAllNotes()).toHaveLength(0);
      });
    });
  });

  describe('Utility', () => {
    describe('getNoteCount', () => {
      it('should return correct count', () => {
        const store = useNotesStore.getState();
        store.createNote({ title: 'Note 1' });
        store.createNote({ title: 'Note 2' });
        store.createNote({ title: 'Note 3' });

        expect(store.getNoteCount()).toBe(3);
      });

      it('should return 0 when empty', () => {
        const store = useNotesStore.getState();

        expect(store.getNoteCount()).toBe(0);
      });
    });
  });
});
