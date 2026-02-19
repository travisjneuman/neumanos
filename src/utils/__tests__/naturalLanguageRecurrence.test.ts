/**
 * Tests for Natural Language Recurrence Parser
 */

import { describe, it, expect } from 'vitest';
import { parseRecurrenceNaturalLanguage } from '../naturalLanguageRecurrence';

describe('parseRecurrenceNaturalLanguage', () => {
  describe('Daily patterns', () => {
    it('should parse "every day"', () => {
      const result = parseRecurrenceNaturalLanguage('every day');
      expect(result).toEqual({
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "daily"', () => {
      const result = parseRecurrenceNaturalLanguage('daily');
      expect(result).toEqual({
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "every 3 days"', () => {
      const result = parseRecurrenceNaturalLanguage('every 3 days');
      expect(result).toEqual({
        frequency: 'daily',
        interval: 3,
        endType: 'never',
      });
    });

    it('should parse "every 10 days"', () => {
      const result = parseRecurrenceNaturalLanguage('every 10 days');
      expect(result).toEqual({
        frequency: 'daily',
        interval: 10,
        endType: 'never',
      });
    });

    it('should parse "every weekday" as weekly Mon-Fri', () => {
      const result = parseRecurrenceNaturalLanguage('every weekday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5],
        endType: 'never',
      });
    });

    it('should parse "every weekdays"', () => {
      const result = parseRecurrenceNaturalLanguage('every weekdays');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5],
        endType: 'never',
      });
    });
  });

  describe('Weekly patterns', () => {
    it('should parse "every week"', () => {
      const result = parseRecurrenceNaturalLanguage('every week');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "weekly"', () => {
      const result = parseRecurrenceNaturalLanguage('weekly');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "every Monday"', () => {
      const result = parseRecurrenceNaturalLanguage('every Monday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1],
        endType: 'never',
      });
    });

    it('should parse "every Tuesday"', () => {
      const result = parseRecurrenceNaturalLanguage('every Tuesday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [2],
        endType: 'never',
      });
    });

    it('should parse "every Friday"', () => {
      const result = parseRecurrenceNaturalLanguage('every Friday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [5],
        endType: 'never',
      });
    });

    it('should parse "every Sunday"', () => {
      const result = parseRecurrenceNaturalLanguage('every Sunday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [0],
        endType: 'never',
      });
    });

    it('should parse day abbreviations "every Mon"', () => {
      const result = parseRecurrenceNaturalLanguage('every Mon');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1],
        endType: 'never',
      });
    });

    it('should parse "every 2 weeks"', () => {
      const result = parseRecurrenceNaturalLanguage('every 2 weeks');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 2,
        endType: 'never',
      });
    });

    it('should parse "every 2 weeks on Friday"', () => {
      const result = parseRecurrenceNaturalLanguage('every 2 weeks on Friday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 2,
        daysOfWeek: [5],
        endType: 'never',
      });
    });

    it('should parse "every 3 weeks on Monday"', () => {
      const result = parseRecurrenceNaturalLanguage('every 3 weeks on Monday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 3,
        daysOfWeek: [1],
        endType: 'never',
      });
    });

    it('should parse "every 4 weeks on Wed"', () => {
      const result = parseRecurrenceNaturalLanguage('every 4 weeks on Wed');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 4,
        daysOfWeek: [3],
        endType: 'never',
      });
    });
  });

  describe('Monthly patterns', () => {
    it('should parse "every month"', () => {
      const result = parseRecurrenceNaturalLanguage('every month');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "monthly"', () => {
      const result = parseRecurrenceNaturalLanguage('monthly');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "every 15th"', () => {
      const result = parseRecurrenceNaturalLanguage('every 15th');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 15,
        endType: 'never',
      });
    });

    it('should parse "every 1st"', () => {
      const result = parseRecurrenceNaturalLanguage('every 1st');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 1,
        endType: 'never',
      });
    });

    it('should parse "every 31st"', () => {
      const result = parseRecurrenceNaturalLanguage('every 31st');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 31,
        endType: 'never',
      });
    });

    it('should parse "every 2nd"', () => {
      const result = parseRecurrenceNaturalLanguage('every 2nd');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 2,
        endType: 'never',
      });
    });

    it('should parse "every 3rd"', () => {
      const result = parseRecurrenceNaturalLanguage('every 3rd');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 3,
        endType: 'never',
      });
    });

    it('should parse "monthly on the 10th"', () => {
      const result = parseRecurrenceNaturalLanguage('monthly on the 10th');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 10,
        endType: 'never',
      });
    });

    it('should parse "every 2 months"', () => {
      const result = parseRecurrenceNaturalLanguage('every 2 months');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 2,
        endType: 'never',
      });
    });

    it('should parse "every 3 months on the 15th"', () => {
      const result = parseRecurrenceNaturalLanguage('every 3 months on the 15th');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 3,
        dayOfMonth: 15,
        endType: 'never',
      });
    });

    it('should parse "every 6 months on the 1st"', () => {
      const result = parseRecurrenceNaturalLanguage('every 6 months on the 1st');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 6,
        dayOfMonth: 1,
        endType: 'never',
      });
    });
  });

  describe('Yearly patterns', () => {
    it('should parse "every year"', () => {
      const result = parseRecurrenceNaturalLanguage('every year');
      expect(result).toEqual({
        frequency: 'yearly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "annually"', () => {
      const result = parseRecurrenceNaturalLanguage('annually');
      expect(result).toEqual({
        frequency: 'yearly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "every 2 years"', () => {
      const result = parseRecurrenceNaturalLanguage('every 2 years');
      expect(result).toEqual({
        frequency: 'yearly',
        interval: 2,
        endType: 'never',
      });
    });

    it('should parse "every January 15th"', () => {
      const result = parseRecurrenceNaturalLanguage('every January 15th');
      expect(result).toEqual({
        frequency: 'yearly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "every March 1st"', () => {
      const result = parseRecurrenceNaturalLanguage('every March 1st');
      expect(result).toEqual({
        frequency: 'yearly',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "every Dec 25th"', () => {
      const result = parseRecurrenceNaturalLanguage('every Dec 25th');
      expect(result).toEqual({
        frequency: 'yearly',
        interval: 1,
        endType: 'never',
      });
    });
  });

  describe('Case insensitivity', () => {
    it('should parse "EVERY DAY"', () => {
      const result = parseRecurrenceNaturalLanguage('EVERY DAY');
      expect(result).toEqual({
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse "Every Monday"', () => {
      const result = parseRecurrenceNaturalLanguage('Every Monday');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1],
        endType: 'never',
      });
    });

    it('should parse "MONTHLY ON THE 15TH"', () => {
      const result = parseRecurrenceNaturalLanguage('MONTHLY ON THE 15TH');
      expect(result).toEqual({
        frequency: 'monthly',
        interval: 1,
        dayOfMonth: 15,
        endType: 'never',
      });
    });
  });

  describe('Whitespace handling', () => {
    it('should parse with extra whitespace', () => {
      const result = parseRecurrenceNaturalLanguage('  every   day  ');
      expect(result).toEqual({
        frequency: 'daily',
        interval: 1,
        endType: 'never',
      });
    });

    it('should parse with tabs', () => {
      const result = parseRecurrenceNaturalLanguage('every\t2\tweeks');
      expect(result).toEqual({
        frequency: 'weekly',
        interval: 2,
        endType: 'never',
      });
    });
  });

  describe('Edge cases and invalid inputs', () => {
    it('should return null for empty string', () => {
      expect(parseRecurrenceNaturalLanguage('')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(parseRecurrenceNaturalLanguage(null as any)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseRecurrenceNaturalLanguage(undefined as any)).toBeNull();
    });

    it('should return null for invalid text', () => {
      expect(parseRecurrenceNaturalLanguage('random nonsense')).toBeNull();
    });

    it('should return null for partial matches', () => {
      expect(parseRecurrenceNaturalLanguage('every')).toBeNull();
    });

    it('should return null for invalid day names', () => {
      expect(parseRecurrenceNaturalLanguage('every Funday')).toBeNull();
    });

    it('should return null for invalid intervals', () => {
      expect(parseRecurrenceNaturalLanguage('every 0 days')).toBeNull();
    });

    it('should return null for too large intervals', () => {
      expect(parseRecurrenceNaturalLanguage('every 1000 days')).toBeNull();
    });

    it('should return null for invalid day of month', () => {
      expect(parseRecurrenceNaturalLanguage('every 32nd')).toBeNull();
    });

    it('should return null for invalid month names', () => {
      expect(parseRecurrenceNaturalLanguage('every Smarch 15th')).toBeNull();
    });
  });
});

// Note: formatRecurrenceRule not yet implemented - tests commented until feature is built
// describe('formatRecurrenceRule', () => {
//   it('should format daily recurrence', () => {
//     const result = formatRecurrenceRule({
//       frequency: 'daily',
//       interval: 1,
//       endType: 'never',
//     });
//     expect(result).toBe('Repeats daily');
//   });

//   it('should format daily with interval', () => {
//     const result = formatRecurrenceRule({
//       frequency: 'daily',
//       interval: 3,
//       endType: 'never',
//     });
//     expect(result).toBe('Repeats every 3 days');
//   });

//   it('should format weekly with days', () => {
//     const result = formatRecurrenceRule({
//       frequency: 'weekly',
//       interval: 1,
//       daysOfWeek: [1, 3, 5],
//       endType: 'never',
//     });
//     expect(result).toBe('Repeats weekly on Mon, Wed, Fri');
//   });

//   it('should format monthly with day', () => {
//     const result = formatRecurrenceRule({
//       frequency: 'monthly',
//       interval: 1,
//       dayOfMonth: 15,
//       endType: 'never',
//     });
//     expect(result).toBe('Repeats monthly on day 15');
//   });

//   it('should format with end count', () => {
//     const result = formatRecurrenceRule({
//       frequency: 'weekly',
//       interval: 1,
//       endType: 'after',
//       endCount: 10,
//     });
//     expect(result).toBe('Repeats weekly, ends after 10 occurrences');
//   });

//   it('should format with end date', () => {
//     const result = formatRecurrenceRule({
//       frequency: 'monthly',
//       interval: 1,
//       endType: 'until',
//       endDate: '2024-12-31',
//     });
//     expect(result).toBe('Repeats monthly, ends on 2024-12-31');
//   });
// });
