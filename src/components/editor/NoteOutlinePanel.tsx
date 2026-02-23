/**
 * NoteOutlinePanel - Persistent side panel showing heading hierarchy
 *
 * Displays H1-H6 headings with indentation, click-to-scroll,
 * and active heading highlighting based on scroll position.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { OutlineHeading } from './plugins/OutlinePanelPlugin';
import { scrollToHeading } from './plugins/OutlinePanelPlugin';

interface NoteOutlinePanelProps {
  headings: OutlineHeading[];
  isOpen: boolean;
}

export const NoteOutlinePanel: React.FC<NoteOutlinePanelProps> = ({ headings, isOpen }) => {
  const [editor] = useLexicalComposerContext();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (!isOpen || headings.length === 0) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const visibleKeys = new Map<string, IntersectionObserverEntry>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = entry.target.getAttribute('data-lexical-outline-key');
          if (key) {
            if (entry.isIntersecting) {
              visibleKeys.set(key, entry);
            } else {
              visibleKeys.delete(key);
            }
          }
        });

        // Pick the topmost visible heading
        if (visibleKeys.size > 0) {
          let topmost: string | null = null;
          let topY = Infinity;
          visibleKeys.forEach((entry, key) => {
            const rect = entry.boundingClientRect;
            if (rect.top < topY) {
              topY = rect.top;
              topmost = key;
            }
          });
          if (topmost) {
            setActiveKey(topmost);
          }
        }
      },
      {
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0,
      },
    );

    // Observe heading elements
    headings.forEach((heading) => {
      const element = editor.getElementByKey(heading.key);
      if (element) {
        element.setAttribute('data-lexical-outline-key', heading.key);
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [editor, headings, isOpen]);

  const handleClick = useCallback(
    (key: string) => {
      scrollToHeading(editor, key);
      setActiveKey(key);
    },
    [editor],
  );

  if (!isOpen) return null;

  const minLevel = headings.length > 0 ? Math.min(...headings.map((h) => h.level)) : 1;

  return (
    <div
      className="w-[200px] flex-shrink-0 border-l border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-y-auto transition-all duration-200"
    >
      <div className="px-3 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary mb-3">
          Outline
        </div>

        {headings.length === 0 ? (
          <div className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary italic">
            Add headings to see an outline
          </div>
        ) : (
          <nav>
            <ul className="space-y-0.5">
              {headings.map((heading) => {
                const indent = (heading.level - minLevel) * 12;
                const isActive = activeKey === heading.key;
                return (
                  <li key={heading.key}>
                    <button
                      onClick={() => handleClick(heading.key)}
                      className={`w-full text-left text-[11px] leading-tight py-1 px-2 rounded transition-colors duration-150 truncate ${
                        isActive
                          ? 'text-accent-primary bg-accent-primary/10 font-medium'
                          : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                      }`}
                      style={{ paddingLeft: `${indent + 8}px` }}
                      title={heading.text}
                    >
                      {heading.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};
