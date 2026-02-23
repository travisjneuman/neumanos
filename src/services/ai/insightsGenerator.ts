/**
 * AI Insights Generator for Weekly Retrospective
 *
 * Generates structured insights from retrospective data.
 * Uses template-based generation by default.
 * AI generation can be triggered from the UI when a configured router is available.
 * Caches results in localStorage keyed by week.
 */

import type { RetroData } from '../weeklyRetrospective';
import type { AIProviderRouter } from './providerRouter';

// ─── Types ──────────────────────────────────────────────────

export interface WeeklyInsights {
  wins: [string, string, string];
  improvements: [string, string];
  actionItem: string;
  productivityScore: number; // 0-100
  generatedAt: string;
  source: 'ai' | 'template';
}

// ─── Cache ──────────────────────────────────────────────────

const CACHE_PREFIX = 'retro-insights-';

function getCacheKey(weekStart: Date): string {
  return `${CACHE_PREFIX}${weekStart.toISOString().split('T')[0]}`;
}

export function getCachedInsights(weekStart: Date): WeeklyInsights | null {
  try {
    const raw = localStorage.getItem(getCacheKey(weekStart));
    if (raw) return JSON.parse(raw) as WeeklyInsights;
  } catch {
    // ignore parse errors
  }
  return null;
}

