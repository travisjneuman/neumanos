/**
 * Fuzzy Search Utility
 *
 * Provides fuzzy matching for note search with scoring and highlighting.
 * Supports both exact substring matches (higher score) and fuzzy character matches.
 */

export interface FuzzyMatch {
  /** Match score (0-1, higher = better) */
  score: number;
  /** Character indices that matched (for highlighting) */
  matchedIndices: number[];
}

/**
 * Perform fuzzy matching of a query against a target string.
 * Returns null if no match, or a FuzzyMatch with score and matched indices.
 *
 * Scoring priorities:
 * 1. Exact substring match (score: 0.9-1.0)
 * 2. Word-start matches (score bonus)
 * 3. Consecutive character matches (score bonus)
 * 4. Character proximity (closer = better)
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query || !target) return null;

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Check exact substring match first (highest priority)
  const exactIndex = targetLower.indexOf(queryLower);
  if (exactIndex !== -1) {
    const indices: number[] = [];
    for (let i = exactIndex; i < exactIndex + queryLower.length; i++) {
      indices.push(i);
    }
    // Score based on position (earlier = better) and match ratio
    const positionBonus = 1 - (exactIndex / target.length) * 0.1;
    const ratioBonus = queryLower.length / target.length;
    const score = Math.min(0.9 + ratioBonus * 0.1, 1.0) * positionBonus;
    return { score, matchedIndices: indices };
  }

  // Fuzzy character-by-character matching
  let queryIdx = 0;
  const matchedIndices: number[] = [];
  let consecutiveMatches = 0;
  let maxConsecutive = 0;
  let lastMatchIdx = -1;

  for (let targetIdx = 0; targetIdx < targetLower.length && queryIdx < queryLower.length; targetIdx++) {
    if (targetLower[targetIdx] === queryLower[queryIdx]) {
      matchedIndices.push(targetIdx);

      // Track consecutive matches
      if (lastMatchIdx === targetIdx - 1) {
        consecutiveMatches++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 1;
      }

      lastMatchIdx = targetIdx;
      queryIdx++;
    }
  }

  // All query characters must be found
  if (queryIdx !== queryLower.length) return null;

  // Calculate score based on multiple factors
  const matchRatio = queryLower.length / target.length;
  const consecutiveBonus = maxConsecutive / queryLower.length;
  const spread = matchedIndices[matchedIndices.length - 1] - matchedIndices[0] + 1;
  const compactness = queryLower.length / spread;

  // Word-start bonus: check if matches align with word boundaries
  let wordStartBonus = 0;
  for (const idx of matchedIndices) {
    if (idx === 0 || targetLower[idx - 1] === ' ' || targetLower[idx - 1] === '-' || targetLower[idx - 1] === '_') {
      wordStartBonus += 0.1;
    }
  }
  wordStartBonus = Math.min(wordStartBonus, 0.3);

  const score = Math.min(
    (matchRatio * 0.3 + consecutiveBonus * 0.3 + compactness * 0.2 + wordStartBonus + 0.1) * 0.85,
    0.85 // Cap fuzzy match score below exact match
  );

  return { score, matchedIndices };
}

export interface SearchResult<T> {
  item: T;
  score: number;
  /** Map of field name to matched indices for highlighting */
  matches: Record<string, number[]>;
}

/**
 * Search items using fuzzy matching across multiple fields.
 * Returns sorted results (highest score first).
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  fields: Array<{
    key: keyof T;
    weight: number; // 0-1, importance of this field
  }>,
  maxResults: number = 50
): SearchResult<T>[] {
  if (!query.trim()) return [];

  const results: SearchResult<T>[] = [];

  for (const item of items) {
    let bestScore = 0;
    const matches: Record<string, number[]> = {};

    for (const field of fields) {
      const value = item[field.key];
      if (typeof value !== 'string') continue;

      const match = fuzzyMatch(query, value);
      if (match) {
        const weightedScore = match.score * field.weight;
        if (weightedScore > bestScore) {
          bestScore = weightedScore;
        }
        matches[field.key as string] = match.matchedIndices;
      }
    }

    // Also try matching against array fields (like tags)
    for (const field of fields) {
      const value = item[field.key];
      if (!Array.isArray(value)) continue;

      for (const arrayItem of value) {
        if (typeof arrayItem !== 'string') continue;
        const match = fuzzyMatch(query, arrayItem);
        if (match) {
          const weightedScore = match.score * field.weight * 0.8; // Slight penalty for array matches
          if (weightedScore > bestScore) {
            bestScore = weightedScore;
          }
          matches[field.key as string] = match.matchedIndices;
        }
      }
    }

    if (bestScore > 0) {
      results.push({ item, score: bestScore, matches });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * Highlight matched characters in a string by wrapping them in <mark> tags.
 * Returns an array of segments for React rendering.
 */
export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

export function getHighlightSegments(text: string, matchedIndices: number[]): HighlightSegment[] {
  if (!matchedIndices.length || !text) {
    return [{ text, isMatch: false }];
  }

  const indexSet = new Set(matchedIndices);
  const segments: HighlightSegment[] = [];
  let currentSegment = '';
  let currentIsMatch = false;

  for (let i = 0; i < text.length; i++) {
    const isMatch = indexSet.has(i);

    if (i === 0) {
      currentIsMatch = isMatch;
      currentSegment = text[i];
    } else if (isMatch === currentIsMatch) {
      currentSegment += text[i];
    } else {
      segments.push({ text: currentSegment, isMatch: currentIsMatch });
      currentSegment = text[i];
      currentIsMatch = isMatch;
    }
  }

  if (currentSegment) {
    segments.push({ text: currentSegment, isMatch: currentIsMatch });
  }

  return segments;
}
