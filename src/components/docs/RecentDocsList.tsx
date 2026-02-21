/**
 * RecentDocsList Component
 *
 * Displays recently accessed documents with type icon, title,
 * last modified date, and file type badge.
 */

import { useMemo } from 'react';
import { FileText, Table2, Presentation, Clock } from 'lucide-react';
import { useDocsStore } from '../../stores/useDocsStore';
import type { Doc, DocType } from '../../types';

const DOC_TYPE_ICONS: Record<DocType, React.ComponentType<{ className?: string }>> = {
  doc: FileText,
  sheet: Table2,
  slides: Presentation,
};

const DOC_TYPE_LABELS: Record<DocType, string> = {
  doc: 'Document',
  sheet: 'Spreadsheet',
  slides: 'Presentation',
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  doc: 'text-accent-primary',
  sheet: 'text-accent-secondary',
  slides: 'text-accent-purple',
};

interface RecentDocsListProps {
  onDocClick: (doc: Doc) => void;
  limit?: number;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Generates a simple text preview from TipTap JSON content */
function getDocPreview(doc: Doc): string {
  if (doc.type !== 'doc') {
    if (doc.type === 'sheet') return 'Spreadsheet';
    if (doc.type === 'slides') return 'Presentation';
    return '';
  }

  try {
    const content = JSON.parse((doc as { content: string }).content);
    const texts: string[] = [];

    function extractText(node: { type?: string; text?: string; content?: unknown[] }): void {
      if (node.text) {
        texts.push(node.text);
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          extractText(child as { type?: string; text?: string; content?: unknown[] });
          if (texts.join(' ').length > 120) return;
        }
      }
    }

    extractText(content);
    const preview = texts.join(' ').slice(0, 120);
    return preview || 'Empty document';
  } catch {
    return 'Empty document';
  }
}

export function RecentDocsList({ onDocClick, limit = 8 }: RecentDocsListProps) {
  const getRecentDocs = useDocsStore((s) => s.getRecentDocs);
  const docs = useDocsStore((s) => s.docs);

  const recentDocs = useMemo(
    () => getRecentDocs(limit),
    // Re-compute when docs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docs, limit]
  );

  if (recentDocs.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Clock className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
        <h3 className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wider">
          Recent
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {recentDocs.map((doc) => {
          const Icon = DOC_TYPE_ICONS[doc.type];
          const colorClass = DOC_TYPE_COLORS[doc.type];
          const preview = getDocPreview(doc);
          const timeStr = formatRelativeTime(doc.lastAccessedAt || doc.updatedAt);

          return (
            <button
              key={doc.id}
              onClick={() => onDocClick(doc)}
              className="flex flex-col p-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent-primary/50 hover:shadow-sm transition-all text-left group"
            >
              {/* Header with icon and type */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />
                  <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                    {doc.title}
                  </span>
                </div>
              </div>

              {/* Preview text */}
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary line-clamp-2 mb-2 min-h-[2rem]">
                {preview}
              </p>

              {/* Footer with type badge and time */}
              <div className="flex items-center justify-between w-full mt-auto">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-light-alt dark:bg-surface-dark-elevated text-text-light-tertiary dark:text-text-dark-tertiary">
                  {DOC_TYPE_LABELS[doc.type]}
                </span>
                <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                  {timeStr}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RecentDocsList;
