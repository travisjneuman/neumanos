/**
 * Bookmarks Widget
 *
 * Save, organize, and quickly access bookmarks/links.
 * All data stored locally in localStorage (privacy-first).
 */

import React, { useState, useCallback } from 'react';
import { BaseWidget } from './BaseWidget';
import { WidgetEmptyState } from '../../components/WidgetEmptyState';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  group: string;
}

const STORAGE_KEY = 'widget-bookmarks';

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: Bookmark[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

/** Extract a favicon URL from a given page URL */
function getFaviconUrl(url: string): string {
  try {
    const { origin } = new URL(url);
    return `${origin}/favicon.ico`;
  } catch {
    return '';
  }
}

/** Truncate long URLs for display */
function displayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export const BookmarksWidget: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [group, setGroup] = useState('');

  const groups = [...new Set(bookmarks.map((b) => b.group).filter(Boolean))];

  const persist = useCallback((updated: Bookmark[]) => {
    setBookmarks(updated);
    saveBookmarks(updated);
  }, []);

  const handleAdd = () => {
    if (!title.trim() || !url.trim()) return;

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    if (editId) {
      persist(
        bookmarks.map((b) =>
          b.id === editId ? { ...b, title: title.trim(), url: normalizedUrl, group: group.trim() } : b
        )
      );
      setEditId(null);
    } else {
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        title: title.trim(),
        url: normalizedUrl,
        group: group.trim(),
      };
      persist([...bookmarks, newBookmark]);
    }

    setTitle('');
    setUrl('');
    setGroup('');
    setShowAddForm(false);
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditId(bookmark.id);
    setTitle(bookmark.title);
    setUrl(bookmark.url);
    setGroup(bookmark.group);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    persist(bookmarks.filter((b) => b.id !== id));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditId(null);
    setTitle('');
    setUrl('');
    setGroup('');
  };

  // Group bookmarks
  const ungrouped = bookmarks.filter((b) => !b.group);
  const grouped = groups.map((g) => ({
    name: g,
    items: bookmarks.filter((b) => b.group === g),
  }));

  const renderBookmarkItem = (bookmark: Bookmark) => (
    <div
      key={bookmark.id}
      className="flex items-center gap-2 p-2 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark transition-all duration-standard ease-smooth group/item"
    >
      <img
        src={getFaviconUrl(bookmark.url)}
        alt=""
        className="w-4 h-4 rounded-sm flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 text-sm text-text-light-primary dark:text-text-dark-primary hover:text-accent-blue truncate"
        title={bookmark.url}
      >
        {bookmark.title}
      </a>
      <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary hidden sm:inline truncate max-w-[80px]">
        {displayUrl(bookmark.url)}
      </span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(bookmark);
          }}
          className="p-1 hover:bg-surface-light dark:hover:bg-surface-dark-elevated rounded"
          title="Edit"
        >
          <Pencil className="w-3 h-3 text-text-light-secondary dark:text-text-dark-secondary" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(bookmark.id);
          }}
          className="p-1 hover:bg-accent-red/10 rounded"
          title="Delete"
        >
          <Trash2 className="w-3 h-3 text-accent-red" />
        </button>
      </div>
    </div>
  );

  return (
    <BaseWidget title="Bookmarks" icon="🔖" subtitle={`${bookmarks.length} links`}>
      <div className="flex flex-col h-full min-h-[160px]">
        {bookmarks.length === 0 && !showAddForm ? (
          <WidgetEmptyState
            icon="🔖"
            message="No bookmarks yet"
            hint="Save quick links to your favorite sites"
            action={{ label: 'Add Bookmark', onClick: () => setShowAddForm(true) }}
          />
        ) : (
          <>
            {/* Bookmark List */}
            <div className="flex-1 overflow-y-auto space-y-1 mb-3 max-h-[280px]">
              {/* Ungrouped bookmarks */}
              {ungrouped.map(renderBookmarkItem)}

              {/* Grouped bookmarks */}
              {grouped.map((g) => (
                <div key={g.name} className="mt-2">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-text-light-tertiary dark:text-text-dark-tertiary px-2 py-1">
                    {g.name}
                  </div>
                  {g.items.map(renderBookmarkItem)}
                </div>
              ))}
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="p-3 bg-surface-light dark:bg-surface-dark rounded-button border border-border-light dark:border-border-dark mb-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-light-primary dark:text-text-dark-primary">
                    {editId ? 'Edit Bookmark' : 'Add Bookmark'}
                  </span>
                  <button onClick={handleCancel} className="p-0.5">
                    <X className="w-3.5 h-3.5 text-text-light-secondary dark:text-text-dark-secondary" />
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-2.5 py-1.5 text-sm rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  autoFocus
                />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-2.5 py-1.5 text-sm rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && title.trim() && url.trim()) handleAdd();
                  }}
                />
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Group (optional)"
                  list="bookmark-groups"
                  className="w-full px-2.5 py-1.5 text-sm rounded-button bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                />
                <datalist id="bookmark-groups">
                  {groups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <button
                  onClick={handleAdd}
                  disabled={!title.trim() || !url.trim()}
                  className="w-full px-3 py-1.5 text-sm font-medium bg-accent-blue hover:bg-accent-blue-hover disabled:bg-text-light-tertiary dark:disabled:bg-text-dark-tertiary disabled:cursor-not-allowed text-white rounded-button transition-all duration-standard ease-smooth"
                >
                  {editId ? 'Update' : 'Add'}
                </button>
              </div>
            )}

            {/* Add Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mt-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth"
              >
                <Plus className="w-4 h-4" />
                Add Bookmark
              </button>
            )}
          </>
        )}
      </div>
    </BaseWidget>
  );
};
