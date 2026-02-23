import { useState } from 'react';
import { Brain, Plus, Play } from 'lucide-react';
import { useSpacedRepetitionStore } from '../../stores/useSpacedRepetitionStore';
import { FlashcardReview } from '../../components/habits/FlashcardReview';
import { FlashcardCreator } from '../../components/habits/FlashcardCreator';
import type { WidgetComponentProps } from './WidgetRegistry';

export function FlashcardWidget(_props: WidgetComponentProps) {
  const cards = useSpacedRepetitionStore((s) => s.cards);
  const decks = useSpacedRepetitionStore((s) => s.decks);
  const getDueCount = useSpacedRepetitionStore((s) => s.getDueCount);

  const [showReview, setShowReview] = useState(false);
  const [showCreator, setShowCreator] = useState(false);

  const totalDue = getDueCount();
  const totalCards = cards.length;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent-primary" />
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
              Flashcards
            </span>
          </div>
          <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
            {totalCards} card{totalCards !== 1 ? 's' : ''}
          </span>
        </div>

        {totalCards === 0 ? (
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center py-4">
            No flashcards yet. Create some to get started.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-light-alt dark:bg-surface-dark">
              <div>
                <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                  {totalDue}
                </div>
                <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  cards due for review
                </div>
              </div>
              {totalDue > 0 && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-sm hover:bg-accent-primary/90 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Review
                </button>
              )}
            </div>

            {/* Deck summary */}
            <div className="space-y-1">
              {decks.map((deck) => {
                const deckDue = getDueCount(deck.id);
                const deckTotal = cards.filter((c) => c.deck === deck.id).length;
                if (deckTotal === 0) return null;
                return (
                  <div
                    key={deck.id}
                    className="flex items-center justify-between text-sm px-2 py-1"
                  >
                    <span className="text-text-light-secondary dark:text-text-dark-secondary">
                      {deck.name}
                    </span>
                    <span className="text-text-light-tertiary dark:text-text-dark-tertiary">
                      {deckDue > 0 && (
                        <span className="text-accent-primary font-medium mr-1">{deckDue} due</span>
                      )}
                      / {deckTotal}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <button
          onClick={() => setShowCreator(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cards
        </button>
      </div>

      {showReview && <FlashcardReview onClose={() => setShowReview(false)} />}
      {showCreator && <FlashcardCreator onClose={() => setShowCreator(false)} />}
    </>
  );
}
