/**
 * Custom Widget Builder
 *
 * Visual builder modal for creating and editing custom dashboard widgets.
 * Walks through data source selection, configuration, layout choice, and preview.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { useWidgetStore, type CustomWidgetConfig, type DataSourceType, type DataSourceConfig, type LayoutType, type LayoutConfig } from '../stores/useWidgetStore';
import { toast } from '../stores/useToastStore';

interface CustomWidgetBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  editingWidget?: CustomWidgetConfig;
}

const DATA_SOURCE_OPTIONS: { type: DataSourceType; label: string; description: string; icon: string }[] = [
  { type: 'json-api', label: 'JSON API', description: 'Fetch data from a REST API endpoint', icon: '{ }' },
  { type: 'rss', label: 'RSS Feed', description: 'Display items from an RSS/Atom feed', icon: 'RSS' },
  { type: 'markdown', label: 'Markdown', description: 'Static markdown content', icon: 'Md' },
  { type: 'store-query', label: 'App Data', description: 'Query notes, tasks, events, or time entries', icon: 'DB' },
];

const LAYOUT_OPTIONS: { type: LayoutType; label: string; description: string; icon: string }[] = [
  { type: 'number', label: 'Big Number', description: 'Display a single prominent value', icon: '#' },
  { type: 'list', label: 'List', description: 'Show items as a scrollable list', icon: '=' },
  { type: 'chart', label: 'Chart', description: 'Visualize numeric data as a chart', icon: '~' },
  { type: 'markdown', label: 'Rich Text', description: 'Render markdown content', icon: 'T' },
];

const EMOJI_SUGGESTIONS = ['📊', '📈', '📉', '📋', '📌', '🔔', '🌐', '⚡', '🎯', '📦', '🔧', '📡', '💡', '🏷️', '📐', '🧩'];

const DEFAULT_DATA_SOURCE: DataSourceConfig = { type: 'json-api', url: '' };
const DEFAULT_LAYOUT: LayoutConfig = { type: 'list' };

export const CustomWidgetBuilder: React.FC<CustomWidgetBuilderProps> = ({ isOpen, onClose, editingWidget }) => {
  const createCustomWidget = useWidgetStore((s) => s.createCustomWidget);
  const updateCustomWidget = useWidgetStore((s) => s.updateCustomWidget);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📊');
  const [dataSource, setDataSource] = useState<DataSourceConfig>(DEFAULT_DATA_SOURCE);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [refreshInterval, setRefreshInterval] = useState(15);

  // Preview state
  const [previewData, setPreviewData] = useState<unknown>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Populate fields when editing
  useEffect(() => {
    if (editingWidget) {
      setName(editingWidget.name);
      setDescription(editingWidget.description);
      setIcon(editingWidget.icon);
      setDataSource(editingWidget.dataSource);
      setLayout(editingWidget.layout);
      setRefreshInterval(editingWidget.refreshIntervalMinutes);
    } else {
      setName('');
      setDescription('');
      setIcon('📊');
      setDataSource(DEFAULT_DATA_SOURCE);
      setLayout(DEFAULT_LAYOUT);
      setRefreshInterval(15);
      setPreviewData(null);
      setPreviewError(null);
    }
  }, [editingWidget, isOpen]);

  const handlePreview = useCallback(async () => {
    if (dataSource.type === 'markdown') {
      setPreviewData(dataSource.markdown || '');
      return;
    }
    if (dataSource.type === 'store-query') {
      setPreviewData('Store queries render live data from the app.');
      return;
    }
    if (!dataSource.url) {
      setPreviewError('Enter a URL first');
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(dataSource.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (dataSource.type === 'rss') {
        const text = await response.text();
        setPreviewData(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      } else {
        const json = await response.json();
        setPreviewData(json);
      }
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setPreviewLoading(false);
    }
  }, [dataSource]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Widget name is required');
      return;
    }

    const config = {
      name: name.trim(),
      description: description.trim(),
      icon,
      dataSource,
      layout,
      refreshIntervalMinutes: refreshInterval,
    };

    if (editingWidget) {
      updateCustomWidget(editingWidget.id, config);
      toast.success(`Widget "${name}" updated`);
    } else {
      createCustomWidget(config);
      toast.success(`Widget "${name}" created and added to dashboard`);
    }
    onClose();
  };

  const isValid = name.trim().length > 0 && (
    dataSource.type === 'markdown' ||
    dataSource.type === 'store-query' ||
    (dataSource.url && dataSource.url.trim().length > 0)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingWidget ? 'Edit Custom Widget' : 'Create Custom Widget'}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Section 1: Data Source */}
        <section>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 uppercase tracking-wider">
            1. Data Source
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DATA_SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setDataSource({ ...DEFAULT_DATA_SOURCE, type: opt.type })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  dataSource.type === opt.type
                    ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                    : 'border-border-light dark:border-border-dark hover:border-accent-primary/50 text-text-light-secondary dark:text-text-dark-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold bg-surface-light-elevated dark:bg-surface-dark-elevated px-1.5 py-0.5 rounded">
                    {opt.icon}
                  </span>
                  <span className="font-medium text-sm">{opt.label}</span>
                </div>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{opt.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Section 2: Configure Data Source */}
        <section>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 uppercase tracking-wider">
            2. Configure Source
          </h3>

          {(dataSource.type === 'json-api' || dataSource.type === 'rss') && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={dataSource.url || ''}
                  onChange={(e) => setDataSource({ ...dataSource, url: e.target.value })}
                  placeholder={dataSource.type === 'rss' ? 'https://example.com/feed.xml' : 'https://api.example.com/data'}
                  className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
              {dataSource.type === 'json-api' && (
                <div>
                  <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    JSON Path (optional)
                  </label>
                  <input
                    type="text"
                    value={dataSource.jsonPath || ''}
                    onChange={(e) => setDataSource({ ...dataSource, jsonPath: e.target.value })}
                    placeholder="$.data.items"
                    className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                  <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
                    Extract nested data. Example: $.data.results
                  </p>
                </div>
              )}
              <button
                onClick={handlePreview}
                disabled={!dataSource.url || previewLoading}
                className="px-3 py-1.5 text-sm font-medium bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 disabled:opacity-50 transition-colors"
              >
                {previewLoading ? 'Fetching...' : 'Test Connection'}
              </button>
            </div>
          )}

          {dataSource.type === 'markdown' && (
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Markdown Content
              </label>
              <textarea
                value={dataSource.markdown || ''}
                onChange={(e) => setDataSource({ ...dataSource, markdown: e.target.value })}
                placeholder="# My Widget\n\n- Item one\n- Item two"
                rows={6}
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary font-mono resize-y"
              />
            </div>
          )}

          {dataSource.type === 'store-query' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Data Store
                </label>
                <select
                  value={dataSource.storeQuery?.store || 'notes'}
                  onChange={(e) =>
                    setDataSource({
                      ...dataSource,
                      storeQuery: {
                        ...dataSource.storeQuery,
                        store: e.target.value as 'notes' | 'tasks' | 'events' | 'time-entries',
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="notes">Notes</option>
                  <option value="tasks">Tasks</option>
                  <option value="events">Events</option>
                  <option value="time-entries">Time Entries</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Limit
                </label>
                <input
                  type="number"
                  value={dataSource.storeQuery?.limit || 10}
                  onChange={(e) =>
                    setDataSource({
                      ...dataSource,
                      storeQuery: {
                        ...dataSource.storeQuery,
                        store: dataSource.storeQuery?.store || 'notes',
                        limit: parseInt(e.target.value, 10) || 10,
                      },
                    })
                  }
                  min={1}
                  max={50}
                  className="w-24 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            </div>
          )}

          {/* Preview area */}
          {previewError && (
            <div className="mt-3 p-3 bg-status-error/10 border border-status-error/30 rounded-lg">
              <p className="text-sm text-status-error">{previewError}</p>
            </div>
          )}
          {previewData != null && !previewError && (
            <div className="mt-3 p-3 bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg border border-border-light dark:border-border-dark max-h-32 overflow-auto">
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mb-1 font-semibold">Preview:</p>
              <pre className="text-xs text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap break-all font-mono">
                {typeof previewData === 'string' ? previewData : JSON.stringify(previewData, null, 2).slice(0, 500)}
              </pre>
            </div>
          )}
        </section>

        {/* Section 3: Layout */}
        <section>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 uppercase tracking-wider">
            3. Layout
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setLayout({ ...layout, type: opt.type })}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  layout.type === opt.type
                    ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                    : 'border-border-light dark:border-border-dark hover:border-accent-primary/50 text-text-light-secondary dark:text-text-dark-secondary'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-mono font-bold">{opt.icon}</span>
                  <span className="font-medium text-sm">{opt.label}</span>
                </div>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">{opt.description}</p>
              </button>
            ))}
          </div>

          {/* Layout-specific options */}
          {(layout.type === 'list' || layout.type === 'chart') && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Max Items
              </label>
              <input
                type="number"
                value={layout.maxItems || 10}
                onChange={(e) => setLayout({ ...layout, maxItems: parseInt(e.target.value, 10) || 10 })}
                min={1}
                max={50}
                className="w-24 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          )}

          {layout.type === 'chart' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Chart Type
              </label>
              <div className="flex gap-2">
                {(['bar', 'line', 'pie'] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setLayout({ ...layout, chartType: ct })}
                    className={`px-3 py-1.5 text-sm rounded-lg border capitalize transition-colors ${
                      (layout.chartType || 'bar') === ct
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Section 4: Widget Info */}
        <section>
          <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 uppercase tracking-wider">
            4. Widget Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Widget"
                maxLength={50}
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this widget shows"
                maxLength={100}
                className="w-full px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Icon
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setIcon(emoji)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      icon === emoji
                        ? 'bg-accent-primary/20 ring-2 ring-accent-primary'
                        : 'bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                Refresh Interval (minutes)
              </label>
              <input
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10) || 0)}
                min={0}
                max={1440}
                className="w-24 px-3 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">0 = manual refresh only</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {editingWidget ? 'Save Changes' : 'Create Widget'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
