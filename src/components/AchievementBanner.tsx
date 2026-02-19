import { useEffect, useState } from 'react';
import type { Achievement } from '../stores/useAchievementsStore';
import { useAchievementsStore } from '../stores/useAchievementsStore';

interface AchievementBannerProps {
  achievement: Achievement;
  onClose: () => void;
}

/**
 * Achievement Banner
 *
 * Full-width banner that slides down from top when achievement is unlocked.
 * Shows for 4 seconds then auto-dismisses (or user can close manually).
 *
 * Features:
 * - Slide down animation (500ms ease-out)
 * - Icon, title, description, progress to next
 * - Dismissible (X button)
 * - Auto-dismiss after 4 seconds
 */
export function AchievementBanner({ achievement, onClose }: AchievementBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { getProgressToNext } = useAchievementsStore();

  // Trigger slide-in animation on mount
  useEffect(() => {
    // Slight delay for smoother animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for animation to complete before calling onClose
      setTimeout(() => {
        onClose();
      }, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Handle dismiss with animation
  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose();
    }, 500);
  };

  // Get progress to next achievement in same category
  const progress = getProgressToNext(achievement.category);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-primary text-white shadow-2xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Icon */}
            <div className="text-4xl flex-shrink-0" aria-hidden="true">
              {achievement.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold uppercase tracking-wider opacity-90 mb-1">
                Achievement Unlocked!
              </div>
              <div className="text-xl font-bold mb-1">{achievement.name}</div>
              <div className="text-sm opacity-90">{achievement.description}</div>

              {/* Progress to next */}
              {progress && progress.percentage < 100 && (
                <div className="mt-2 text-xs opacity-75">
                  {progress.next - progress.current} more {achievement.category === 'tasks' ? 'tasks' : achievement.category === 'notes' ? 'notes' : achievement.category === 'time' ? 'hours' : 'days'} until "{getNextAchievementName(achievement.category)}"
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="text-white hover:text-white/80 transition-colors p-2 -m-2"
              aria-label="Dismiss achievement"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get next achievement name in category
 */
function getNextAchievementName(category: Achievement['category']): string {
  const { ACHIEVEMENTS } = useAchievementsStore.getState() as unknown as { ACHIEVEMENTS: Achievement[] };
  const unlocked = useAchievementsStore.getState().unlockedAchievements;

  const categoryAchievements = ACHIEVEMENTS.filter(
    (a) => a.category === category
  ).sort((a, b) => a.threshold - b.threshold);

  const nextAchievement = categoryAchievements.find(
    (a) => !unlocked.includes(a.id)
  );

  return nextAchievement?.name || 'Max Achievement';
}
