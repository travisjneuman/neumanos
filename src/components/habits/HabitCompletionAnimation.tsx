import { useEffect, useState, useCallback } from 'react';

/** CSS-only confetti particles for milestone celebrations */
function ConfettiEffect({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * 360;
    const distance = 40 + Math.random() * 60;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const colors = ['#22c55e', '#eab308', '#ec4899', '#3b82f6', '#f97316', '#8b5cf6'];
    const color = colors[i % colors.length];
    const size = 4 + Math.random() * 4;
    const delay = Math.random() * 0.2;

    return (
      <span
        key={i}
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          left: '50%',
          top: '50%',
          opacity: 0,
          animation: `habit-confetti 0.8s ease-out ${delay}s forwards`,
          // @ts-expect-error CSS custom properties
          '--confetti-x': `${x}px`,
          '--confetti-y': `${y}px`,
        }}
      />
    );
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-10">
      {particles}
    </div>
  );
}

/** Streak counter bump animation */
function StreakBump({ streak }: { streak: number }) {
  return (
    <span
      className="inline-block"
      style={{ animation: 'habit-streak-bump 0.4s ease-out' }}
    >
      {streak}
    </span>
  );
}

interface CompletionAnimationState {
  habitId: string;
  type: 'check' | 'milestone';
  streak: number;
}

/** Hook to manage completion animations */
export function useCompletionAnimation() {
  const [animations, setAnimations] = useState<CompletionAnimationState[]>([]);

  const triggerAnimation = useCallback((habitId: string, streak: number) => {
    const isMilestone = [7, 14, 30, 60, 90, 180, 365].includes(streak);
    setAnimations((prev) => [
      ...prev,
      { habitId, type: isMilestone ? 'milestone' : 'check', streak },
    ]);
  }, []);

  const clearAnimation = useCallback((habitId: string) => {
    setAnimations((prev) => prev.filter((a) => a.habitId !== habitId));
  }, []);

  const getAnimation = useCallback(
    (habitId: string) => animations.find((a) => a.habitId === habitId),
    [animations]
  );

  return { triggerAnimation, clearAnimation, getAnimation };
}

export { ConfettiEffect, StreakBump };

/**
 * CSS keyframes to inject. These are added via a <style> tag approach
 * in the Habits page so we don't modify global CSS files.
 */
export const HABIT_ANIMATION_STYLES = `
@keyframes habit-check-pop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes habit-confetti {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(-50% + var(--confetti-x)),
      calc(-50% + var(--confetti-y))
    ) scale(1);
    opacity: 0;
  }
}

@keyframes habit-streak-bump {
  0% { transform: scale(1); }
  30% { transform: scale(1.4); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@keyframes habit-check-in {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  60% { transform: scale(1.1) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
`;
