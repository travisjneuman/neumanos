import { TimeEntryReportCalendar } from './TimeEntryReportCalendar';

/**
 * TimeEntrySummary Component
 * Wrapper for the TimeEntryReportCalendar component.
 * Displays time tracking data with calendar views (Month/Week/Day/List).
 */

interface TimeEntrySummaryProps {
  onAddEntry?: (dateKey: string) => void;
}

export function TimeEntrySummary({ onAddEntry }: TimeEntrySummaryProps) {
  return <TimeEntryReportCalendar onAddEntry={onAddEntry} />;
}
