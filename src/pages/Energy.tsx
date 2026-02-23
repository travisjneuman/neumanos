import { useMemo, useState } from 'react';
import { useEnergyStore } from '../stores/useEnergyStore';
import type { EnergyLog, EnergyPattern } from '../stores/useEnergyStore';
import { useKanbanStore } from '../stores/useKanbanStore';
import { PageHeader } from '../components/PageHeader';

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

const ENERGY_FACES = ['😴', '😩', '😐', '😐', '🙂', '🙂', '😊', '😄', '💪', '⚡'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getHeatmapColor(value: number): string {
  if (value === 0) return 'bg-surface-light-elevated dark:bg-surface-dark-elevated';
  if (value <= 3) return 'bg-red-500/60';
  if (value <= 5) return 'bg-yellow-500/60';
  if (value <= 7) return 'bg-green-500/40';
  return 'bg-green-500/70';
}

// ==================== LOG FORM ====================

function EnergyLogForm() {
  const logEnergy = useEnergyStore((s) => s.logEnergy);
  const [level, setLevel] = useState(5);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  });
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logEnergy(level, timeOfDay, note || undefined);
    setNote('');
  };

  const face = ENERGY_FACES[level - 1] || '😐';

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark space-y-4">
      <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
        Log Current Energy
      </h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">Level</span>
          <span className="text-2xl">{face} <span className="text-sm font-medium">{level}/10</span></span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-gradient-to-r from-red-500 via-yellow-500 to-green-500
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
          "
        />
      </div>

      <div className="flex gap-2">
        {(['morning', 'afternoon', 'evening'] as const).map((tod) => (
          <button
            key={tod}
            type="button"
            onClick={() => setTimeOfDay(tod)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border
              ${timeOfDay === tod
                ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30'
                : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary border-border-light dark:border-border-dark'
              }
            `}
          >
            {tod === 'morning' ? '🌅' : tod === 'afternoon' ? '☀️' : '🌙'}{' '}
            {tod.charAt(0).toUpperCase() + tod.slice(1)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (e.g., slept well, coffee)"
        className="w-full px-3 py-2 rounded-lg text-sm bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary/50 dark:placeholder:text-text-dark-secondary/50"
      />

      <button
        type="submit"
        className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-accent-blue text-white hover:bg-accent-blue/90 transition-colors"
      >
        Log Energy
      </button>
    </form>
  );
}

// ==================== HEATMAP ====================

function WeeklyHeatmap({ patterns }: { patterns: EnergyPattern[] }) {
  const times: Array<{ key: TimeOfDay; label: string }> = [
    { key: 'morning', label: 'Morning' },
    { key: 'afternoon', label: 'Afternoon' },
    { key: 'evening', label: 'Evening' },
  ];

  return (
    <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark">
      <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
        Weekly Energy Patterns
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-xs text-text-light-secondary dark:text-text-dark-secondary text-left py-1 pr-2 w-20" />
              {DAY_NAMES.map((day) => (
                <th key={day} className="text-xs text-text-light-secondary dark:text-text-dark-secondary text-center py-1 px-1">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((time) => (
              <tr key={time.key}>
                <td className="text-xs text-text-light-secondary dark:text-text-dark-secondary py-1 pr-2">
                  {time.label}
                </td>
                {patterns.map((pattern) => {
                  const val =
                    time.key === 'morning'
                      ? pattern.avgMorning
                      : time.key === 'afternoon'
                        ? pattern.avgAfternoon
                        : pattern.avgEvening;
                  return (
                    <td key={pattern.dayOfWeek} className="py-1 px-1">
                      <div
                        className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium ${getHeatmapColor(val)} ${val > 0 ? 'text-text-light-primary dark:text-text-dark-primary' : 'text-text-light-secondary/30 dark:text-text-dark-secondary/30'}`}
                        title={`${FULL_DAY_NAMES[pattern.dayOfWeek]} ${time.label}: ${val > 0 ? val + '/10' : 'No data'}`}
                      >
                        {val > 0 ? val : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-2">
        Based on 4-week rolling average
      </p>
    </div>
  );
}

// ==================== TREND CHART ====================

function EnergyTrendChart({ logs }: { logs: EnergyLog[] }) {
  const dailyAverages = useMemo(() => {
    const result: Array<{ date: string; avg: number; label: string }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const dayLogs = logs.filter((l) => l.date === key);
      const avg = dayLogs.length > 0
        ? Math.round((dayLogs.reduce((sum, l) => sum + l.level, 0) / dayLogs.length) * 10) / 10
        : 0;
      result.push({
        date: key,
        avg,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
    return result;
  }, [logs]);

  const maxVal = 10;

  return (
    <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark">
      <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-3">
        30-Day Energy Trend
      </h3>
      <div className="h-32 flex items-end gap-px">
        {dailyAverages.map((day) => (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center justify-end"
            title={`${day.label}: ${day.avg > 0 ? day.avg + '/10' : 'No data'}`}
          >
            <div
              className={`w-full rounded-t-sm transition-all ${
                day.avg === 0
                  ? 'bg-border-light/30 dark:bg-border-dark/30'
                  : day.avg >= 7
                    ? 'bg-green-500'
                    : day.avg >= 4
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
              }`}
              style={{ height: `${day.avg > 0 ? (day.avg / maxVal) * 100 : 4}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
          {dailyAverages[0]?.label}
        </span>
        <span className="text-[10px] text-text-light-secondary dark:text-text-dark-secondary">
          {dailyAverages[dailyAverages.length - 1]?.label}
        </span>
      </div>
    </div>
  );
}

// ==================== BURNOUT ALERT ====================

function BurnoutAlert({ logs }: { logs: EnergyLog[] }) {
  const alert = useMemo(() => {
    // Check last 3 days for consecutive below-4 averages
    const lowDays: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const dayLogs = logs.filter((l) => l.date === key);
      if (dayLogs.length > 0) {
        const avg = dayLogs.reduce((sum, l) => sum + l.level, 0) / dayLogs.length;
        if (avg < 4) {
          lowDays.push(key);
        }
      }
    }

    if (lowDays.length >= 3) {
      return {
        active: true,
        days: lowDays.length,
      };
    }
    return { active: false, days: 0 };
  }, [logs]);

  if (!alert.active) return null;

  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔥</span>
        <div>
          <h4 className="text-sm font-semibold text-red-400">Burnout Alert</h4>
          <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Your energy has been below 4/10 for {alert.days} consecutive days. Consider taking a break,
            adjusting your workload, or scheduling lighter tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== TASK SUGGESTIONS ====================

function TaskSuggestions({ patterns }: { patterns: EnergyPattern[] }) {
  const tasks = useKanbanStore((s) => s.tasks);

  const suggestions = useMemo(() => {
    const activeTasks = tasks.filter(
      (t) => t.status !== 'done' && !t.archivedAt && t.energyCost
    );

    if (activeTasks.length === 0 || patterns.every((p) => p.avgMorning === 0 && p.avgAfternoon === 0 && p.avgEvening === 0)) {
      return null;
    }

    // Find peak energy times
    let peakDay = 0;
    let peakTime: TimeOfDay = 'morning';
    let peakAvg = 0;

    for (const pattern of patterns) {
      const entries: Array<{ time: TimeOfDay; avg: number }> = [
        { time: 'morning', avg: pattern.avgMorning },
        { time: 'afternoon', avg: pattern.avgAfternoon },
        { time: 'evening', avg: pattern.avgEvening },
      ];
      for (const entry of entries) {
        if (entry.avg > peakAvg) {
          peakAvg = entry.avg;
          peakDay = pattern.dayOfWeek;
          peakTime = entry.time;
        }
      }
    }

    const highEnergyTasks = activeTasks.filter((t) => (t.energyCost ?? 0) >= 4);
    const lowEnergyTasks = activeTasks.filter((t) => (t.energyCost ?? 0) <= 2);

    return {
      peakDay: FULL_DAY_NAMES[peakDay],
      peakTime,
      peakAvg,
      highEnergyTasks: highEnergyTasks.slice(0, 3),
      lowEnergyTasks: lowEnergyTasks.slice(0, 3),
    };
  }, [tasks, patterns]);

  if (!suggestions) {
    return (
      <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark">
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          Task Suggestions
        </h3>
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Add energy costs to tasks and log your energy for a few weeks to get personalized scheduling suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark space-y-3">
      <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
        Task Suggestions
      </h3>

      <div className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
        Your peak energy is typically on <span className="font-medium text-green-400">{suggestions.peakDay} {suggestions.peakTime}</span> ({suggestions.peakAvg}/10)
      </div>

      {suggestions.highEnergyTasks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-orange-400 mb-1">
            Schedule for high-energy times:
          </p>
          <ul className="space-y-1">
            {suggestions.highEnergyTasks.map((task) => (
              <li key={task.id} className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center gap-1.5">
                <span className="text-orange-400">●</span>
                {task.title}
                <span className="text-text-light-secondary/50 dark:text-text-dark-secondary/50">
                  (cost: {task.energyCost}/5)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions.lowEnergyTasks.length > 0 && (
        <div>
          <p className="text-xs font-medium text-blue-400 mb-1">
            Good for low-energy periods:
          </p>
          <ul className="space-y-1">
            {suggestions.lowEnergyTasks.map((task) => (
              <li key={task.id} className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center gap-1.5">
                <span className="text-blue-400">●</span>
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN PAGE ====================

export function Energy() {
  const logs = useEnergyStore((s) => s.logs);
  const calculatePatterns = useEnergyStore((s) => s.calculatePatterns);

  const patterns = useMemo(() => calculatePatterns(), [calculatePatterns, logs]);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Left Column: Log + Burnout Alert */}
        <div className="space-y-4">
          <EnergyLogForm />
          <BurnoutAlert logs={logs} />
          <TaskSuggestions patterns={patterns} />
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-2 space-y-4">
          <WeeklyHeatmap patterns={patterns} />
          <EnergyTrendChart logs={logs} />
        </div>
      </div>
    </div>
  );
}
