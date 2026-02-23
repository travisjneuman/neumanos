/**
 * Conversation Search Panel
 * Search across all saved AI terminal conversations by message content
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageSquare } from 'lucide-react';
import { useTerminalStore } from '../../stores/useTerminalStore';
import type { ConversationSearchResult } from '../../stores/useTerminalStore';

interface ConversationSearchPanelProps {
  onClose: () => void;
}

export const ConversationSearchPanel: React.FC<ConversationSearchPanelProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchConversations = useTerminalStore((s) => s.searchConversations);
  const switchConversation = useTerminalStore((s) => s.switchConversation);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const results: ConversationSearchResult[] = useMemo(
    () => (query.length >= 2 ? searchConversations(query) : []),
    [query, searchConversations]
  );

  // Group results by conversation
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; results: ConversationSearchResult[] }>();
    for (const r of results) {
      if (!map.has(r.conversationId)) {
        map.set(r.conversationId, { title: r.conversationTitle, results: [] });
      }
      map.get(r.conversationId)!.results.push(r);
    }
    return map;
  }, [results]);

  const handleSelect = useCallback(
    (conversationId: string) => {
      switchConversation(conversationId);
      onClose();
    },
    [switchConversation, onClose]
  );

  // Highlight matching text in snippet
  const highlightMatch = useCallback(
    (snippet: string) => {
      if (!query.trim()) return snippet;
      const lowerSnippet = snippet.toLowerCase();
      const lowerQuery = query.toLowerCase().trim();
      const idx = lowerSnippet.indexOf(lowerQuery);
      if (idx === -1) return snippet;

      const before = snippet.slice(0, idx);
      const match = snippet.slice(idx, idx + query.trim().length);
      const after = snippet.slice(idx + query.trim().length);

      return (
        <>
          {before}
          <mark className="bg-accent-yellow/40 text-inherit rounded px-0.5">{match}</mark>
          {after}
        </>
      );
    },
    [query]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-dark flex-shrink-0">
        <Search size={14} className="text-text-dark-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conversations..."
          className="flex-1 bg-transparent text-sm text-text-dark-primary placeholder-text-dark-tertiary outline-none"
          autoComplete="off"
        />
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-dark-elevated rounded transition-colors text-text-dark-secondary hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 && (
          <div className="px-4 py-8 text-center text-text-dark-tertiary text-sm">
            Type at least 2 characters to search
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-8 text-center text-text-dark-tertiary text-sm">
            No matching conversations found
          </div>
        )}

        {Array.from(grouped.entries()).map(([convId, group]) => (
          <div key={convId} className="border-b border-border-dark/50 last:border-0">
            <button
              onClick={() => handleSelect(convId)}
              className="w-full text-left px-3 py-2 hover:bg-surface-dark-elevated transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={12} className="text-accent-green flex-shrink-0" />
                <span className="text-xs font-medium text-accent-green truncate">
                  {group.title}
                </span>
                <span className="text-[10px] text-text-dark-tertiary ml-auto flex-shrink-0">
                  {group.results.length} match{group.results.length !== 1 ? 'es' : ''}
                </span>
              </div>
              {/* Show first match snippet */}
              <div className="text-xs text-text-dark-secondary line-clamp-2 pl-5">
                <span className="text-text-dark-tertiary">
                  {group.results[0].messageRole === 'user' ? 'You: ' : 'AI: '}
                </span>
                {highlightMatch(group.results[0].matchSnippet)}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border-dark text-[10px] text-text-dark-tertiary text-center flex-shrink-0">
        {results.length > 0
          ? `${results.length} result${results.length !== 1 ? 's' : ''} in ${grouped.size} conversation${grouped.size !== 1 ? 's' : ''}`
          : 'Search across all saved conversations'}
      </div>
    </div>
  );
};
