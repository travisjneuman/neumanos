import { useState, useMemo } from 'react';
import { Copy, Check, Settings2 } from 'lucide-react';
import { useCalendarStore } from '../stores/useCalendarStore';
import { PageContent } from '../components/PageContent';
import { PageHeader } from '../components/PageHeader';

interface AvailabilitySettings {
  workingHoursStart: number; // 0-23
  workingHoursEnd: number;   // 0-23
  slotDuration: 30 | 60;    // minutes
}

interface TimeSlot {
  start: string; // "HH:MM"
  end: string;
  isFree: boolean;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatHour(hour: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}${ampm}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function Availability() {
  const events = useCalendarStore((s) => s.events);
  const [settings, setSettings] = useState<AvailabilitySettings>({
    workingHoursStart: 9,
    workingHoursEnd: 17,
    slotDuration: 60,
  });
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Compute next 7 days starting from today
  const next7Days = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  // Compute free/busy slots for each day
  const dailySlots = useMemo(() => {
    return next7Days.map((day) => {
      const dateKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
      const dayEvents = events[dateKey] || [];

      // Build busy intervals from events
      const busyIntervals: Array<{ start: number; end: number }> = [];
      dayEvents.forEach((event) => {
        if (event.isAllDay) {
          // All-day events block the whole working day
          busyIntervals.push({
            start: settings.workingHoursStart * 60,
            end: settings.workingHoursEnd * 60,
          });
        } else if (event.startTime && event.endTime) {
          busyIntervals.push({
            start: timeToMinutes(event.startTime),
            end: timeToMinutes(event.endTime),
          });
        }
      });

      // Sort by start time
      busyIntervals.sort((a, b) => a.start - b.start);

      // Generate time slots within working hours
      const slots: TimeSlot[] = [];
      const workStart = settings.workingHoursStart * 60;
      const workEnd = settings.workingHoursEnd * 60;

      for (let t = workStart; t < workEnd; t += settings.slotDuration) {
        const slotEnd = Math.min(t + settings.slotDuration, workEnd);
        const isBusy = busyIntervals.some(
          (interval) => interval.start < slotEnd && interval.end > t
        );
        slots.push({
          start: minutesToTime(t),
          end: minutesToTime(slotEnd),
          isFree: !isBusy,
        });
      }

      return { date: day, dateKey, slots };
    });
  }, [next7Days, events, settings]);

  // Generate shareable text
  const generateShareableText = (): string => {
    const lines = ['My Availability (next 7 days)', ''];

    dailySlots.forEach(({ date, slots }) => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      const freeSlots = slots.filter((s) => s.isFree);

      if (freeSlots.length === 0) {
        lines.push(`${dayName}: No availability`);
      } else {
        // Merge consecutive free slots
        const merged: Array<{ start: string; end: string }> = [];
        freeSlots.forEach((slot) => {
          const last = merged[merged.length - 1];
          if (last && last.end === slot.start) {
            last.end = slot.end;
          } else {
            merged.push({ start: slot.start, end: slot.end });
          }
        });
        const timeRanges = merged.map((s) => `${s.start}-${s.end}`).join(', ');
        lines.push(`${dayName}: ${timeRanges}`);
      }
    });

    return lines.join('\n');
  };

