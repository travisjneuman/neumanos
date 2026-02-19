/**
 * Word of the Day Widget
 *
 * Shows word definition from Free Dictionary API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BaseWidget } from './BaseWidget';

interface WordData {
  word: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
  phonetic?: string;
}

const WORD_LIST = [
  'serendipity', 'ephemeral', 'eloquent', 'resilient', 'paradigm',
  'innovative', 'ubiquitous', 'pragmatic', 'synergy', 'catalyst',
  'renaissance', 'quintessential', 'ethereal', 'benevolent', 'meticulous'
];

export const WordOfDayWidget: React.FC = () => {
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWord = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Pick a random word from list
      const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${randomWord}`);
      if (!response.ok) throw new Error('Failed to fetch word');

      const data = await response.json();
      setWordData(data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load word');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  return (
    <BaseWidget
      title="Word of the Day"
      icon="📖"
      loading={loading}
      error={error}
      onRefresh={fetchWord}
    >
      {wordData && (
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl font-bold text-accent-primary mb-1">{wordData.word}</h3>
            {wordData.phonetic && (
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
                {wordData.phonetic}
              </p>
            )}
          </div>

          <div className="space-y-2">
            {wordData.meanings.slice(0, 2).map((meaning, idx) => (
              <div key={idx}>
                <p className="text-xs font-semibold text-accent-secondary uppercase mb-1">
                  {meaning.partOfSpeech}
                </p>
                <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
                  {meaning.definitions[0].definition}
                </p>
                {meaning.definitions[0].example && (
                  <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary italic mt-1">
                    "{meaning.definitions[0].example}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </BaseWidget>
  );
};
