/**
 * FindReplaceBar Component
 *
 * Provides find and replace functionality for the TipTap document editor.
 * Supports case-sensitive search, whole word matching, and match navigation.
 * Triggered via Ctrl+F (find) and Ctrl+H (find & replace).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Replace,
  ReplaceAll,
  CaseSensitive,
  WholeWord,
} from 'lucide-react';

interface FindReplaceBarProps {
  editor: Editor;
  showReplace: boolean;
  onClose: () => void;
}

interface SearchMatch {
  from: number;
  to: number;
}

/** Find all text matches in the editor document */
function findMatches(
  editor: Editor,
  searchTerm: string,
  caseSensitive: boolean,
  wholeWord: boolean
): SearchMatch[] {
  if (!searchTerm) return [];

  const matches: SearchMatch[] = [];
  const flags = caseSensitive ? 'g' : 'gi';
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch {
    return [];
  }

  // Search node by node for accurate positions
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    const nodeText = node.text;
    let match: RegExpExecArray | null;
    const nodeRegex = new RegExp(regex.source, regex.flags);

    while ((match = nodeRegex.exec(nodeText)) !== null) {
      matches.push({
        from: pos + match.index,
        to: pos + match.index + match[0].length,
      });
      if (match[0].length === 0) break;
    }
  });

  return matches;
}

/** Apply search highlight decorations using TipTap highlight marks */
function highlightMatches(
  editor: Editor,
  matches: SearchMatch[],
  activeIndex: number
): void {
  clearHighlights(editor);

  if (matches.length === 0) return;

  const { tr } = editor.state;
  const mark = editor.schema.marks['highlight'];
  if (!mark) return;

  matches.forEach((match, idx) => {
    const isActive = idx === activeIndex;
    tr.addMark(
      match.from,
      match.to,
      mark.create({ color: isActive ? '#FBBF24' : '#FEF08A' })
    );
  });

  tr.setMeta('findReplace', true);
  editor.view.dispatch(tr);
}

/** Clear all search highlight decorations */
function clearHighlights(editor: Editor): void {
  const { tr } = editor.state;
  const mark = editor.schema.marks['highlight'];
  if (!mark) return;

  tr.removeMark(0, editor.state.doc.content.size, mark);
  tr.setMeta('findReplace', true);
  editor.view.dispatch(tr);
}

