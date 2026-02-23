import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSpacedRepetitionStore } from '../../stores/useSpacedRepetitionStore';

interface FlashcardCreatorProps {
  onClose: () => void;
}

export function FlashcardCreator({ onClose }: FlashcardCreatorProps) {
  const decks = useSpacedRepetitionStore((s) => s.decks);
  const addCard = useSpacedRepetitionStore((s) => s.addCard);
  const addDeck = useSpacedRepetitionStore((s) => s.addDeck);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [selectedDeck, setSelectedDeck] = useState(decks[0]?.id ?? '');
  const [newDeckName, setNewDeckName] = useState('');
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [addedCount, setAddedCount] = useState(0);

  const handleAddSingle = () => {
    if (!front.trim() || !back.trim() || !selectedDeck) return;
    addCard(front.trim(), back.trim(), selectedDeck);
    setFront('');
    setBack('');
    setAddedCount((c) => c + 1);
  };

  const handleAddBulk = () => {
    if (!bulkText.trim() || !selectedDeck) return;
    // Format: each line is "front | back" or "front :: back"
    const lines = bulkText.split('\n').filter((l) => l.trim());
    let count = 0;
    for (const line of lines) {
      const separator = line.includes('::') ? '::' : '|';
      const parts = line.split(separator).map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        addCard(parts[0], parts[1], selectedDeck);
        count++;
      }
    }
    setBulkText('');
    setAddedCount((c) => c + count);
  };

  const handleCreateDeck = () => {
    if (!newDeckName.trim()) return;
    const id = addDeck(newDeckName.trim());
    setSelectedDeck(id);
    setNewDeckName('');
    setShowNewDeck(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
            Create Flashcards
          </h2>

          {/* Deck selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Deck
            </label>
            <div className="flex gap-2">
              <select
                value={selectedDeck}
                onChange={(e) => setSelectedDeck(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewDeck(!showNewDeck)}
                className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light-alt dark:hover:bg-surface-dark transition-colors"
              >
                <Plus className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            </div>
            {showNewDeck && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="New deck name..."
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
                />
                <button
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim()}
                  className="px-3 py-1.5 text-sm bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                !bulkMode
                  ? 'bg-accent-primary/10 text-accent-primary font-medium'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light-alt dark:hover:bg-surface-dark'
              }`}
            >
              Single Card
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                bulkMode
                  ? 'bg-accent-primary/10 text-accent-primary font-medium'
                  : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:bg-surface-light-alt dark:hover:bg-surface-dark'
              }`}
            >
              Bulk Import
            </button>
          </div>

          {bulkMode ? (
            <>
              <div className="mb-2">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Cards (one per line, separated by | or ::)
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"What is React? | A JavaScript UI library\nJSX stands for :: JavaScript XML"}
                  rows={8}
                  className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none text-sm font-mono"
                />
              </div>
              <button
                onClick={handleAddBulk}
                disabled={!bulkText.trim()}
                className="w-full py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
              >
                Import Cards
              </button>
            </>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Front (Question)
                </label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="What is the capital of France?"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
                  Back (Answer)
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Paris"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
                />
              </div>
              <button
                onClick={handleAddSingle}
                disabled={!front.trim() || !back.trim()}
                className="w-full py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </>
          )}

          {addedCount > 0 && (
            <p className="mt-3 text-sm text-status-success text-center">
              {addedCount} card{addedCount !== 1 ? 's' : ''} added
            </p>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
