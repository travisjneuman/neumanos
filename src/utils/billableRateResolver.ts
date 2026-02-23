/**
 * Billable Rate Resolver
 *
 * Resolves the effective hourly rate for a time entry using cascading priority:
 * 1. Entry-level rate (highest priority)
 * 2. Project-level rate
 * 3. Global default rate (lowest priority)
 */

import type { TimeEntry, TimeTrackingProject } from '../types';

interface RateResolutionContext {
  /** Global default hourly rate */
  defaultHourlyRate: number;
  /** Map of project ID to project (for looking up project rates) */
  projects: TimeTrackingProject[];
}

interface ResolvedRate {
  /** The effective hourly rate */
  rate: number;
  /** Where the rate came from */
  source: 'entry' | 'project' | 'global';
}

/**
 * Resolve the effective billable rate for a time entry.
 * Priority: entry rate > project rate > global rate
 */
export function resolveRate(
  entry: TimeEntry,
  context: RateResolutionContext
): ResolvedRate {
  // 1. Entry-level rate (highest priority)
  if (entry.hourlyRate !== undefined && entry.hourlyRate > 0) {
    return { rate: entry.hourlyRate, source: 'entry' };
  }

  // 2. Project-level rate
  if (entry.projectId) {
    const project = context.projects.find((p) => p.id === entry.projectId);
    if (project?.hourlyRate !== undefined && project.hourlyRate > 0) {
      return { rate: project.hourlyRate, source: 'project' };
    }
  }

  // 3. Global default rate
  return { rate: context.defaultHourlyRate, source: 'global' };
}

/**
 * Calculate the billable amount for a time entry.
 * Returns 0 for non-billable entries.
 */
export function calculateBillableAmount(
  entry: TimeEntry,
  context: RateResolutionContext
): number {
  if (!entry.billable) return 0;

  const { rate } = resolveRate(entry, context);
  const hours = entry.duration / 3600;
  return Math.round(hours * rate * 100) / 100;
}
