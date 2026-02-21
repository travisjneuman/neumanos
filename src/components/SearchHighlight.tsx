/**
 * SearchHighlight Component
 *
 * Renders text with matched characters highlighted.
 * Used in search results to show which parts of the text matched the query.
 */

import React from 'react';
import { getHighlightSegments } from '../utils/fuzzySearch';

interface SearchHighlightProps {
  text: string;
  matchedIndices?: number[];
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ text, matchedIndices }) => {
  if (!matchedIndices || matchedIndices.length === 0) {
    return <>{text}</>;
  }

  const segments = getHighlightSegments(text, matchedIndices);

  return (
    <>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark
            key={i}
            className="bg-accent-yellow/30 text-inherit rounded-sm px-0"
          >
            {segment.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{segment.text}</React.Fragment>
        )
      )}
    </>
  );
};
