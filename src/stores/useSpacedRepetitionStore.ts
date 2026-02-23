import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { createSyncedStorage } from '../lib/syncedStorage';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  nextReviewDate: string; // ISO date
  interval: number; // Days until next review
  easeFactor: number; // SM-2 ease factor (>= 1.3)
  repetitions: number; // Number of successful reviews
  createdAt: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

/**
 * SM-2 Algorithm Implementation
 * quality: 0-5 (0-2 = fail, 3 = hard, 4 = good, 5 = easy)
 */
function sm2(
  card: Flashcard,
  quality: number
): { interval: number; easeFactor: number; repetitions: number } {
  let { interval, easeFactor, repetitions } = card;

  if (quality < 3) {
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  return { interval, easeFactor, repetitions };
}

interface SpacedRepetitionStore {
  cards: Flashcard[];
  decks: FlashcardDeck[];

  // Deck CRUD
  addDeck: (name: string, color?: string) => string;
  deleteDeck: (id: string) => void;

  // Card CRUD
  addCard: (front: string, back: string, deck: string) => string;
  addCards: (cards: Array<{ front: string; back: string; deck: string }>) => void;
  updateCard: (id: string, updates: Partial<Pick<Flashcard, 'front' | 'back' | 'deck'>>) => void;
  deleteCard: (id: string) => void;

  // Review
  reviewCard: (id: string, quality: number) => void;
  getDueCards: (deck?: string) => Flashcard[];
  getDueCount: (deck?: string) => number;

  // Queries
  getDecks: () => FlashcardDeck[];
  getCardsByDeck: (deck: string) => Flashcard[];
}

const DEFAULT_DECKS: FlashcardDeck[] = [
  { id: 'general', name: 'General', color: '#3b82f6', createdAt: new Date().toISOString() },
];

export const useSpacedRepetitionStore = create<SpacedRepetitionStore>()(
  persist(
    (set, get) => ({
      cards: [],
      decks: DEFAULT_DECKS,

      addDeck: (name, color = '#8b5cf6') => {
        const id = nanoid();
        set((s) => ({
          decks: [...s.decks, { id, name, color, createdAt: new Date().toISOString() }],
        }));
        return id;
      },

      deleteDeck: (id) => {
        set((s) => ({
          decks: s.decks.filter((d) => d.id !== id),
          cards: s.cards.filter((c) => c.deck !== id),
        }));
      },

      addCard: (front, back, deck) => {
        const id = nanoid();
        const card: Flashcard = {
          id,
          front,
          back,
          deck,
          nextReviewDate: new Date().toISOString(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ cards: [...s.cards, card] }));
        return id;
      },

      addCards: (newCards) => {
        const cards = newCards.map((c) => ({
          id: nanoid(),
          front: c.front,
          back: c.back,
          deck: c.deck,
          nextReviewDate: new Date().toISOString(),
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          createdAt: new Date().toISOString(),
        }));
        set((s) => ({ cards: [...s.cards, ...cards] }));
      },

      updateCard: (id, updates) => {
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteCard: (id) => {
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
      },

      reviewCard: (id, quality) => {
        set((s) => ({
          cards: s.cards.map((c) => {
            if (c.id !== id) return c;
            const result = sm2(c, quality);
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + result.interval);
            return {
              ...c,
              interval: result.interval,
              easeFactor: result.easeFactor,
              repetitions: result.repetitions,
              nextReviewDate: nextDate.toISOString(),
            };
          }),
        }));
      },

      getDueCards: (deck) => {
        const now = new Date().toISOString();
        return get().cards.filter(
          (c) => c.nextReviewDate <= now && (!deck || c.deck === deck)
        );
      },

      getDueCount: (deck) => {
        const now = new Date().toISOString();
        return get().cards.filter(
          (c) => c.nextReviewDate <= now && (!deck || c.deck === deck)
        ).length;
      },

      getDecks: () => get().decks,

      getCardsByDeck: (deck) => get().cards.filter((c) => c.deck === deck),
    }),
    {
      name: 'spaced-repetition-store',
      storage: createJSONStorage(() => createSyncedStorage()),
      partialize: (state) => ({
        cards: state.cards,
        decks: state.decks,
      }),
    }
  )
);
