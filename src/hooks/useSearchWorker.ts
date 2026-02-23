/**
 * useSearchWorker
 *
 * Provides index-and-search functionality backed by a Web Worker so that
 * heavy tokenization / inverted-index work never blocks the main thread.
 *
 * Falls back to a synchronous main-thread implementation when Web Workers
 * are not available (SSR, older browsers, Jest, etc.).
 */

import { useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrored from searchWorker.ts — kept inline to avoid cross-boundary
// imports that would pull worker code into the main bundle)
// ---------------------------------------------------------------------------

export interface SearchableItem {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

type WorkerResponse =
  | { type: 'indexed'; totalItems: number }
  | { type: 'results'; requestId: string; ids: string[] }
  | { type: 'error'; message: string };

// ---------------------------------------------------------------------------
// Main-thread fallback (synchronous, no worker)
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

class MainThreadSearch {
  private index = new Map<string, Set<string>>();

  buildIndex(items: SearchableItem[]): void {
    this.index.clear();
    for (const item of items) {
      const parts = [item.title, item.content];
      if (item.tags) parts.push(item.tags.join(' '));
      const tokens = new Set(tokenize(parts.join(' ')));
      for (const token of tokens) {
        let postings = this.index.get(token);
        if (!postings) {
          postings = new Set<string>();
          this.index.set(token, postings);
        }
        postings.add(item.id);
      }
    }
  }

  search(query: string, limit = 50): string[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const indexTokens = Array.from(this.index.keys());
    const scores = new Map<string, number>();

    for (const qToken of queryTokens) {
      const matched = new Set<string>();

      const exact = this.index.get(qToken);
      if (exact) {
        for (const id of exact) matched.add(id);
      }

      if (qToken.length >= 3) {
        for (const token of indexTokens) {
          if (token !== qToken && token.startsWith(qToken)) {
            const postings = this.index.get(token);
            if (postings) {
              for (const id of postings) matched.add(id);
            }
          }
        }
      }

      for (const id of matched) {
        scores.set(id, (scores.get(id) ?? 0) + 1);
      }
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseSearchWorkerReturn {
  /**
   * Feed items into the search index.
   * Safe to call multiple times — each call replaces the previous index.
   */
  indexItems: (items: SearchableItem[]) => void;
  /**
   * Search the index for matching item IDs, ordered by relevance.
   * Returns a promise so callers can await results uniformly regardless
   * of whether the worker or fallback path is active.
   */
  search: (query: string, limit?: number) => Promise<string[]>;
}

export function useSearchWorker(): UseSearchWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const fallbackRef = useRef<MainThreadSearch | null>(null);
  const pendingRef = useRef<Map<string, (ids: string[]) => void>>(new Map());
  const requestIdRef = useRef(0);

  // Determine worker support once on mount
  const supportsWorker = typeof Worker !== 'undefined';

  useEffect(() => {
    if (!supportsWorker) {
      fallbackRef.current = new MainThreadSearch();
      return;
    }

    // Vite-native worker import
    const worker = new Worker(
      new URL('../workers/searchWorker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'results') {
        const resolve = pendingRef.current.get(msg.requestId);
        if (resolve) {
          resolve(msg.ids);
          pendingRef.current.delete(msg.requestId);
        }
      }
      // 'indexed' and 'error' are fire-and-forget for now
    });

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, [supportsWorker]);

  const indexItems = useCallback((items: SearchableItem[]) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'index', data: { items } });
    } else {
      fallbackRef.current?.buildIndex(items);
    }
  }, []);

  const search = useCallback((query: string, limit = 50): Promise<string[]> => {
    if (workerRef.current) {
      const requestId = String(++requestIdRef.current);
      return new Promise<string[]>((resolve) => {
        pendingRef.current.set(requestId, resolve);
        workerRef.current!.postMessage({ type: 'search', data: { query, limit }, requestId });
      });
    }

    // Synchronous fallback — wrap in a resolved promise for API uniformity
    const ids = fallbackRef.current?.search(query, limit) ?? [];
    return Promise.resolve(ids);
  }, []);

  return { indexItems, search };
}