  const handleCopyLink = async () => {
    const text = generateShareableText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate hour labels
  const hourLabels = useMemo(() => {
    const labels: string[] = [];
    for (let h = settings.workingHoursStart; h < settings.workingHoursEnd; h++) {
      labels.push(formatHour(h));
    }
    return labels;
  }, [settings.workingHoursStart, settings.workingHoursEnd]);

  return (
    <>
      <PageHeader />
      <PageContent page="availability" variant="default">
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Showing free time blocks for the next 7 days based on your calendar events.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-secondary transition-colors text-text-light-secondary dark:text-text-dark-secondary"
              >
                <Settings2 className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-accent-primary text-white hover:opacity-90 transition-opacity"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Availability
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 rounded-lg bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark space-y-4">
              <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">Settings</h3>
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Working Hours Start</label>
                  <select
                    value={settings.workingHoursStart}
                    onChange={(e) => setSettings((s) => ({ ...s, workingHoursStart: Number(e.target.value) }))}
                    className="block w-full px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Working Hours End</label>
                  <select
                    value={settings.workingHoursEnd}
                    onChange={(e) => setSettings((s) => ({ ...s, workingHoursEnd: Number(e.target.value) }))}
                    className="block w-full px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">Slot Duration</label>
                  <select
                    value={settings.slotDuration}
                    onChange={(e) => setSettings((s) => ({ ...s, slotDuration: Number(e.target.value) as 30 | 60 }))}
                    className="block w-full px-3 py-1.5 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light-primary dark:text-text-dark-primary"
                  >
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Week Grid */}
          <div className="rounded-lg border border-border-light dark:border-border-dark overflow-hidden bg-surface-light-elevated dark:bg-surface-dark-elevated">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary border-b border-border-light dark:border-border-dark w-16">
                      Time
                    </th>
                    {next7Days.map((day, i) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <th
                          key={i}
                          className={`p-3 text-center text-xs font-medium border-b border-border-light dark:border-border-dark ${
                            isToday
                              ? 'text-accent-primary bg-accent-primary/5'
                              : 'text-text-light-secondary dark:text-text-dark-secondary'
                          }`}
                        >
                          <div>{DAYS_OF_WEEK[(day.getDay() + 6) % 7]}</div>
                          <div className={`text-lg font-bold mt-0.5 ${
                            isToday ? 'text-accent-primary' : 'text-text-light-primary dark:text-text-dark-primary'
                          }`}>
                            {day.getDate()}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {hourLabels.map((label, slotIndex) => (
                    <tr key={slotIndex}>
                      <td className="p-2 text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary border-r border-border-light dark:border-border-dark text-right pr-3">
                        {label}
                      </td>
                      {dailySlots.map(({ slots }, dayIndex) => {
                        // For 30-min slots, we may have 2 slots per hour row
                        const slotsPerHour = 60 / settings.slotDuration;
                        const startSlotIndex = slotIndex * slotsPerHour;
                        const cellSlots = slots.slice(startSlotIndex, startSlotIndex + slotsPerHour);

                        if (slotsPerHour === 1) {
                          const slot = cellSlots[0];
                          return (
                            <td
                              key={dayIndex}
                              className={`p-1 border border-border-light/30 dark:border-border-dark/30 ${
                                slot?.isFree
                                  ? 'bg-accent-green/15 dark:bg-accent-green/10'
                                  : 'bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/30'
                              }`}
                              title={slot ? `${slot.start} - ${slot.end}: ${slot.isFree ? 'Free' : 'Busy'}` : ''}
                            >
                              <div className={`text-center text-[10px] font-medium ${
                                slot?.isFree
                                  ? 'text-accent-green'
                                  : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                              }`}>
                                {slot?.isFree ? 'Free' : 'Busy'}
                              </div>
                            </td>
                          );
                        }

                        // 30-min slots: show 2 mini-cells stacked
                        return (
                          <td key={dayIndex} className="p-0 border border-border-light/30 dark:border-border-dark/30">
                            <div className="flex flex-col">
                              {cellSlots.map((slot, si) => (
                                <div
                                  key={si}
                                  className={`py-0.5 text-center text-[9px] font-medium ${
                                    slot.isFree
                                      ? 'bg-accent-green/15 dark:bg-accent-green/10 text-accent-green'
                                      : 'bg-surface-light-secondary/50 dark:bg-surface-dark-secondary/30 text-text-light-tertiary dark:text-text-dark-tertiary'
                                  } ${si === 0 ? 'border-b border-border-light/20 dark:border-border-dark/20' : ''}`}
                                  title={`${slot.start} - ${slot.end}: ${slot.isFree ? 'Free' : 'Busy'}`}
                                >
                                  {slot.isFree ? 'Free' : 'Busy'}
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-text-light-secondary dark:text-text-dark-secondary">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent-green/20 border border-accent-green/30" />
              <span>Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-surface-light-secondary dark:bg-surface-dark-secondary border border-border-light dark:border-border-dark" />
              <span>Busy</span>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}

export default Availability;
