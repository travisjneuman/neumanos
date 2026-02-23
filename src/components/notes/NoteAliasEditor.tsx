/**
 * NoteAliasEditor - Editable tag-style list for note aliases
 *
 * Allows users to add/remove alternative names for a note.
 * Aliases are used for wiki-link resolution: [[alias]] resolves to the note.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useNotesStore } from '../../stores/useNotesStore';

interface NoteAliasEditorProps {
  noteId: string;
  aliases: string[];
}

export const NoteAliasEditor: React.FC<NoteAliasEditorProps> = ({ noteId, aliases }) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateAliases = useNotesStore((state) => state.updateAliases);

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || aliases.includes(trimmed)) {
      setInputValue('');
      return;
    }
    updateAliases(noteId, [...aliases, trimmed]);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, aliases, noteId, updateAliases]);

  const handleRemove = useCallback(
    (alias: string) => {
      updateAliases(
        noteId,
        aliases.filter((a) => a !== alias)
      );
    },
    [aliases, noteId, updateAliases]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      } else if (e.key === 'Backspace' && !inputValue && aliases.length > 0) {
        handleRemove(aliases[aliases.length - 1]);
      }
    },
    [handleAdd, handleRemove, inputValue, aliases]
  );

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors flex items-center gap-1"
      >
        <span className="text-[10px]">{isExpanded ? '▾' : '▸'}</span>
        Aliases
        {aliases.length > 0 && (
          <span className="text-[10px] bg-surface-light-elevated dark:bg-surface-dark-elevated px-1.5 rounded-full">
            {aliases.length}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {aliases.map((alias) => (
            <span
              key={alias}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent-primary/10 text-accent-primary rounded-full"
            >
              {alias}
              <button
                onClick={() => handleRemove(alias)}
                className="hover:text-status-error-text dark:hover:text-status-error-text-dark transition-colors text-[10px] leading-none"
                title={`Remove alias "${alias}"`}
              >
                x
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) handleAdd();
            }}
            placeholder="Add alias..."
            className="text-xs bg-transparent border-none outline-none text-text-light-primary dark:text-text-dark-primary placeholder-text-light-tertiary dark:placeholder-text-dark-tertiary min-w-[80px] flex-shrink"
          />
        </div>
      )}
    </div>
  );
};
