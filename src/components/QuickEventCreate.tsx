/**
 * QuickEventCreate Component
 * Inline event creation form for time slot clicks in week/day views.
 * Shows a compact input with title field. Enter saves, Escape cancels.
 */

import { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '../stores/useCalendarStore';

interface QuickEventCreateProps {
  dateKey: string;
  startTime: string; // "HH:MM" format
  /** Optional explicit end time. If omitted, defaults to 1 hour after start. */
  endTime?: string; // "HH:MM" format
  onClose: () => void;
  /** Optional: position style for absolute positioning within a time grid */
  style?: React.CSSProperties;
}

export function QuickEventCreate({ dateKey, startTime, endTime: endTimeProp, onClose, style }: QuickEventCreateProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addEvent } = useCalendarStore();

  useEffect(() => {
    // Auto-focus the input
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      onClose();
      return;
    }

    // Use explicit end time or default to 1 hour after start
    let endTime: string;
    if (endTimeProp) {
      endTime = endTimeProp;
    } else {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endHour = Math.min(hours + 1, 23);
      endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    addEvent(dateKey, trimmed, undefined, {
      isAllDay: false,
      startTime,
      endTime,
    });

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Format display time
  const [h, m] = startTime.split(':').map(Number);
  const displayTime = h === 0 ? '12:00 AM'
    : h < 12 ? `${h}:${m.toString().padStart(2, '0')} AM`
    : h === 12 ? `12:${m.toString().padStart(2, '0')} PM`
    : `${h - 12}:${m.toString().padStart(2, '0')} PM`;

  return (
    <div
      className="absolute left-1 right-1 z-30 bg-accent-primary rounded px-2 py-1 shadow-lg"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-[10px] text-white/80 mb-0.5">{displayTime}</div>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder="New event title..."
        className="w-full bg-transparent text-white text-xs font-medium placeholder-white/60 outline-none border-none"
      />
    </div>
  );
}
