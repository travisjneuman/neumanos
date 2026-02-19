/**
 * Random Facts Widget
 *
 * Displays interesting random facts
 * https://uselessfacts.jsph.pl/random.json
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidget } from './BaseWidget';
import { useWidgetStore } from '../../stores/useWidgetStore';

interface Fact {
  text: string;
  source: string;
  source_url: string;
}

export const FactsWidget: React.FC = () => {
  const [fact, setFact] = useState<Fact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useWidgetStore((state) => state.getWidgetSettings('facts'));

  const fetchFact = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
      if (!response.ok) throw new Error('Failed to fetch fact');

      const data = await response.json();
      setFact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fact');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFact();
  }, [fetchFact]);

  // Auto-refresh
  useEffect(() => {
    if (!settings.refreshRate) return;

    const interval = setInterval(() => {
      fetchFact();
    }, settings.refreshRate * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.refreshRate, fetchFact]);

  return (
    <BaseWidget
      title="Random Facts"
      icon="🧠"
      loading={loading}
      error={error}
      onRefresh={fetchFact}
    >
      {fact && (
        <div className="flex flex-col justify-between h-full">
          <p className="text-base text-text-light-primary dark:text-text-dark-primary leading-relaxed mb-4">
            {fact.text}
          </p>

          {fact.source && (
            <a
              href={fact.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-blue hover:underline"
            >
              Source: {fact.source}
            </a>
          )}
        </div>
      )}
    </BaseWidget>
  );
};
