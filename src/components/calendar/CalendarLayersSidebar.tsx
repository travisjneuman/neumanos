/**
 * CalendarLayersSidebar - Multi-calendar overlay panel
 *
 * Collapsible sidebar showing calendar categories with:
 * - Color dots and visibility toggles (checkboxes)
 * - "Add Calendar" button
 * - Inline color editing
 */

import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Check, X, Palette,
} from 'lucide-react';
import { useCalendarStore } from '../../stores/useCalendarStore';
import type { UserCalendar } from '../../types';

const PRESET_COLORS = [
  '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#6366f1',
];

export function CalendarLayersSidebar() {
  const { calendars, addCalendar, updateCalendar, deleteCalendar, toggleCalendarVisibility } = useCalendarStore();

  const [collapsed, setCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2563eb');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCalendar(newName.trim(), newColor);
    setNewName('');
    setNewColor('#2563eb');
    setShowAddForm(false);
  };

  const handleColorChange = (cal: UserCalendar, color: string) => {
    updateCalendar(cal.id, { color });
    setEditingId(null);
  };

  return (
    <div
      className={`flex-shrink-0 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark transition-all duration-standard ease-smooth overflow-hidden ${
        collapsed ? 'w-10' : 'w-56'
      }`}
    >
      {/* Toggle */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border-light dark:border-border-dark">
        {!collapsed && (
          <span className="text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">
            Calendars
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-2 space-y-1">
          {/* Calendar list */}
          {calendars.map((cal) => (
            <div
              key={cal.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
            >
              {/* Visibility checkbox */}
              <button
                onClick={() => toggleCalendarVisibility(cal.id)}
                className="flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: cal.color,
                  backgroundColor: cal.visible ? cal.color : 'transparent',
                }}
                title={cal.visible ? `Hide ${cal.name}` : `Show ${cal.name}`}
              >
                {cal.visible && <Check className="w-2.5 h-2.5 text-white" />}
              </button>

              {/* Name */}
              <span className={`flex-1 text-xs truncate ${
                cal.visible
                  ? 'text-text-light-primary dark:text-text-dark-primary'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary line-through'
              }`}>
                {cal.name}
              </span>

              {/* Color picker trigger */}
              {editingId === cal.id ? (
                <div className="flex flex-wrap gap-1 absolute right-0 top-full mt-1 z-30 p-2 bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-lg border border-border-light dark:border-border-dark">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleColorChange(cal, c)}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                        c === cal.color ? 'ring-2 ring-offset-1 ring-text-light-primary dark:ring-text-dark-primary' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button
                    onClick={() => setEditingId(null)}
                    className="w-5 h-5 rounded-full flex items-center justify-center bg-surface-light-elevated dark:bg-surface-dark"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(cal.id)}
                    className="p-0.5 rounded hover:bg-surface-light-alt dark:hover:bg-surface-dark text-text-light-tertiary dark:text-text-dark-tertiary"
                    title="Change color"
                  >
                    <Palette className="w-3 h-3" />
                  </button>

                  {/* Delete */}
                  {confirmDeleteId === cal.id ? (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => { deleteCalendar(cal.id); setConfirmDeleteId(null); }}
                        className="p-0.5 rounded bg-status-error/10 text-status-error"
                        title="Confirm delete"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-0.5 rounded text-text-light-tertiary dark:text-text-dark-tertiary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(cal.id)}
                      className="p-0.5 rounded hover:bg-status-error/10 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-status-error"
                      title="Delete calendar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add calendar form */}
          {showAddForm ? (
            <div className="mt-2 p-2 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-button border border-border-light dark:border-border-dark">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Calendar name"
                className="w-full px-2 py-1 text-xs bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-button focus:outline-none focus:ring-1 focus:ring-accent-primary text-text-light-primary dark:text-text-dark-primary mb-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') setShowAddForm(false);
                }}
              />
              <div className="flex flex-wrap gap-1 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                      c === newColor ? 'ring-2 ring-offset-1 ring-text-light-primary dark:ring-text-dark-primary' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex-1 px-2 py-1 text-xs font-medium text-white bg-accent-primary rounded-button hover:opacity-90 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewName(''); }}
                  className="px-2 py-1 text-xs text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-light-secondary dark:text-text-dark-secondary hover:text-accent-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated rounded-button transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Calendar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
