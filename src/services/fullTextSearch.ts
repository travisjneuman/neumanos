/**
 * Full-Text Search Service for Notes
 *
 * Client-side full-text search implementation using inverted index
 * Avoids external FTS libraries (Lunr, Fuse.js) to keep bundle size small (<10KB impact)
 *
 * Features:
 * - Tokenization: lowercase, whitespace split, punctuation removal
 * - Inverted index: token -> note IDs mapping
 * - Relevance ranking: TF-IDF scoring
 * - Persistence: Index stored in IndexedDB for fast startup
 */

import type { Note } from '../types/notes';
import { indexedDBService } from './indexedDB';
import { logger } from './logger';

const log = logger.module('FullTextSearch');

const FTS_INDEX_KEY = 'notes-fts-index';
const FTS_VERSION_KEY = 'notes-fts-version';
const CURRENT_VERSION = '1.0.0';

/**
 * Inverted index structure:
 * token -> Set of note IDs containing that token
 */
interface InvertedIndex {
  [token: string]: Set<string>;
}

/**
 * Document frequency: how many documents contain each token
 * Used for TF-IDF scoring
 */
interface DocumentFrequency {
  [token: string]: number;
}

/**
 * Search index state
 */
interface SearchIndex {
  index: InvertedIndex;
  documentFrequency: DocumentFrequency;
  totalDocuments: number;
  version: string;
  lastUpdated: string;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  noteId: string;
  score: number;
  matchedTokens: string[];
}

/**
 * Full-Text Search Engine
 */
class FullTextSearchService {
  private index: InvertedIndex = {};
  private documentFrequency: DocumentFrequency = {};
  private totalDocuments = 0;
  private isInitialized = false;

  /**
   * Initialize the search index (load from IndexedDB or rebuild)
   */
  async initialize(notes: Note[]): Promise<void> {
    try {
      // Try loading persisted index
      const persisted = await this.loadIndex();

      if (persisted && persisted.version === CURRENT_VERSION) {
        // Use cached index
        this.index = this.deserializeIndex(persisted.index as unknown as Record<string, string[]>);
        this.documentFrequency = persisted.documentFrequency;
        this.totalDocuments = persisted.totalDocuments;
        this.isInitialized = true;
        log.info('Loaded search index from cache', { totalDocuments: this.totalDocuments });
        return;
      }

      // Rebuild index from scratch
      await this.rebuildIndex(notes);
    } catch (error) {
      log.error('Failed to initialize search index', { error });
      // Fallback: rebuild from scratch
      await this.rebuildIndex(notes);
    }
  }

  /**
   * Rebuild the entire search index from notes
   */
  async rebuildIndex(notes: Note[]): Promise<void> {
    log.info('Rebuilding search index', { noteCount: notes.length });

    // Reset index
    this.index = {};
    this.documentFrequency = {};
    this.totalDocuments = notes.length;

    // Build inverted index
    notes.forEach(note => {
      this.indexNote(note);
    });

    // Persist to IndexedDB
    await this.saveIndex();

    this.isInitialized = true;
    log.info('Search index rebuilt', { totalDocuments: this.totalDocuments, uniqueTokens: Object.keys(this.index).length });
  }

  /**
   * Index a single note (add to inverted index)
   */
  indexNote(note: Note): void {
    // Combine title and content text for indexing
    const text = `${note.title} ${note.contentText}`;
    const tokens = this.tokenize(text);

    // Track unique tokens per document (for document frequency)
    const uniqueTokens = new Set(tokens);

    uniqueTokens.forEach(token => {
      // Add to inverted index
      if (!this.index[token]) {
        this.index[token] = new Set();
        this.documentFrequency[token] = 0;
      }

      this.index[token].add(note.id);

      // Update document frequency
      if (!this.index[token].has(note.id)) {
        this.documentFrequency[token]++;
      }
    });
  }

  /**
   * Remove a note from the index (when deleted)
   */
  removeNoteFromIndex(noteId: string): void {
    // Remove note ID from all token sets
    Object.keys(this.index).forEach(token => {
      if (this.index[token].has(noteId)) {
        this.index[token].delete(noteId);
        this.documentFrequency[token]--;

        // Clean up empty token entries
        if (this.index[token].size === 0) {
          delete this.index[token];
          delete this.documentFrequency[token];
        }
      }
    });

    this.totalDocuments--;
  }

