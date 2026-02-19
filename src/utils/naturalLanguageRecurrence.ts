/**
 * Natural Language Recurrence Parser
 * Converts human-readable phrases into RecurrenceRule objects
 *
 * Supported phrases:
 * - Daily: "every day", "every 3 days", "daily", "every weekday"
 * - Weekly: "every week", "every Monday", "every 2 weeks on Friday", "weekly"
 * - Monthly: "every month", "every 15th", "monthly on the 10th"
 * - Yearly: "every year", "annually", "every January 15th"
 */

import type { Task } from '../types';

type RecurrenceRule = NonNullable<Task['recurrence']>;

const DAY_NAMES: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const MONTH_NAMES: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/**
 * Parse a natural language string into a RecurrenceRule
 * @param input Human-readable recurrence description
 * @returns RecurrenceRule object or null if unparseable
 */
export function parseRecurrenceNaturalLanguage(input: string): RecurrenceRule | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');

  return (
    parseDailyPattern(normalized) ||
    parseWeeklyPattern(normalized) ||
    parseOrdinalMonthlyPattern(normalized) || // Check ordinal patterns before regular monthly
    parseIntervalOrdinalPattern(normalized) ||
    parseMonthlyPattern(normalized) ||
    parseYearlyPattern(normalized)
  );
}

function parseDailyPattern(input: string): RecurrenceRule | null {
  // "every weekday" or "weekdays"
  if (input.includes('weekday')) {
    return {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      endType: 'never',
    };
  }

  // "every day" or "daily"
  if (input === 'every day' || input === 'daily') {
    return {
      frequency: 'daily',
      interval: 1,
      endType: 'never',
    };
  }

  // "every N days" or "every N day"
  const everyNDays = input.match(/every (\d+) days?/);
  if (everyNDays) {
    const interval = parseInt(everyNDays[1], 10);
    if (interval < 1 || interval > 100) return null; // Validate interval
    return {
      frequency: 'daily',
      interval,
      endType: 'never',
    };
  }

  return null;
}

function parseWeeklyPattern(input: string): RecurrenceRule | null {
  // "every week" or "weekly"
  if (input === 'every week' || input === 'weekly') {
    return {
      frequency: 'weekly',
      interval: 1,
      endType: 'never',
    };
  }

  // "every N weeks" (without specific day)
  const everyNWeeks = input.match(/every (\d+) weeks?$/);
  if (everyNWeeks) {
    const interval = parseInt(everyNWeeks[1], 10);
    if (interval < 1 || interval > 100) return null; // Validate interval
    return {
      frequency: 'weekly',
      interval,
      endType: 'never',
    };
  }

  // "every <day>" (e.g., "every monday")
  for (const [dayName, dayNum] of Object.entries(DAY_NAMES)) {
    if (input === `every ${dayName}`) {
      return {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [dayNum],
        endType: 'never',
      };
    }
  }

  // "every N weeks on <day>" (e.g., "every 2 weeks on friday")
  for (const [dayName, dayNum] of Object.entries(DAY_NAMES)) {
    const pattern = `every (\\d+) weeks? on ${dayName}`;
    const match = input.match(new RegExp(pattern));
    if (match) {
      const interval = parseInt(match[1], 10);
      if (interval < 1 || interval > 100) return null; // Validate interval
      return {
        frequency: 'weekly',
        interval,
        daysOfWeek: [dayNum],
        endType: 'never',
      };
    }
  }

  return null;
}

/**
 * Parse ordinal monthly patterns like "first Monday of month" or "last Friday"
 */
function parseOrdinalMonthlyPattern(input: string): RecurrenceRule | null {
  // "first monday of month" or "first monday"
  const ordinalPattern = /(first|second|third|fourth|last) (sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)(?: of month)?/i;

  const match = input.match(ordinalPattern);
  if (!match) return null;

  const ordinal = match[1].toLowerCase();
  const dayName = match[2].toLowerCase();

  const weekOfMonth = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4,
    'last': -1,
  }[ordinal] as 1 | 2 | 3 | 4 | -1;

  const dayOfWeekInMonth = DAY_NAMES[dayName];

  if (weekOfMonth === undefined || dayOfWeekInMonth === undefined) {
    return null;
  }

  return {
    frequency: 'monthly',
    interval: 1,
    weekOfMonth,
    dayOfWeekInMonth,
    endType: 'never',
  };
}

/**
 * Parse interval ordinal patterns like "every 3 months on the first monday"
 */
function parseIntervalOrdinalPattern(input: string): RecurrenceRule | null {
  // "every N months on the first monday"
  const pattern = /every (\d+) months? on the (first|second|third|fourth|last) (sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)/i;

  const match = input.match(pattern);
  if (!match) return null;

  const interval = parseInt(match[1], 10);
  if (interval < 1 || interval > 100) return null; // Validate interval

  const ordinal = match[2].toLowerCase();
  const dayName = match[3].toLowerCase();

  const weekOfMonth = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4,
    'last': -1,
  }[ordinal] as 1 | 2 | 3 | 4 | -1;

  const dayOfWeekInMonth = DAY_NAMES[dayName];

  if (weekOfMonth === undefined || dayOfWeekInMonth === undefined) {
    return null;
  }

  return {
    frequency: 'monthly',
    interval,
    weekOfMonth,
    dayOfWeekInMonth,
    endType: 'never',
  };
}

