/**
 * Reporting Calculations for Time Tracking
 *
 * Provides utilities for generating advanced reports with filtering,
 * grouping, and aggregation capabilities.
 */

import type { TimeEntry, TimeTrackingProject } from '../types';

export type ReportType =
  | 'time-by-project'
  | 'time-by-date'
  | 'billable-vs-nonbillable'
  | 'rate-analysis'
  | 'trends';

export type GroupByPeriod = 'day' | 'week' | 'month';

export interface ReportFilters {
  startDate?: string;         // ISO date
  endDate?: string;           // ISO date
  projectIds: string[];       // Filter by specific projects
  billableOnly?: boolean;     // Only billable entries
  groupBy?: GroupByPeriod;    // Grouping period
}

export interface TimeByProjectData {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  totalHours: number;
  totalAmount: number;        // Revenue (if hourly rate set)
  entryCount: number;
  percentage: number;         // % of total time
}

export interface TimeByDateData {
  date: string;               // ISO date or period label
  totalHours: number;
  totalAmount: number;
  entryCount: number;
  projectBreakdown: {
    projectId: string | null;
    projectName: string;
    hours: number;
  }[];
}

export interface BillableVsNonBillableData {
  billable: {
    hours: number;
    amount: number;
    entryCount: number;
    percentage: number;
  };
  nonBillable: {
    hours: number;
    entryCount: number;
    percentage: number;
  };
  total: {
    hours: number;
    entryCount: number;
  };
}

export interface RateAnalysisData {
  averageRate: number;
  medianRate: number;
  minRate: number;
  maxRate: number;
  rateDistribution: {
    rate: number;
    hours: number;
    amount: number;
  }[];
}

export interface TrendData {
  period: string;             // Week/Month label
  hours: number;
  amount: number;
  entryCount: number;
  growthRate: number;         // % change from previous period
}

/**
 * Format seconds to hours (rounded to 2 decimals)
 */
export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

/**
 * Format hours to human-readable string (e.g., "5h 30m")
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Filter time entries based on report filters
 */
export function filterEntries(
  entries: TimeEntry[],
  filters: ReportFilters
): TimeEntry[] {
  let filtered = [...entries];

  if (filters.startDate) {
    filtered = filtered.filter(e => e.startTime >= filters.startDate!);
  }

  if (filters.endDate) {
    filtered = filtered.filter(e => e.startTime <= filters.endDate!);
  }

  if (filters.projectIds.length > 0) {
    filtered = filtered.filter(e => e.projectId && filters.projectIds.includes(e.projectId));
  }

  if (filters.billableOnly) {
    filtered = filtered.filter(e => e.billable);
  }

  return filtered;
}

/**
 * Calculate Time by Project report
 */
export function calculateTimeByProject(
  entries: TimeEntry[],
  projects: TimeTrackingProject[]
): TimeByProjectData[] {
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const totalSeconds = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalHours = secondsToHours(totalSeconds);

  // Group by project
  const projectGroups = new Map<string | null, TimeEntry[]>();
  entries.forEach(entry => {
    const key = entry.projectId || null;
    if (!projectGroups.has(key)) {
      projectGroups.set(key, []);
    }
    projectGroups.get(key)!.push(entry);
  });

  // Calculate stats for each project
  const data: TimeByProjectData[] = [];
  projectGroups.forEach((projectEntries, projectId) => {
    const project = projectId ? projectMap.get(projectId) : null;
    const projectSeconds = projectEntries.reduce((sum, e) => sum + e.duration, 0);
    const projectHours = secondsToHours(projectSeconds);
    const totalAmount = projectEntries.reduce((sum, e) => {
      const hours = secondsToHours(e.duration);
      const rate = e.hourlyRate || project?.hourlyRate || 0;
      return sum + (hours * rate);
    }, 0);

    data.push({
      projectId,
      projectName: project?.name || 'No Project',
      projectColor: project?.color || '#94A3B8',
      totalHours: projectHours,
      totalAmount: Math.round(totalAmount * 100) / 100,
      entryCount: projectEntries.length,
      percentage: totalHours > 0 ? (projectHours / totalHours) * 100 : 0
    });
  });

  // Sort by hours descending
  return data.sort((a, b) => b.totalHours - a.totalHours);
}