export function FindReplaceBar({ editor, showReplace, onClose }: FindReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isReplaceVisible, setIsReplaceVisible] = useState(showReplace);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);

  useEffect(() => {
    setIsReplaceVisible(showReplace);
  }, [showReplace]);

  // Search when term or options change
  useEffect(() => {
    const found = findMatches(editor, searchTerm, caseSensitive, wholeWord);
    setMatches(found);
    setActiveMatchIndex(0);

    if (found.length > 0) {
      highlightMatches(editor, found, 0);
      scrollToMatch(editor, found[0]);
    } else {
      clearHighlights(editor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, caseSensitive, wholeWord, editor]);

  useEffect(() => {
    return () => {
      clearHighlights(editor);
    };
  }, [editor]);

  const scrollToMatch = useCallback((ed: Editor, match: SearchMatch) => {
    ed.commands.setTextSelection({ from: match.from, to: match.to });
    const domAtPos = ed.view.domAtPos(match.from);
    const el = domAtPos.node instanceof HTMLElement
      ? domAtPos.node
      : domAtPos.node.parentElement;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (activeMatchIndex + 1) % matches.length;
    setActiveMatchIndex(nextIndex);
    highlightMatches(editor, matches, nextIndex);
    scrollToMatch(editor, matches[nextIndex]);
  }, [matches, activeMatchIndex, editor, scrollToMatch]);

  const goToPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prevIndex = (activeMatchIndex - 1 + matches.length) % matches.length;
    setActiveMatchIndex(prevIndex);
    highlightMatches(editor, matches, prevIndex);
    scrollToMatch(editor, matches[prevIndex]);
  }, [matches, activeMatchIndex, editor, scrollToMatch]);

  const replaceOne = useCallback(() => {
    if (matches.length === 0) return;
    const match = matches[activeMatchIndex];

    editor.chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .deleteSelection()
      .insertContent(replaceTerm)
      .run();

    const found = findMatches(editor, searchTerm, caseSensitive, wholeWord);
    setMatches(found);
    const newIndex = Math.min(activeMatchIndex, Math.max(0, found.length - 1));
    setActiveMatchIndex(newIndex);

    if (found.length > 0) {
      highlightMatches(editor, found, newIndex);
      scrollToMatch(editor, found[newIndex]);
    } else {
      clearHighlights(editor);
    }
  }, [matches, activeMatchIndex, replaceTerm, editor, searchTerm, caseSensitive, wholeWord, scrollToMatch]);

  const replaceAllMatches = useCallback(() => {
    if (matches.length === 0) return;

    // Replace from end to start to preserve positions
    const sortedMatches = [...matches].sort((a, b) => b.from - a.from);
    let chain = editor.chain().focus();

    for (const match of sortedMatches) {
      chain = chain
        .setTextSelection({ from: match.from, to: match.to })
        .deleteSelection()
        .insertContent(replaceTerm);
    }

    chain.run();

    const found = findMatches(editor, searchTerm, caseSensitive, wholeWord);
    setMatches(found);
    setActiveMatchIndex(0);
    clearHighlights(editor);
  }, [matches, replaceTerm, editor, searchTerm, caseSensitive, wholeWord]);

  const handleClose = useCallback(() => {
    clearHighlights(editor);
    onClose();
  }, [editor, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          goToPrev();
        } else {
          goToNext();
        }
      }
    },
    [handleClose, goToNext, goToPrev]
  );

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg">
      {/* Find row */}
      <div className="flex items-center gap-2">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find..."
          className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-surface-light-alt dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
          aria-label="Search text"
        />

        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary whitespace-nowrap min-w-[60px] text-center">
          {matches.length > 0
            ? `${activeMatchIndex + 1} of ${matches.length}`
            : searchTerm
              ? 'No results'
              : ''}
        </span>

        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          title="Case sensitive (Alt+C)"
          className={`p-1.5 rounded transition-colors ${
            caseSensitive
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
          aria-pressed={caseSensitive}
        >
          <CaseSensitive className="w-4 h-4" />
        </button>
        <button
          onClick={() => setWholeWord(!wholeWord)}
          title="Whole word (Alt+W)"
          className={`p-1.5 rounded transition-colors ${
            wholeWord
              ? 'bg-accent-primary/10 text-accent-primary'
              : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary'
          }`}
          aria-pressed={wholeWord}
        >
          <WholeWord className="w-4 h-4" />
        </button>

        <button
          onClick={goToPrev}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
          className="p-1.5 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={goToNext}
          disabled={matches.length === 0}
          title="Next match (Enter)"
          className="p-1.5 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <button
          onClick={handleClose}
          title="Close (Escape)"
          className="p-1.5 rounded text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Replace row */}
      {isReplaceVisible && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace..."
            className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-surface-light-alt dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            aria-label="Replace text"
          />

          <button
            onClick={replaceOne}
            disabled={matches.length === 0}
            title="Replace current match"
            className="p-1.5 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Replace className="w-4 h-4" />
          </button>
          <button
            onClick={replaceAllMatches}
            disabled={matches.length === 0}
            title="Replace all matches"
            className="p-1.5 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ReplaceAll className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsReplaceVisible(false)}
            title="Hide replace"
            className="p-1.5 rounded text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors text-xs"
          >
            Find only
          </button>
        </div>
      )}

      {!isReplaceVisible && (
        <button
          onClick={() => setIsReplaceVisible(true)}
          className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary hover:text-accent-primary transition-colors self-start"
        >
          Show Replace
        </button>
      )}
    </div>
  );
}

export default FindReplaceBar;
