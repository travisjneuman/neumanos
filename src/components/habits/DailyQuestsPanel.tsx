import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Clock, Gift, Sparkles } from 'lucide-react';
import { useDailyQuestsStore } from '../../stores/useDailyQuestsStore';
import type { DailyQuest } from '../../stores/useDailyQuestsStore';

// ─── Claim Animation ────────────────────────────────────

function ClaimSparkle({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <span className="quest-sparkle-container">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="quest-sparkle-particle"
          style={{
            '--angle': `${i * 60}deg`,
            '--delay': `${i * 0.05}s`,
          } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

// ─── Quest Card ─────────────────────────────────────────

function QuestCard({ quest }: { quest: DailyQuest }) {
  const claimReward = useDailyQuestsStore((s) => s.claimReward);
  const [showSparkle, setShowSparkle] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const isComplete = quest.progress >= quest.target;
  const canClaim = isComplete && !quest.claimed;
  const progressPct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

  const handleClaim = useCallback(() => {
    setShowSparkle(true);
    setJustClaimed(true);
    claimReward(quest.id);
    setTimeout(() => setJustClaimed(false), 1200);
  }, [claimReward, quest.id]);

  return (
    <div
      className={`relative flex items-start gap-3 p-3 rounded-lg border transition-all ${
        quest.claimed
          ? 'bg-surface-light-alt/50 dark:bg-surface-dark/50 border-border-light/50 dark:border-border-dark/50 opacity-60'
          : canClaim
          ? 'bg-accent-primary/5 border-accent-primary/30 dark:bg-accent-primary/10'
          : 'bg-surface-light dark:bg-surface-dark-elevated border-border-light dark:border-border-dark'
      }`}
    >
      {/* Icon */}
      <div className="text-xl shrink-0 mt-0.5">{quest.icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {quest.title}
            </h4>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-0.5">
              {quest.description}
            </p>
          </div>

          {/* Claim button / XP badge */}
          <div className="shrink-0 relative">
            {canClaim ? (
              <button
                onClick={handleClaim}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors animate-pulse"
              >
                <Gift className="w-3 h-3" />
                +{quest.xpReward} XP
              </button>
            ) : quest.claimed ? (
              <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium text-status-success ${justClaimed ? 'quest-claim-pop' : ''}`}>
                <Sparkles className="w-3 h-3" />
                +{quest.xpReward}
              </span>
            ) : (
              <span className="px-2 py-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                {quest.xpReward} XP
              </span>
            )}
            {showSparkle && <ClaimSparkle onDone={() => setShowSparkle(false)} />}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: isComplete ? 'var(--color-status-success)' : 'var(--color-accent-primary)',
              }}
            />
          </div>
          <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary shrink-0 tabular-nums">
            {quest.progress}/{quest.target}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Expiry Timer ───────────────────────────────────────

function ExpiryTimer({ expiresAt }: { expiresAt: string }) {
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setHoursLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60))));
    }
    calc();
    const interval = setInterval(calc, 60_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span className="flex items-center gap-1 text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
      <Clock className="w-3 h-3" />
      {hoursLeft}h left
    </span>
  );
}

// ─── Main Panel ─────────────────────────────────────────

export function DailyQuestsPanel() {
  const quests = useDailyQuestsStore((s) => s.quests);
  const questLevel = useDailyQuestsStore((s) => s.questLevel);
  const totalQuestXp = useDailyQuestsStore((s) => s.totalQuestXp);
  const generateDailyQuests = useDailyQuestsStore((s) => s.generateDailyQuests);

  const [collapsed, setCollapsed] = useState(false);

  // Ensure quests are generated
  useEffect(() => {
    generateDailyQuests();
  }, [generateDailyQuests]);

  if (quests.length === 0) return null;

  const claimedCount = quests.filter((q) => q.claimed).length;
  const completedCount = quests.filter((q) => q.progress >= q.target).length;

  return (
    <div className="mb-6">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          )}
          <span className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Daily Quests
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent-primary/10 text-accent-primary">
            {completedCount}/{quests.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {quests[0] && <ExpiryTimer expiresAt={quests[0].expiresAt} />}
          <span className="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Lv.{questLevel}
          </span>
          <span className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
            {totalQuestXp} XP
          </span>
        </div>
      </button>

      {/* Quest Cards */}
      {!collapsed && (
        <div className="space-y-2">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}

          {claimedCount === quests.length && quests.length > 0 && (
            <p className="text-center text-xs text-text-light-tertiary dark:text-text-dark-tertiary py-2">
              All quests completed! New quests tomorrow.
            </p>
          )}
        </div>
      )}

      {/* CSS for sparkle animation */}
      <style>{QUEST_ANIMATION_STYLES}</style>
    </div>
  );
}

const QUEST_ANIMATION_STYLES = `
  .quest-sparkle-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .quest-sparkle-particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-accent-primary);
    animation: quest-sparkle-burst 0.6s ease-out forwards;
    animation-delay: var(--delay);
  }
  @keyframes quest-sparkle-burst {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateX(24px);
      opacity: 0;
    }
  }
  .quest-claim-pop {
    animation: quest-pop 0.4s ease-out;
  }
  @keyframes quest-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }
`;
