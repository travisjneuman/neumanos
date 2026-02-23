import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Brain } from 'lucide-react';
import { useSpacedRepetitionStore } from '../../stores/useSpacedRepetitionStore';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FlashcardReviewProps {
  deck?: string;
  onClose: () => void;
}

const QUALITY_LABELS = [
  { quality: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600' },
  { quality: 3, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600' },
  { quality: 4, label: 'Good', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { quality: 5, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600' },
];

export function FlashcardReview({ deck, onClose }: FlashcardReviewProps) {
  const dueCards = useSpacedRepetitionStore((s) => s.getDueCards(deck));
  const reviewCard = useSpacedRepetitionStore((s) => s.reviewCard);
  const reducedMotion = useReducedMotion();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const cards = useMemo(() => [...dueCards], [dueCards]);
  const card = cards[currentIndex];
  const remaining = cards.length - reviewed;

  const handleRate = useCallback(
    (quality: number) => {
      if (!card) return;
      reviewCard(card.id, quality);
      setFlipped(false);
      setReviewed((r) => r + 1);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    },
    [card, reviewCard, currentIndex, cards.length]
  );

  if (cards.length === 0 || remaining <= 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md mx-4 p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-accent-primary" />
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
            {reviewed > 0 ? 'Session Complete!' : 'No Cards Due'}
          </h2>
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary mb-6">
            {reviewed > 0
              ? `You reviewed ${reviewed} card${reviewed !== 1 ? 's' : ''}. Great work!`
              : 'All caught up. Check back later for new reviews.'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              {reviewed + 1} / {cards.length}
            </span>
            <span className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              {remaining} remaining
            </span>
          </div>
          <div className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-accent-primary rounded-full transition-all"
              style={{ width: `${((reviewed + 1) / cards.length) * 100}%` }}
            />
          </div>

          {/* Card */}
          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[200px] rounded-xl border-2 border-border-light dark:border-border-dark p-6 flex items-center justify-center cursor-pointer hover:border-accent-primary/30 transition-all"
            style={
              !reducedMotion
                ? {
                    transform: flipped ? 'rotateY(0deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.3s',
                  }
                : undefined
            }
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary mb-3">
                {flipped ? 'Answer' : 'Question'}
              </p>
              <p className="text-lg text-text-light-primary dark:text-text-dark-primary whitespace-pre-wrap">
                {flipped ? card.back : card.front}
              </p>
              {!flipped && (
                <p className="mt-4 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  Click to reveal answer
                </p>
              )}
            </div>
          </button>

          {/* Rating buttons (shown when flipped) */}
          {flipped && (
            <div className="flex gap-2 mt-4">
              {QUALITY_LABELS.map(({ quality, label, color }) => (
                <button
                  key={quality}
                  onClick={() => handleRate(quality)}
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Navigation */}
          {!flipped && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex(Math.max(0, currentIndex - 1));
                }}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg hover:bg-surface-light-alt dark:hover:bg-surface-dark disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
              <button
                onClick={() => setFlipped(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Flip
              </button>
              <button
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1));
                }}
                disabled={currentIndex >= cards.length - 1}
                className="p-2 rounded-lg hover:bg-surface-light-alt dark:hover:bg-surface-dark disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
          >
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}
