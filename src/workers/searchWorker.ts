/**
 * Full-Text Search Web Worker
 *
 * Offloads index building and search operations from the main thread.
 * Uses an inverted index with prefix-matching for fuzzy search.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchableItem {
  id: string;
  title: string;
  content: string;
  tags?: string[];
}

type SearchRequest =
  | { type: 'index'; data: IndexPayload }
  | { type: 'search'; data: SearchPayload; requestId: string };

interface IndexPayload {
  items: SearchableItem[];
}

interface SearchPayload {
  query: string;
  limit?: number;
}

interface SearchResultItem {
  id: string;
  score: number;
}

type WorkerResponse =
  | { type: 'indexed'; totalItems: number }
  | { type: 'results'; requestId: string; ids: string[] }
  | { type: 'error'; message: string };

// ---------------------------------------------------------------------------
// Index state (worker-scoped, lives for the lifetime of this worker)
// ---------------------------------------------------------------------------

/** inverted index: token -> Set of item IDs */
const invertedIndex = new Map<string, Set<string>>();

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// ---------------------------------------------------------------------------
// Index building
// ---------------------------------------------------------------------------

function buildIndex(items: SearchableItem[]): void {
  invertedIndex.clear();

  for (const item of items) {
    const textParts = [item.title, item.content];
    if (item.tags && item.tags.length > 0) {
      textParts.push(item.tags.join(' '));
    }

    const tokens = tokenize(textParts.join(' '));
    const uniqueTokens = new Set(tokens);

    for (const token of uniqueTokens) {
      let postings = invertedIndex.get(token);
      if (!postings) {
        postings = new Set<string>();
        invertedIndex.set(token, postings);
      }
      postings.add(item.id);
    }
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Returns item IDs that match the query, ordered by relevance score
 * (number of matching query terms).
 *
 * Fuzzy matching: for query terms of 3+ characters, also matches any
 * indexed token that starts with the query term (prefix matching).
 */
function search(query: string, limit = 50): string[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Collect all tokens from the index that should be checked for each query term
  const indexTokens = Array.from(invertedIndex.keys());

  // scores: itemId -> count of matched query terms
  const scores = new Map<string, number>();

  for (const qToken of queryTokens) {
    const matched = new Set<string>();

    // Exact match
    const exactPostings = invertedIndex.get(qToken);
    if (exactPostings) {
      for (const id of exactPostings) matched.add(id);
    }

    // Prefix match for terms >= 3 chars
    if (qToken.length >= 3) {
      for (const token of indexTokens) {
        if (token !== qToken && token.startsWith(qToken)) {
          const prefixPostings = invertedIndex.get(token);
          if (prefixPostings) {
            for (const id of prefixPostings) matched.add(id);
          }
        }
      }
    }

    for (const id of matched) {
      scores.set(id, (scores.get(id) ?? 0) + 1);
    }
  }

  // Sort by score descending, then slice to limit
  const ranked: SearchResultItem[] = [];
  for (const [id, score] of scores) {
    ranked.push({ id, score });
  }
  ranked.sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit).map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.addEventListener('message', (event: MessageEvent<SearchRequest>) => {
  const req = event.data;

  try {
    if (req.type === 'index') {
      buildIndex(req.data.items);
      const response: WorkerResponse = { type: 'indexed', totalItems: req.data.items.length };
      self.postMessage(response);
    } else if (req.type === 'search') {
      const ids = search(req.data.query, req.data.limit);
      const response: WorkerResponse = { type: 'results', requestId: req.requestId, ids };
      self.postMessage(response);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const response: WorkerResponse = { type: 'error', message };
    self.postMessage(response);
  }
});
