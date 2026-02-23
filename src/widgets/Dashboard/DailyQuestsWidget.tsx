import { useEffect } from 'react';
import { Scroll, Gift } from 'lucide-react';
import { useDailyQuestsStore } from '../../stores/useDailyQuestsStore';
import type { WidgetComponentProps } from './WidgetRegistry';

export function DailyQuestsWidget(_props: WidgetComponentProps) {
  const quests = useDailyQuestsStore((s) => s.quests);
  const questLevel = useDailyQuestsStore((s) => s.questLevel);
  const generateDailyQuests = useDailyQuestsStore((s) => s.generateDailyQuests);
  const claimReward = useDailyQuestsStore((s) => s.claimReward);

  useEffect(() => {
    generateDailyQuests();
  }, [generateDailyQuests]);

  const completedCount = quests.filter((q) => q.progress >= q.target).length;
  const claimableCount = quests.filter((q) => q.progress >= q.target && !q.claimed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-accent-primary" />
          <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
            Daily Quests
          </span>
        </div>
        <span className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
          Lv.{questLevel}
        </span>
      </div>

      {quests.length === 0 ? (
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center py-4">
          Add habits to unlock daily quests.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-light-alt dark:bg-surface-dark">
            <div>
              <div className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {completedCount}/{quests.length}
              </div>
              <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                quests completed
              </div>
            </div>
            {claimableCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-accent-primary/10 text-accent-primary rounded-full animate-pulse">
                <Gift className="w-3 h-3" />
                {claimableCount} to claim
              </span>
            )}
          </div>

          <div className="space-y-2">
            {quests.map((quest) => {
              const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
              const isComplete = quest.progress >= quest.target;
              const canClaim = isComplete && !quest.claimed;

              return (
                <div
                  key={quest.id}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-sm shrink-0">{quest.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-text-light-primary dark:text-text-dark-primary truncate">
                        {quest.title}
                      </span>
                      <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary shrink-0 ml-1 tabular-nums">
                        {quest.progress}/{quest.target}
                      </span>
                    </div>
                    <div className="h-1 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isComplete
                            ? 'var(--color-status-success)'
                            : 'var(--color-accent-primary)',
                        }}
                      />
                    </div>
                  </div>
                  {canClaim && (
                    <button
                      onClick={() => claimReward(quest.id)}
                      className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-accent-primary text-white rounded hover:bg-accent-primary/90 transition-colors"
                    >
                      +{quest.xpReward}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <a
        href="/habits"
        className="block text-center text-xs text-accent-primary hover:text-accent-primary/80 transition-colors pt-1"
      >
        View all quests
      </a>
    </div>
  );
}
