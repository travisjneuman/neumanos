import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, RotateCcw, ChevronDown } from 'lucide-react';
import { useCustomCSSStore } from '../../stores/useCustomCSSStore';
import { cssSnippets } from '../../data/cssSnippets';

const MAX_CSS_BYTES = 51200;

export const CustomCSSEditor: React.FC = () => {
  const { css, enabled, lastUpdated, updateCSS, toggleEnabled, resetCSS } = useCustomCSSStore();
  const [draft, setDraft] = useState(css);
  const [livePreview, setLivePreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);

  const byteCount = new Blob([draft]).size;
  const isOverLimit = byteCount > MAX_CSS_BYTES;
  const isDirty = draft !== css;

  const handleSave = useCallback(() => {
    if (!isOverLimit) {
      updateCSS(draft);
    }
  }, [draft, isOverLimit, updateCSS]);

  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      if (livePreview && !isOverLimit) {
        updateCSS(value);
      }
    },
    [livePreview, isOverLimit, updateCSS]
  );

  const handleReset = useCallback(() => {
    resetCSS();
    setDraft('');
    setShowResetConfirm(false);
  }, [resetCSS]);

  const handleInsertSnippet = useCallback(
    (snippetCSS: string) => {
      const newCSS = draft ? `${draft}\n\n${snippetCSS}` : snippetCSS;
      setDraft(newCSS);
      if (livePreview) {
        updateCSS(newCSS);
      }
      setShowSnippets(false);
    },
    [draft, livePreview, updateCSS]
  );

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="p-3 rounded-lg bg-status-warning-bg dark:bg-status-warning-bg-dark border border-status-warning-border dark:border-status-warning-border-dark">
        <p className="text-sm text-status-warning-text dark:text-status-warning-text-dark">
          Custom CSS may break the UI. Use at your own risk. Certain patterns (imports, external URLs) are stripped for security.
        </p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Enable Toggle */}
        <button
          onClick={toggleEnabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            enabled
              ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
              : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark'
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full transition-colors ${
              enabled ? 'bg-accent-primary' : 'bg-text-light-tertiary dark:bg-text-dark-tertiary'
            }`}
          />
          {enabled ? 'Enabled' : 'Disabled'}
        </button>

        {/* Live Preview Toggle */}
        <label className="flex items-center gap-2 text-sm text-text-light-secondary dark:text-text-dark-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={livePreview}
            onChange={(e) => setLivePreview(e.target.checked)}
            className="rounded"
          />
          Live preview
        </label>

        {/* Snippets Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSnippets(!showSnippets)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border border-border-light dark:border-border-dark hover:border-accent-primary/50 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            Snippets
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSnippets ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSnippets && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 w-72 max-h-80 overflow-y-auto rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-xl z-50"
              >
                {cssSnippets.map((snippet) => (
                  <button
                    key={snippet.name}
                    onClick={() => handleInsertSnippet(snippet.css)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors border-b border-border-light/50 dark:border-border-dark/50 last:border-b-0"
                  >
                    <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {snippet.name}
                    </p>
                    <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
                      {snippet.description}
                    </p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isDirty || isOverLimit}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-accent-primary text-white hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>

        {/* Reset Button */}
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={!css && !draft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-status-error hover:bg-status-error-bg dark:hover:bg-status-error-bg-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-status-error">Are you sure?</span>
            <button
              onClick={handleReset}
              className="px-3 py-1 rounded text-xs font-medium bg-status-error text-white hover:bg-status-error/80 transition-colors"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1 rounded text-xs text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* CSS Editor Textarea */}
      <div className="relative">
        <textarea
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          placeholder={`/* Enter custom CSS here */\n\n.bento-card {\n  border-radius: 1rem;\n}`}
          spellCheck={false}
          className={`w-full h-64 p-4 rounded-lg font-mono text-sm leading-relaxed resize-y bg-[#1e1e2e] text-[#cdd6f4] border ${
            isOverLimit
              ? 'border-status-error'
              : 'border-border-light dark:border-border-dark focus:border-accent-primary'
          } focus:outline-none focus:ring-1 focus:ring-accent-primary/30 placeholder:text-[#585b70]`}
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", tabSize: 2 }}
        />

        {/* Character Count */}
        <div
          className={`absolute bottom-3 right-3 text-xs px-2 py-0.5 rounded ${
            isOverLimit
              ? 'bg-status-error/20 text-status-error'
              : 'bg-black/30 text-[#585b70]'
          }`}
        >
          {byteCount.toLocaleString()} / {MAX_CSS_BYTES.toLocaleString()}
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          Last saved: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
};