function parseMonthlyPattern(input: string): RecurrenceRule | null {
  // "every month" or "monthly"
  if (input === 'every month' || input === 'monthly') {
    return {
      frequency: 'monthly',
      interval: 1,
      endType: 'never',
    };
  }

  // "every N months on the Nth" (e.g., "every 3 months on the 15th")
  const everyNMonthsOnThe = input.match(/every (\d+) months? on the (\d+)(?:st|nd|rd|th)?/);
  if (everyNMonthsOnThe) {
    const interval = parseInt(everyNMonthsOnThe[1], 10);
    const day = parseInt(everyNMonthsOnThe[2], 10);
    if (interval < 1 || interval > 100) return null; // Validate interval
    if (day >= 1 && day <= 31) {
      return {
        frequency: 'monthly',
        interval,
        dayOfMonth: day,
        endType: 'never',
      };
    }
  }

  // "every Nth" or "every Nst" or "every Nnd" or "every Nrd" (e.g., "every 15th")
  const everyNth = input.match(/every (\d+)(?:st|nd|rd|th)?$/);
  if (everyNth) {
    const day = parseInt(everyNth[1], 10);
    if (day >= 1 && day <= 31) {
      return {
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: day,
        endType: 'never',
      };
    }
  }

  // "monthly on the Nth" (e.g., "monthly on the 10th")
  const monthlyOnThe = input.match(/monthly on the (\d+)(?:st|nd|rd|th)?/);
  if (monthlyOnThe) {
    const day = parseInt(monthlyOnThe[1], 10);
    if (day >= 1 && day <= 31) {
      return {
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: day,
        endType: 'never',
      };
    }
  }

  // "every N months"
  const everyNMonths = input.match(/every (\d+) months?$/);
  if (everyNMonths) {
    const interval = parseInt(everyNMonths[1], 10);
    if (interval < 1 || interval > 100) return null; // Validate interval
    return {
      frequency: 'monthly',
      interval,
      endType: 'never',
    };
  }

  return null;
}

function parseYearlyPattern(input: string): RecurrenceRule | null {
  // "every year" or "annually" or "yearly"
  if (input === 'every year' || input === 'annually' || input === 'yearly') {
    return {
      frequency: 'yearly',
      interval: 1,
      endType: 'never',
    };
  }

  // "every N years"
  const everyNYears = input.match(/every (\d+) years?$/);
  if (everyNYears) {
    const interval = parseInt(everyNYears[1], 10);
    if (interval < 1 || interval > 100) return null; // Validate interval
    return {
      frequency: 'yearly',
      interval,
      endType: 'never',
    };
  }

  // "every <month> <day>" (e.g., "every january 15th")
  // Note: RecurrenceRule type doesn't currently support monthOfYear field,
  // so we can only return basic yearly recurrence without the specific month/day
  for (const [monthName] of Object.entries(MONTH_NAMES)) {
    const pattern = `every ${monthName} (\\d+)(?:st|nd|rd|th)?`;
    const match = input.match(new RegExp(pattern));
    if (match) {
      const day = parseInt(match[1], 10);
      if (day >= 1 && day <= 31) {
        // Note: Full support requires monthOfYear field in RecurrenceRule type
        // Currently returns basic yearly recurrence without specific month/day
        return {
          frequency: 'yearly',
          interval: 1,
          endType: 'never',
        };
      }
    }
  }

  return null;
}

/**
 * Format a RecurrenceRule into human-readable text
 * @param rule RecurrenceRule object
 * @returns Human-readable string
 */
export function formatRecurrenceRule(rule: RecurrenceRule): string {
  const { frequency, interval = 1, daysOfWeek, dayOfMonth, weekOfMonth, dayOfWeekInMonth } = rule;

  // Daily patterns
  if (frequency === 'daily') {
    if (interval === 1) {
      return 'Every day';
    }
    return `Every ${interval} days`;
  }

  // Weekly patterns
  if (frequency === 'weekly') {
    // Weekdays
    if (daysOfWeek && daysOfWeek.length === 5 && daysOfWeek.includes(1) && daysOfWeek.includes(5)) {
      return 'Every weekday';
    }

    // Specific day(s)
    if (daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = daysOfWeek.map(d => getDayName(d));
      const dayStr = dayNames.join(', ');
      if (interval === 1) {
        return `Every ${dayStr}`;
      }
      return `Every ${interval} weeks on ${dayStr}`;
    }

    // No specific days
    if (interval === 1) {
      return 'Every week';
    }
    return `Every ${interval} weeks`;
  }

  // Monthly patterns
  if (frequency === 'monthly') {
    // Ordinal patterns ("first Monday", "last Friday")
    if (weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
      const ordinalStr = {
        '1': 'first',
        '2': 'second',
        '3': 'third',
        '4': 'fourth',
        '-1': 'last',
      }[weekOfMonth.toString()];

      const dayStr = getDayName(dayOfWeekInMonth);

      if (interval === 1) {
        return `Every ${ordinalStr} ${dayStr} of the month`;
      }
      return `Every ${interval} months on the ${ordinalStr} ${dayStr}`;
    }

    // Day of month patterns
    if (dayOfMonth) {
      if (interval === 1) {
        return `Every ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
      }
      return `Every ${interval} months on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
    }

    if (interval === 1) {
      return 'Every month';
    }
    return `Every ${interval} months`;
  }

  // Yearly patterns
  if (frequency === 'yearly') {
    if (interval === 1) {
      return 'Every year';
    }
    return `Every ${interval} years`;
  }

  return 'Custom recurrence';
}

function getDayName(dayNum: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[dayNum] || '';
}

function getOrdinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  const lastDigit = n % 10;
  if (lastDigit === 1) return 'st';
  if (lastDigit === 2) return 'nd';
  if (lastDigit === 3) return 'rd';
  return 'th';
}
