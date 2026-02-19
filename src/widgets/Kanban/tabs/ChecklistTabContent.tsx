import React, { useState } from 'react';
import type { ChecklistItem } from '../../../types';

interface ChecklistTabContentProps {
  checklist: ChecklistItem[] | undefined;
  onToggle: (itemId: string) => void;
  onUpdate: (itemId: string, updates: Partial<ChecklistItem>) => void;
  onDelete: (itemId: string) => void;
  onAdd: (text: string) => void;
}

/**
 * Checklist Tab Content
 * Displays checklist items with progress bar and add form.
 */
export const ChecklistTabContent: React.FC<ChecklistTabContentProps> = ({
  checklist,
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onAdd(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItemText.trim()) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const completedCount = checklist?.filter(item => item.completed).length ?? 0;
  const totalCount = checklist?.length ?? 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {checklist && checklist.length > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-text-light-primary dark:text-text-dark-primary">Progress</span>
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              {completedCount} of {totalCount}
            </span>
          </div>
          <div className="w-full bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-full h-2">
            <div
              className="bg-accent-blue h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklist && checklist.length > 0 ? (
          checklist
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div key={item.id} className="flex items-start gap-2 group">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => onToggle(item.id)}
                  className="mt-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => onUpdate(item.id, { text: e.target.value })}
                  className={`flex-1 px-2 py-1 text-sm bg-transparent border-none outline-none ${
                    item.completed ? 'line-through text-text-light-secondary dark:text-text-dark-secondary' : 'text-text-light-primary dark:text-text-dark-primary'
                  } focus:ring-1 focus:ring-accent-blue rounded`}
                />
                <button
                  onClick={() => onDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-accent-red hover:text-accent-red-hover transition-opacity px-2"
                  aria-label="Delete item"
                >
                  ✕
                </button>
              </div>
            ))
        ) : (
          <div className="text-center py-2 text-text-light-secondary dark:text-text-dark-secondary text-xs">
            ✓ No checklist items
          </div>
        )}
      </div>

      {/* Add New Item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add item..."
          className="flex-1 px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary focus:ring-2 focus:ring-accent-blue outline-none"
        />
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
};
