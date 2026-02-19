import { useState, useEffect } from 'react';

/**
 * useKeyboardNavigation Hook
 *
 * Handles keyboard navigation for list-based UI components.
 *
 * Features:
 * - ↑↓ Arrow key navigation
 * - Wrap around at list boundaries
 * - Enter to select current item
 * - Escape to cancel/close
 *
 * @param itemCount - Number of items in the list
 * @param onSelect - Callback when Enter is pressed
 * @param onCancel - Callback when Escape is pressed
 * @param enabled - Whether keyboard navigation is active (default: true)
 */
export function useKeyboardNavigation(
  itemCount: number,
  onSelect: (index: number) => void,
  onCancel: () => void,
  enabled: boolean = true
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when item count changes
  useEffect(() => {
    if (selectedIndex >= itemCount) {
      setSelectedIndex(Math.max(0, itemCount - 1));
    }
  }, [itemCount, selectedIndex]);

  useEffect(() => {
    if (!enabled || itemCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;

        case 'Enter':
          e.preventDefault();
          onSelect(selectedIndex);
          break;

        case 'Escape':
          e.preventDefault();
          onCancel();
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, itemCount, onSelect, onCancel, enabled]);

  return { selectedIndex, setSelectedIndex };
}
