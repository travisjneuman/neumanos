/**
 * Version Diff View Component
 *
 * Renders a unified diff between two version snapshots.
 * Lines are compared line-by-line with additions (green) and deletions (red).
 */

import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { NoteVersion } from '../../types/notes';

interface VersionDiffViewProps {
  oldVersion: NoteVersion;
  newVersion: NoteVersion;
  onClose: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

/**
 * Compute a simple line-by-line diff using longest common subsequence.
 * Returns an array of DiffLine entries for unified rendering.
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.push({
        type: 'unchanged',
        content: oldLines[i - 1],
        oldLineNum: i,
        newLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({
        type: 'added',
        content: newLines[j - 1],
        newLineNum: j,
      });
      j--;
    } else {
      result.push({
        type: 'removed',
        content: oldLines[i - 1],
        oldLineNum: i,
      });
      i--;
    }
  }

  result.reverse();
  return result;
}

export const VersionDiffView: React.FC<VersionDiffViewProps> = ({
  oldVersion,
  newVersion,
  onClose,
}) => {
  const diffLines = useMemo(
    () => computeDiff(oldVersion.contentText, newVersion.contentText),
    [oldVersion.contentText, newVersion.contentText]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === 'added') added++;
      if (line.type === 'removed') removed++;
    }
    return { added, removed };
  }, [diffLines]);

  return (
    <div className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          <span>Comparing versions</span>
          <span className="text-green-500">+{stats.added}</span>
          <span className="text-red-500">-{stats.removed}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-light dark:hover:bg-surface-dark transition-colors text-text-light-tertiary dark:text-text-dark-tertiary"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Diff content */}
      <div className="max-h-80 overflow-y-auto font-mono text-xs leading-5">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={`flex ${
              line.type === 'added'
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : line.type === 'removed'
                  ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                  : 'text-text-light-primary dark:text-text-dark-primary'
            }`}
          >
            <span className="w-8 flex-shrink-0 text-right pr-2 select-none text-text-light-tertiary dark:text-text-dark-tertiary opacity-50">
              {line.oldLineNum ?? ' '}
            </span>
            <span className="w-8 flex-shrink-0 text-right pr-2 select-none text-text-light-tertiary dark:text-text-dark-tertiary opacity-50">
              {line.newLineNum ?? ' '}
            </span>
            <span className="w-4 flex-shrink-0 text-center select-none">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-all px-1">
              {line.content || '\u00A0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