function cacheInsights(weekStart: Date, insights: WeeklyInsights): void {
  try {
    localStorage.setItem(getCacheKey(weekStart), JSON.stringify(insights));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearInsightsCache(weekStart: Date): void {
  try {
    localStorage.removeItem(getCacheKey(weekStart));
  } catch {
    // ignore
  }
}

// ─── Formatting Helper ──────────────────────────────────────

export function formatHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

// ─── Template-Based Insights ────────────────────────────────

export function generateTemplateInsights(data: RetroData): WeeklyInsights {
  const { tasks, time, habits, calendar, comparison } = data;

  const taskScore = Math.min(tasks.completionRate, 100);
  const habitScore = habits.overallCompletionRate;
  const timeScore = Math.min((time.totalSeconds / (40 * 3600)) * 100, 100);
  const productivityScore = Math.round(taskScore * 0.35 + habitScore * 0.35 + timeScore * 0.3);

  const wins: [string, string, string] = [
    tasks.completed > 0
      ? `You completed ${tasks.completed} task${tasks.completed !== 1 ? 's' : ''} this week${comparison && comparison.tasks.completedDelta > 0 ? `, ${comparison.tasks.completedDelta} more than last week` : ''}.`
      : 'You stayed active and engaged with your workflow.',
    time.totalSeconds > 0
      ? `You logged ${formatHours(time.totalSeconds)} of focused work${time.mostProductiveDay ? `, with ${time.mostProductiveDay} being your most productive day` : ''}.`
      : 'You maintained your organizational systems throughout the week.',
    habits.overallCompletionRate > 50
      ? `Your habit completion rate was ${habits.overallCompletionRate}%${habits.bestHabit ? `, led by "${habits.bestHabit}"` : ''}.`
      : calendar.totalEvents > 0
        ? `You managed ${calendar.totalEvents} calendar event${calendar.totalEvents !== 1 ? 's' : ''} including ${calendar.meetingsCount} meeting${calendar.meetingsCount !== 1 ? 's' : ''}.`
        : 'You kept your workspace organized and accessible.',
  ];

  const improvements: [string, string] = [
    tasks.overdue > 0
      ? `${tasks.overdue} task${tasks.overdue !== 1 ? 's are' : ' is'} overdue. Consider reviewing priorities and deadlines.`
      : comparison && comparison.tasks.completedDelta < 0
        ? `Task completion dropped by ${Math.abs(comparison.tasks.completedDelta)} compared to last week.`
        : 'Consider setting more specific daily goals to maintain momentum.',
    habits.worstHabit
      ? `"${habits.worstHabit}" needs attention — it had the lowest completion rate this week.`
      : comparison && comparison.habits.rateDelta < 0
        ? `Habit consistency dropped ${Math.abs(comparison.habits.rateDelta)}% from last week.`
        : 'Try adding time blocks for deep work to maximize productivity.',
  ];

  const actionItem = tasks.overdue > 0
    ? `Review and reschedule ${tasks.overdue} overdue task${tasks.overdue !== 1 ? 's' : ''} before starting new work.`
    : habits.overallCompletionRate < 50
      ? 'Focus on completing at least one habit consistently each day this week.'
      : time.totalSeconds < 10 * 3600
        ? 'Try logging your work time more consistently to better understand your productivity patterns.'
        : 'Maintain your current pace and consider documenting your best practices.';

  const insights: WeeklyInsights = {
    wins,
    improvements,
    actionItem,
    productivityScore,
    generatedAt: new Date().toISOString(),
    source: 'template',
  };

  cacheInsights(data.weekStart, insights);
  return insights;
}

// ─── AI-Based Insights ──────────────────────────────────────

/**
 * Generate AI-powered insights using an already-configured provider router.
 * The router must have API keys already loaded (handled by the calling component).
 */
export async function generateAIInsights(
  data: RetroData,
  router: AIProviderRouter
): Promise<WeeklyInsights> {
  const systemPrompt = `You are a productivity coach analyzing a user's weekly data.
Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "wins": ["win1", "win2", "win3"],
  "improvements": ["improvement1", "improvement2"],
  "actionItem": "one specific actionable item",
  "productivityScore": 75
}

Rules:
- wins: 3 specific, encouraging observations based on the data
- improvements: 2 constructive suggestions
- actionItem: 1 concrete, actionable step for next week
- productivityScore: 0-100 based on overall performance`;

  const prompt = `Week: ${data.weekLabel}

Tasks: ${data.tasks.completed} completed, ${data.tasks.created} created, ${data.tasks.overdue} overdue, ${data.tasks.completionRate}% completion rate
Time: ${formatHours(data.time.totalSeconds)} total${data.time.mostProductiveDay ? `, most productive on ${data.time.mostProductiveDay}` : ''}${data.time.hoursByProject.length > 0 ? `, top project: ${data.time.hoursByProject[0].projectName} (${formatHours(data.time.hoursByProject[0].seconds)})` : ''}
Habits: ${data.habits.overallCompletionRate}% overall${data.habits.bestHabit ? `, best: "${data.habits.bestHabit}"` : ''}${data.habits.worstHabit ? `, needs work: "${data.habits.worstHabit}"` : ''}
Calendar: ${data.calendar.totalEvents} events, ${data.calendar.meetingsCount} meetings
${data.comparison ? `
vs Last Week: tasks ${data.comparison.tasks.completedDelta >= 0 ? '+' : ''}${data.comparison.tasks.completedDelta}, time ${data.comparison.time.totalSecondsDelta >= 0 ? '+' : ''}${formatHours(Math.abs(data.comparison.time.totalSecondsDelta))}, habits ${data.comparison.habits.rateDelta >= 0 ? '+' : ''}${data.comparison.habits.rateDelta}%` : ''}`;

  try {
    const response = await router.sendMessage({
      prompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    const parsed = JSON.parse(response.content) as {
      wins: [string, string, string];
      improvements: [string, string];
      actionItem: string;
      productivityScore: number;
    };

    const insights: WeeklyInsights = {
      wins: parsed.wins,
      improvements: parsed.improvements,
      actionItem: parsed.actionItem,
      productivityScore: Math.max(0, Math.min(100, parsed.productivityScore)),
      generatedAt: new Date().toISOString(),
      source: 'ai',
    };

    cacheInsights(data.weekStart, insights);
    return insights;
  } catch {
    return generateTemplateInsights(data);
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Generate insights for a week.
 * Always uses template-based generation. For AI generation,
 * use generateAIInsights() directly with a configured router.
 */
export function generateInsights(data: RetroData): WeeklyInsights {
  const cached = getCachedInsights(data.weekStart);
  if (cached) return cached;

  return generateTemplateInsights(data);
}
