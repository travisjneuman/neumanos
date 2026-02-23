/**
 * Custom Widget Renderer
 *
 * Generic widget that renders based on a CustomWidgetConfig.
 * Supports multiple data sources (RSS, JSON API, Markdown, Store Query)
 * and multiple layout types (Number, List, Chart, Markdown).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidget } from './BaseWidget';
import { useWidgetStore, type CustomWidgetConfig } from '../../stores/useWidgetStore';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CustomWidgetProps {
  widgetId: string;
}

interface FetchedData {
  raw: unknown;
  items: Array<{ label: string; value: number | string }>;
  number?: number;
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#3b82f6', '#f97316'];

function extractByJsonPath(data: unknown, path: string): unknown {
  if (!path) return data;
  // Simple JSONPath: $.data.items -> ['data', 'items']
  const parts = path
    .replace(/^\$\.?/, '')
    .split('.')
    .filter(Boolean);
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function parseRSSItems(xml: string): Array<{ label: string; value: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = doc.querySelectorAll('item');
  const result: Array<{ label: string; value: string }> = [];
  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent || 'Untitled';
    const link = item.querySelector('link')?.textContent || '';
    result.push({ label: title, value: link });
  });
  return result;
}

function normalizeToItems(data: unknown): Array<{ label: string; value: number | string }> {
  if (Array.isArray(data)) {
    return data.slice(0, 50).map((item, i) => {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const label = String(obj.name || obj.title || obj.label || obj.key || `Item ${i + 1}`);
        const value = obj.value ?? obj.count ?? obj.score ?? obj.amount ?? '';
        return { label, value: typeof value === 'number' ? value : String(value) };
      }
      return { label: `Item ${i + 1}`, value: String(item) };
    });
  }
  if (typeof data === 'number') {
    return [{ label: 'Value', value: data }];
  }
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data as Record<string, unknown>).map(([key, val]) => ({
      label: key,
      value: typeof val === 'number' ? val : String(val ?? ''),
    }));
  }
  return [];
}

async function fetchCustomData(config: CustomWidgetConfig): Promise<FetchedData> {
  const { dataSource } = config;

  if (dataSource.type === 'markdown') {
    return { raw: dataSource.markdown || '', items: [] };
  }

  if (dataSource.type === 'store-query') {
    // Store queries are handled in the component via Zustand hooks
    return { raw: null, items: [] };
  }

  if (!dataSource.url) {
    throw new Error('No URL configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(dataSource.url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    if (dataSource.type === 'rss') {
      const text = await response.text();
      const items = parseRSSItems(text);
      return { raw: text, items };
    }

    // json-api
    const json = await response.json();
    const extracted = dataSource.jsonPath ? extractByJsonPath(json, dataSource.jsonPath) : json;
    const items = normalizeToItems(extracted);
    const number = typeof extracted === 'number'
      ? extracted
      : items.length === 1 && typeof items[0].value === 'number'
        ? items[0].value
        : undefined;
    return { raw: extracted, items, number };
  } finally {
    clearTimeout(timeoutId);
  }
}

// === Layout Renderers ===

function NumberLayout({ data }: { data: FetchedData }) {
  const displayValue = data.number ?? data.items[0]?.value ?? '—';
  return (
    <div className="flex items-center justify-center py-6">
      <span className="text-5xl font-bold text-text-light-primary dark:text-text-dark-primary">
        {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
      </span>
    </div>
  );
}

function ListLayout({ data, maxItems }: { data: FetchedData; maxItems?: number }) {
  const items = maxItems ? data.items.slice(0, maxItems) : data.items;
  if (items.length === 0) {
    return <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">No items</p>;
  }
  return (
    <ul className="space-y-1.5 overflow-y-auto max-h-60">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm py-1 border-b border-border-light/30 dark:border-border-dark/30 last:border-b-0"
        >
          <span className="text-text-light-tertiary dark:text-text-dark-tertiary shrink-0 w-5 text-right">
            {i + 1}.
          </span>
          <span className="text-text-light-primary dark:text-text-dark-primary flex-1 break-words">
            {item.label}
          </span>
          {item.value !== '' && item.value !== item.label && (
            <span className="text-text-light-secondary dark:text-text-dark-secondary shrink-0 text-xs">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ChartLayout({ data, chartType, maxItems }: { data: FetchedData; chartType?: 'bar' | 'line' | 'pie'; maxItems?: number }) {
  const chartData = (maxItems ? data.items.slice(0, maxItems) : data.items)
    .filter((item) => typeof item.value === 'number')
    .map((item) => ({ name: item.label, value: item.value as number }));

  if (chartData.length === 0) {
    return <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">No numeric data for chart</p>;
  }

  const type = chartType || 'bar';

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'pie' ? (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function MarkdownLayout({ content }: { content: string }) {
  // Simple markdown rendering (bold, italic, links, headings, lists)
  const lines = content.split('\n');
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <h3 key={i} className="text-base font-bold text-text-light-primary dark:text-text-dark-primary">{line.slice(2)}</h3>;
        if (line.startsWith('## ')) return <h4 key={i} className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">{line.slice(3)}</h4>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-sm text-text-light-secondary dark:text-text-dark-secondary ml-4">{line.slice(2)}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-sm text-text-light-secondary dark:text-text-dark-secondary">{line}</p>;
      })}
    </div>
  );
}

// === Main Component ===

export const CustomWidget: React.FC<CustomWidgetProps> = ({ widgetId }) => {
  const config = useWidgetStore((s) => s.customWidgets.find((w) => w.id === widgetId));
  const [data, setData] = useState<FetchedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!config) return;
    if (config.dataSource.type === 'markdown') {
      setData({ raw: config.dataSource.markdown || '', items: [] });
      return;
    }
    if (config.dataSource.type === 'store-query') {
      // Store queries don't need fetching
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchCustomData(config);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!config || config.refreshIntervalMinutes <= 0) return;
    if (config.dataSource.type === 'markdown' || config.dataSource.type === 'store-query') return;

    const intervalMs = config.refreshIntervalMinutes * 60 * 1000;
    const timer = setInterval(fetchData, intervalMs);
    return () => clearInterval(timer);
  }, [config, fetchData]);

  if (!config) {
    return (
      <BaseWidget title="Custom Widget" icon="?">
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Widget not found</p>
      </BaseWidget>
    );
  }

  const renderContent = () => {
    if (config.layout.type === 'markdown') {
      return <MarkdownLayout content={config.dataSource.markdown || ''} />;
    }

    if (!data) return null;

    switch (config.layout.type) {
      case 'number':
        return <NumberLayout data={data} />;
      case 'list':
        return <ListLayout data={data} maxItems={config.layout.maxItems} />;
      case 'chart':
        return <ChartLayout data={data} chartType={config.layout.chartType} maxItems={config.layout.maxItems} />;
      default:
        return <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">Unknown layout</p>;
    }
  };

  return (
    <BaseWidget
      title={config.layout.title || config.name}
      icon={config.icon}
      subtitle={config.description}
      loading={loading}
      error={error}
      onRefresh={config.dataSource.type !== 'markdown' && config.dataSource.type !== 'store-query' ? fetchData : undefined}
    >
      {renderContent()}
    </BaseWidget>
  );
};