/**
 * Calculate Time by Date report
 */
export function calculateTimeByDate(
  entries: TimeEntry[],
  projects: TimeTrackingProject[],
  groupBy: GroupByPeriod = 'day'
): TimeByDateData[] {
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Group entries by period
  const periodGroups = new Map<string, TimeEntry[]>();
  entries.forEach(entry => {
    const date = new Date(entry.startTime);
    let key: string;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      // ISO week (Mon-Sun)
      const monday = new Date(date);
      const dayOfWeek = date.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(monday.getDate() - daysFromMonday);
      key = `Week of ${monday.toISOString().split('T')[0]}`;
    } else {
      // Month
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    if (!periodGroups.has(key)) {
      periodGroups.set(key, []);
    }
    periodGroups.get(key)!.push(entry);
  });

  // Calculate stats for each period
  const data: TimeByDateData[] = [];
  periodGroups.forEach((periodEntries, period) => {
    const totalSeconds = periodEntries.reduce((sum, e) => sum + e.duration, 0);
    const totalHours = secondsToHours(totalSeconds);
    const totalAmount = periodEntries.reduce((sum, e) => {
      const hours = secondsToHours(e.duration);
      const project = e.projectId ? projectMap.get(e.projectId) : null;
      const rate = e.hourlyRate || project?.hourlyRate || 0;
      return sum + (hours * rate);
    }, 0);

    // Project breakdown for this period
    const projectBreakdown = new Map<string | null, number>();
    periodEntries.forEach(entry => {
      const key = entry.projectId || null;
      const hours = secondsToHours(entry.duration);
      projectBreakdown.set(key, (projectBreakdown.get(key) || 0) + hours);
    });

    data.push({
      date: period,
      totalHours,
      totalAmount: Math.round(totalAmount * 100) / 100,
      entryCount: periodEntries.length,
      projectBreakdown: Array.from(projectBreakdown.entries()).map(([projectId, hours]) => {
        const project = projectId ? projectMap.get(projectId) : null;
        return {
          projectId,
          projectName: project?.name || 'No Project',
          hours: Math.round(hours * 100) / 100
        };
      })
    });
  });

  // Sort by date/period
  return data.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate Billable vs Non-Billable report
 */
export function calculateBillableVsNonBillable(
  entries: TimeEntry[],
  projects: TimeTrackingProject[]
): BillableVsNonBillableData {
  const projectMap = new Map(projects.map(p => [p.id, p]));

  const billableEntries = entries.filter(e => e.billable);
  const nonBillableEntries = entries.filter(e => !e.billable);

  const billableSeconds = billableEntries.reduce((sum, e) => sum + e.duration, 0);
  const nonBillableSeconds = nonBillableEntries.reduce((sum, e) => sum + e.duration, 0);

  const billableHours = secondsToHours(billableSeconds);
  const nonBillableHours = secondsToHours(nonBillableSeconds);
  const totalHours = billableHours + nonBillableHours;

  const billableAmount = billableEntries.reduce((sum, e) => {
    const hours = secondsToHours(e.duration);
    const project = e.projectId ? projectMap.get(e.projectId) : null;
    const rate = e.hourlyRate || project?.hourlyRate || 0;
    return sum + (hours * rate);
  }, 0);

  return {
    billable: {
      hours: billableHours,
      amount: Math.round(billableAmount * 100) / 100,
      entryCount: billableEntries.length,
      percentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0
    },
    nonBillable: {
      hours: nonBillableHours,
      entryCount: nonBillableEntries.length,
      percentage: totalHours > 0 ? (nonBillableHours / totalHours) * 100 : 0
    },
    total: {
      hours: totalHours,
      entryCount: entries.length
    }
  };
}

/**
 * Calculate Rate Analysis report
 */
export function calculateRateAnalysis(
  entries: TimeEntry[],
  projects: TimeTrackingProject[]
): RateAnalysisData {
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Get all rates
  const rates: number[] = [];
  const rateMap = new Map<number, { hours: number; amount: number }>();

  entries.forEach(entry => {
    const project = entry.projectId ? projectMap.get(entry.projectId) : null;
    const rate = entry.hourlyRate || project?.hourlyRate || 0;
    const hours = secondsToHours(entry.duration);
    const amount = hours * rate;

    rates.push(rate);

    if (!rateMap.has(rate)) {
      rateMap.set(rate, { hours: 0, amount: 0 });
    }
    const existing = rateMap.get(rate)!;
    rateMap.set(rate, {
      hours: existing.hours + hours,
      amount: existing.amount + amount
    });
  });

  // Calculate statistics
  const sortedRates = rates.sort((a, b) => a - b);
  const sum = rates.reduce((a, b) => a + b, 0);
  const averageRate = rates.length > 0 ? sum / rates.length : 0;
  const medianRate = rates.length > 0
    ? sortedRates[Math.floor(sortedRates.length / 2)]
    : 0;
  const minRate = rates.length > 0 ? sortedRates[0] : 0;
  const maxRate = rates.length > 0 ? sortedRates[sortedRates.length - 1] : 0;

  // Rate distribution
  const rateDistribution = Array.from(rateMap.entries())
    .map(([rate, data]) => ({
      rate,
      hours: Math.round(data.hours * 100) / 100,
      amount: Math.round(data.amount * 100) / 100
    }))
    .sort((a, b) => a.rate - b.rate);

  return {
    averageRate: Math.round(averageRate * 100) / 100,
    medianRate: Math.round(medianRate * 100) / 100,
    minRate: Math.round(minRate * 100) / 100,
    maxRate: Math.round(maxRate * 100) / 100,
    rateDistribution
  };
}

/**
 * Calculate Trends report
 */
export function calculateTrends(
  entries: TimeEntry[],
  projects: TimeTrackingProject[],
  groupBy: 'week' | 'month' = 'week'
): TrendData[] {
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Group by period
  const periodGroups = new Map<string, TimeEntry[]>();
  entries.forEach(entry => {
    const date = new Date(entry.startTime);
    let key: string;

    if (groupBy === 'week') {
      const monday = new Date(date);
      const dayOfWeek = date.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(monday.getDate() - daysFromMonday);
      key = monday.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-01`;
    }

    if (!periodGroups.has(key)) {
      periodGroups.set(key, []);
    }
    periodGroups.get(key)!.push(entry);
  });

  // Calculate stats for each period
  const periods = Array.from(periodGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  const data: TrendData[] = [];
  periods.forEach(([period, periodEntries], index) => {
    const hours = secondsToHours(periodEntries.reduce((sum, e) => sum + e.duration, 0));
    const amount = periodEntries.reduce((sum, e) => {
      const h = secondsToHours(e.duration);
      const project = e.projectId ? projectMap.get(e.projectId) : null;
      const rate = e.hourlyRate || project?.hourlyRate || 0;
      return sum + (h * rate);
    }, 0);

    // Calculate growth rate
    let growthRate = 0;
    if (index > 0) {
      const prevHours = data[index - 1].hours;
      growthRate = prevHours > 0 ? ((hours - prevHours) / prevHours) * 100 : 0;
    }

    const label = groupBy === 'week'
      ? `Week of ${new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : new Date(period).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    data.push({
      period: label,
      hours: Math.round(hours * 100) / 100,
      amount: Math.round(amount * 100) / 100,
      entryCount: periodEntries.length,
      growthRate: Math.round(growthRate * 100) / 100
    });
  });

  return data;
}
