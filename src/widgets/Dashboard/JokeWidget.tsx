/**
 * Developer Jokes Widget
 *
 * Displays programming jokes from JokeAPI
 * https://v2.jokeapi.dev/joke/Programming
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidget } from './BaseWidget';
import { useWidgetStore } from '../../stores/useWidgetStore';

interface Joke {
  type: 'single' | 'twopart';
  joke?: string; // For single type
  setup?: string; // For twopart type
  delivery?: string; // For twopart type
  category: string;
}

export const JokeWidget: React.FC = () => {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = useWidgetStore((state) => state.getWidgetSettings('joke'));

  const fetchJoke = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://v2.jokeapi.dev/joke/Programming?safe-mode'
      );
      if (!response.ok) throw new Error('Failed to fetch joke');

      const data = await response.json();
      setJoke(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load joke');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchJoke();
  }, [fetchJoke]);

  // Auto-refresh
  useEffect(() => {
    if (!settings.refreshRate) return;

    const interval = setInterval(() => {
      fetchJoke();
    }, settings.refreshRate * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.refreshRate, fetchJoke]);

  return (
    <BaseWidget
      title="Developer Jokes"
      icon="😄"
      loading={loading}
      error={error}
      onRefresh={fetchJoke}
    >
      {joke && (
        <div className="flex flex-col justify-center h-full text-center">
          {joke.type === 'single' ? (
            <p className="text-base text-text-light-primary dark:text-text-dark-primary leading-relaxed">
              {joke.joke}
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-base text-text-light-primary dark:text-text-dark-primary leading-relaxed font-medium">
                {joke.setup}
              </p>
              <p className="text-base text-accent-blue leading-relaxed italic">
                {joke.delivery}
              </p>
            </div>
          )}

          <div className="mt-4 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Category: {joke.category}
          </div>
        </div>
      )}
    </BaseWidget>
  );
};
