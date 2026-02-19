import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Note } from '../types/notes';

/**
 * Notes Database using Dexie.js for IndexedDB
 * Handles efficient storage and querying of notes with compound indexes
 */
class NotesDatabase extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    // Historical name retained for data continuity — do not rename without migration
    super('NeumanBrainNotes');

    // Schema version 1 with compound indexes for common query patterns
    this.version(1).stores({
      // Primary key: id
      // Compound indexes:
      // - [folderId+updatedAt]: For sorted folder views (most common query)
      // - [tags+updatedAt]: For tag-filtered views
      // - updatedAt: For global sorting
      // - title: For title searches
      notes: 'id, [folderId+updatedAt], updatedAt, title, *tags, isPinned, isArchived, isFavorite'
    });
  }
}

// Create database instance
export const db = new NotesDatabase();

/**
 * Notes Database Helper Functions
 * Provides a clean API for database operations optimized with compound indexes
 */
export const notesDb = {
  // ==================== NOTES CRUD ====================

  /**
   * Add a new note
   */
  async addNote(note: Note): Promise<void> {
    await db.notes.add(note);
  },

  /**
   * Get a single note by ID
   */
  async getNote(id: string): Promise<Note | undefined> {
    return await db.notes.get(id);
  },

  /**
   * Update a note
   */
  async updateNote(id: string, updates: Partial<Note>): Promise<void> {
    await db.notes.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  },

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  },

  /**
   * Get all notes
   */
  async getAllNotes(): Promise<Note[]> {
    return await db.notes.toArray();
  },

  // ==================== OPTIMIZED QUERIES (using compound indexes) ====================

  /**
   * Get notes by folder, sorted by updatedAt (OPTIMIZED with compound index)
   * Uses [folderId+updatedAt] compound index for fast sorted queries
   */
  async getNotesByFolder(folderId: string | null, order: 'asc' | 'desc' = 'desc'): Promise<Note[]> {
    const collection = db.notes
      .where('[folderId+updatedAt]')
      .between(
        [folderId, Dexie.minKey],
        [folderId, Dexie.maxKey],
        true,
        true
      );

    return order === 'desc'
      ? await collection.reverse().toArray()
      : await collection.toArray();
  },

  /**
   * Get notes by tag, sorted by updatedAt (OPTIMIZED with multiEntry index)
   * Uses tags multiEntry index combined with updatedAt sort
   */
  async getNotesByTag(tag: string, order: 'asc' | 'desc' = 'desc'): Promise<Note[]> {
    const notes = await db.notes
      .where('tags')
      .equals(tag)
      .toArray();

    // Sort in memory (tags is multiEntry, can't use compound index)
    return notes.sort((a, b) => {
      const comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
      return order === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Get pinned notes, sorted by updatedAt
   */
  async getPinnedNotes(order: 'asc' | 'desc' = 'desc'): Promise<Note[]> {
    const collection = db.notes
      .where('isPinned')
      .equals(1);

    const notes = await collection.toArray();
    return notes.sort((a, b) => {
      const comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
      return order === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Get archived notes, sorted by updatedAt
   */
  async getArchivedNotes(order: 'asc' | 'desc' = 'desc'): Promise<Note[]> {
    const collection = db.notes
      .where('isArchived')
      .equals(1);

    const notes = await collection.toArray();
    return notes.sort((a, b) => {
      const comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
      return order === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Get favorite notes, sorted by updatedAt
   */
  async getFavoriteNotes(order: 'asc' | 'desc' = 'desc'): Promise<Note[]> {
    const collection = db.notes
      .where('isFavorite')
      .equals(1);

    const notes = await collection.toArray();
    return notes.sort((a, b) => {
      const comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
      return order === 'desc' ? -comparison : comparison;
    });
  },

  /**
   * Search notes by title (uses title index)
   */
  async searchNotesByTitle(query: string): Promise<Note[]> {
    return await db.notes
      .where('title')
      .startsWithIgnoreCase(query)
      .or('title')
      .equalsIgnoreCase(query)
      .toArray();
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update notes (for tag operations, folder moves, etc.)
   */
  async bulkUpdateNotes(updates: Array<{ id: string; updates: Partial<Note> }>): Promise<void> {
    await db.transaction('rw', db.notes, async () => {
      for (const { id, updates: noteUpdates } of updates) {
        await db.notes.update(id, {
          ...noteUpdates,
          updatedAt: new Date()
        });
      }
    });
  },

  /**
   * Bulk delete notes
   */
  async bulkDeleteNotes(ids: string[]): Promise<void> {
    await db.notes.bulkDelete(ids);
  },

  /**
   * Import notes (for backup restore)
   */
  async importNotes(notes: Note[]): Promise<void> {
    await db.notes.bulkAdd(notes);
  },

  /**
   * Export all notes (for backup)
   */
  async exportAllNotes(): Promise<Note[]> {
    return await db.notes.toArray();
  },

  /**
   * Clear all notes (for testing or reset)
   */
  async clearAllNotes(): Promise<void> {
    await db.notes.clear();
  },

  // ==================== STATISTICS ====================

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalNotes: number;
    pinnedCount: number;
    archivedCount: number;
    favoriteCount: number;
    foldersUsed: number;
    tagsUsed: number;
  }> {
    const notes = await db.notes.toArray();
    const folderIds = new Set(notes.map(n => n.folderId).filter(Boolean));
    const allTags = new Set(notes.flatMap(n => n.tags));

    return {
      totalNotes: notes.length,
      pinnedCount: notes.filter(n => n.isPinned).length,
      archivedCount: notes.filter(n => n.isArchived).length,
      favoriteCount: notes.filter(n => n.isFavorite).length,
      foldersUsed: folderIds.size,
      tagsUsed: allTags.size
    };
  }
};

export default notesDb;