  /**
   * Update index when a note is modified
   */
  async updateNoteInIndex(note: Note): Promise<void> {
    // Remove old index entries
    this.removeNoteFromIndex(note.id);

    // Re-index the note
    this.indexNote(note);

    // Persist changes
    await this.saveIndex();
  }

  /**
   * Search notes by query string
   * Returns ranked results with relevance scores
   */
  search(query: string, maxResults = 100): SearchResult[] {
    if (!this.isInitialized) {
      log.warn('Search index not initialized');
      return [];
    }

    if (!query.trim()) {
      return [];
    }

    // Tokenize query
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      return [];
    }

    // Find notes containing query tokens
    const candidateNotes = new Map<string, Set<string>>(); // noteId -> matched tokens

    queryTokens.forEach(token => {
      const noteIds = this.index[token];
      if (noteIds) {
        noteIds.forEach(noteId => {
          if (!candidateNotes.has(noteId)) {
            candidateNotes.set(noteId, new Set());
          }
          candidateNotes.get(noteId)!.add(token);
        });
      }
    });

    // Rank results by TF-IDF score
    const results: SearchResult[] = [];

    candidateNotes.forEach((matchedTokens, noteId) => {
      const score = this.calculateTfIdfScore(matchedTokens, queryTokens);
      results.push({
        noteId,
        score,
        matchedTokens: Array.from(matchedTokens)
      });
    });

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Return top N results
    return results.slice(0, maxResults);
  }

  /**
   * Tokenize text: lowercase, split on whitespace, remove punctuation
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(token => token.length > 1); // Remove single-character tokens
  }

  /**
   * Calculate TF-IDF score for a document
   * TF (Term Frequency): how often a term appears in the document
   * IDF (Inverse Document Frequency): how rare a term is across all documents
   */
  private calculateTfIdfScore(matchedTokens: Set<string>, queryTokens: string[]): number {
    let score = 0;

    matchedTokens.forEach(token => {
      // Term frequency: number of times token appears in query
      const tf = queryTokens.filter(t => t === token).length / queryTokens.length;

      // Inverse document frequency: log(total docs / docs containing token)
      const df = this.documentFrequency[token] || 1;
      const idf = Math.log(this.totalDocuments / df);

      // TF-IDF score
      score += tf * idf;
    });

    return score;
  }

  /**
   * Save index to IndexedDB
   */
  private async saveIndex(): Promise<void> {
    try {
      const serialized = {
        index: this.serializeIndex(this.index),
        documentFrequency: this.documentFrequency,
        totalDocuments: this.totalDocuments,
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString()
      };

      await indexedDBService.setItem(FTS_INDEX_KEY, JSON.stringify(serialized));
      await indexedDBService.setItem(FTS_VERSION_KEY, CURRENT_VERSION);
    } catch (error) {
      log.error('Failed to save search index', { error });
    }
  }

  /**
   * Load index from IndexedDB
   */
  private async loadIndex(): Promise<SearchIndex | null> {
    try {
      const data = await indexedDBService.getItem(FTS_INDEX_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data) as SearchIndex;
      return parsed;
    } catch (error) {
      log.error('Failed to load search index', { error });
      return null;
    }
  }

  /**
   * Serialize inverted index (Set -> Array for JSON)
   */
  private serializeIndex(index: InvertedIndex): Record<string, string[]> {
    const serialized: Record<string, string[]> = {};
    Object.keys(index).forEach(token => {
      serialized[token] = Array.from(index[token]);
    });
    return serialized;
  }

  /**
   * Deserialize inverted index (Array -> Set)
   */
  private deserializeIndex(serialized: Record<string, string[]>): InvertedIndex {
    const index: InvertedIndex = {};
    Object.keys(serialized).forEach(token => {
      index[token] = new Set(serialized[token]);
    });
    return index;
  }

  /**
   * Clear the search index
   */
  async clearIndex(): Promise<void> {
    this.index = {};
    this.documentFrequency = {};
    this.totalDocuments = 0;
    this.isInitialized = false;

    await indexedDBService.removeItem(FTS_INDEX_KEY);
    await indexedDBService.removeItem(FTS_VERSION_KEY);

    log.info('Search index cleared');
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalDocuments: number;
    uniqueTokens: number;
    isInitialized: boolean;
  } {
    return {
      totalDocuments: this.totalDocuments,
      uniqueTokens: Object.keys(this.index).length,
      isInitialized: this.isInitialized
    };
  }
}

// Export singleton instance
export const fullTextSearch = new FullTextSearchService();
