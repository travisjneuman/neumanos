/**
 * Widget Manager Modal
 *
 * Allows users to enable/disable/reorder dashboard widgets with category organization
 */

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { useWidgetStore } from '../stores/useWidgetStore';
import { getAllWidgets, getWidget, type WidgetCategory } from '../widgets/Dashboard/WidgetRegistry';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from '../stores/useToastStore';

interface WidgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsPromptData {
  widgetId: string;
  widgetName: string;
}

const SortableItem: React.FC<{ id: string }> = ({ id }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const widget = getWidget(id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!widget) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 p-3 bg-surface-light-elevated dark:bg-surface-dark rounded-button cursor-move hover:bg-surface-light dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth"
    >
      <span className="text-2xl">{widget.icon}</span>
      <div className="flex-1">
        <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary">
          {widget.name}
        </h4>
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          {widget.description}
        </p>
      </div>
      <span className="text-text-light-secondary dark:text-text-dark-secondary">⋮⋮</span>
    </div>
  );
};

export const WidgetManager: React.FC<WidgetManagerProps> = ({ isOpen, onClose }) => {
  const { enabledWidgets, enableWidget, disableWidget, reorderWidgets, updateWidgetSettings } = useWidgetStore();
  const [activeTab, setActiveTab] = useState<'enabled' | 'available'>('enabled');
  const [settingsPrompt, setSettingsPrompt] = useState<SettingsPromptData | null>(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allWidgets = getAllWidgets();
  const availableWidgets = allWidgets.filter(w => !enabledWidgets.includes(w.id));

  // Filter available widgets by search and category
  const filteredAvailableWidgets = availableWidgets.filter(widget => {
    const matchesSearch = !searchQuery ||
      widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Category display names with descriptions
  const categoryNames: Record<WidgetCategory, string> = {
    core: '⭐ Core Features',
    productivity: '💼 Productivity',
    news: '📰 Information',
    finance: '💰 Finance',
    visual: '🎨 Media',
    dev: '🔧 Developer',
    fun: '🎮 Fun & Games',
    utility: '🛠️ Utilities',
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = enabledWidgets.indexOf(active.id as string);
    const newIndex = enabledWidgets.indexOf(over.id as string);

    const newOrder = [...enabledWidgets];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    reorderWidgets(newOrder);
  };

  const handleEnableWidget = (widgetId: string) => {
    const widget = getWidget(widgetId);
    if (!widget) return;

    // Check if widget requires settings (like GitHub username)
    if (widget.requiresAuth && widgetId === 'github') {
      setSettingsPrompt({ widgetId, widgetName: widget.name });
    } else {
      enableWidget(widgetId);
    }
  };

  const handleSaveSettings = () => {
    if (!settingsPrompt) return;

    if (settingsPrompt.widgetId === 'github') {
      if (!githubUsername.trim()) {
        toast.warning('Please enter at least one GitHub username');
        return;
      }

      // Support comma-separated usernames for multiple widgets
      const usernames = githubUsername.split(',').map(u => u.trim()).filter(u => u);

      if (usernames.length === 0) {
        toast.warning('Please enter valid GitHub username(s)');
        return;
      }

      // Enable multiple GitHub widgets if multiple usernames provided
      usernames.forEach((username, index) => {
        const widgetId = index === 0 ? 'github' : `github-${index}`;
        updateWidgetSettings(widgetId, { username });
        enableWidget(widgetId);
      });

      setSettingsPrompt(null);
      setGithubUsername('');
    }
  };

  const handleCancelSettings = () => {
    setSettingsPrompt(null);
    setGithubUsername('');
  };

  // Auto-focus search when tab changes to "available"
  useEffect(() => {
    if (activeTab === 'available' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeTab]);

  // Reset selected index when search query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, selectedCategory]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const maxIndex = filteredAvailableWidgets.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, maxIndex));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredAvailableWidgets[selectedIndex]) {
          handleEnableWidget(filteredAvailableWidgets[selectedIndex].id);
          setSearchQuery(''); // Clear search after adding
          setSelectedIndex(0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSearchQuery('');
        setSelectedIndex(0);
        searchInputRef.current?.focus();
        break;
    }
  };

  // Text highlighting helper
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent-yellow/30 dark:bg-accent-yellow/50 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard Widgets" maxWidth="2xl">
      <div className="w-full">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-border-light dark:border-border-dark">
          <button
            onClick={() => setActiveTab('enabled')}
            className={`px-4 py-2 font-medium transition-all duration-standard ease-smooth ${
              activeTab === 'enabled'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Active Widgets ({enabledWidgets.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 font-medium transition-all duration-standard ease-smooth ${
              activeTab === 'available'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Available ({availableWidgets.length})
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {activeTab === 'enabled' ? (
            <div className="space-y-4">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Drag to reorder widgets. Click to disable.
              </p>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={enabledWidgets} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {enabledWidgets.map((id) => {
                      const widget = getWidget(id);
                      if (!widget) return null;

                      return (
                        <div key={id} className="flex items-center gap-2">
                          <div className="flex-1">
                            <SortableItem id={id} />
                          </div>
                          <button
                            onClick={() => disableWidget(id)}
                            className="p-2 text-accent-red hover:bg-accent-red/10 dark:hover:bg-accent-red/20 rounded-button transition-all duration-standard ease-smooth"
                            title="Disable widget"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {enabledWidgets.length === 0 && (
                <div className="text-center py-12 text-text-light-secondary dark:text-text-dark-secondary">
                  No widgets enabled. Add some from the Available tab!
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search widgets... (↑↓ arrows, Enter to add, ESC to clear)"
                className="w-full px-4 py-2 rounded-button bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary placeholder-text-light-secondary dark:placeholder-text-dark-secondary focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-standard ease-smooth"
              />

              {/* Category Tabs */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-button text-sm font-medium transition-all duration-standard ease-smooth ${
                    selectedCategory === 'all'
                      ? 'bg-accent-blue text-white'
                      : 'bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
                  }`}
                >
                  All ({availableWidgets.length})
                </button>
                {Object.entries(categoryNames).map(([category, displayName]) => {
                  const count = availableWidgets.filter(w => w.category === category).length;
                  if (count === 0) return null;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category as WidgetCategory)}
                      className={`px-3 py-1.5 rounded-button text-sm font-medium transition-all duration-standard ease-smooth ${
                        selectedCategory === category
                          ? 'bg-accent-blue text-white'
                          : 'bg-surface-light-elevated dark:bg-surface-dark text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light dark:hover:bg-surface-dark-elevated'
                      }`}
                    >
                      {displayName.split(' ')[0]} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Widget Grid */}
              {availableWidgets.length === 0 ? (
                <div className="text-center py-12 text-text-light-secondary dark:text-text-dark-secondary">
                  All widgets are already enabled!
                </div>
              ) : filteredAvailableWidgets.length === 0 ? (
                <div className="text-center py-12 text-text-light-secondary dark:text-text-dark-secondary">
                  No widgets found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredAvailableWidgets.map((widget, index) => (
                    <button
                      key={widget.id}
                      onClick={() => handleEnableWidget(widget.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-button transition-all duration-standard ease-smooth text-center group border ${
                        index === selectedIndex
                          ? 'bg-accent-blue/10 ring-2 ring-accent-blue border-accent-blue/30 scale-[1.02]'
                          : 'bg-surface-light-elevated dark:bg-surface-dark border-transparent hover:bg-surface-light dark:hover:bg-surface-dark-elevated hover:border-border-light dark:hover:border-border-dark'
                      }`}
                    >
                      {/* Preview Icon */}
                      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-surface-light dark:bg-surface-dark-elevated text-3xl group-hover:scale-110 transition-transform duration-standard ease-smooth">
                        {widget.icon}
                      </div>
                      <div className="w-full">
                        <h4 className="font-medium text-sm text-text-light-primary dark:text-text-dark-primary truncate">
                          {highlightText(widget.name, searchQuery)}
                        </h4>
                        <p className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary line-clamp-2 mt-0.5">
                          {highlightText(widget.description, searchQuery)}
                        </p>
                      </div>
                      {/* Category badge */}
                      <span className="text-[9px] uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary px-2 py-0.5 rounded-full bg-surface-light dark:bg-surface-dark-elevated">
                        {widget.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent-blue text-white rounded-button hover:bg-accent-blue-hover transition-all duration-standard ease-smooth"
          >
            Done
          </button>
        </div>
      </div>

      {/* Settings Prompt Modal (for GitHub username, etc.) */}
      {settingsPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-card p-6 max-w-md w-full mx-4 border border-border-light dark:border-border-dark">
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
              Configure {settingsPrompt.widgetName}
            </h3>

            {settingsPrompt.widgetId === 'github' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="octocat, username2, username3"
                    className="w-full px-3 py-2 border rounded-button bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue focus:border-transparent transition-all duration-standard ease-smooth"
                    autoFocus
                  />
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
                    Enter GitHub username(s). Use commas to add multiple widgets (e.g., "username1, username2")
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelSettings}
                    className="px-4 py-2 border border-border-light dark:border-border-dark rounded-button hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth text-text-light-primary dark:text-text-dark-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white rounded-button transition-all duration-standard ease-smooth"
                  >
                    Save & Enable
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
