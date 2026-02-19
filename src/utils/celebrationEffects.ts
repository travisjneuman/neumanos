import confetti from 'canvas-confetti';

export type CelebrationIntensity = 'off' | 'subtle' | 'medium' | 'intense';

export interface ConfettiOptions {
  intensity?: CelebrationIntensity;
  colors?: string[];
  duration?: number;
  origin?: { x: number; y: number };
}

/**
 * Brand colors for confetti (from NeumanOS design system)
 */
const BRAND_COLORS = [
  '#FF006E', // Magenta
  '#00F5FF', // Cyan
  '#8338EC', // Purple
  '#3A86FF', // Blue
  '#FB5607', // Orange
  '#FFBE0B', // Yellow
];

/**
 * Check if user prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Trigger confetti animation
 *
 * @param options - Confetti customization options
 */
export function triggerConfetti(options: ConfettiOptions = {}): void {
  // Respect accessibility preference
  if (prefersReducedMotion()) {
    return;
  }

  const {
    intensity = 'medium',
    colors = BRAND_COLORS,
    duration = 3000,
    origin = { x: 0.5, y: 0.5 },
  } = options;

  // Don't animate if celebrations are off
  if (intensity === 'off') {
    return;
  }

  // Configure particle count based on intensity
  let particleCount: number;
  let spread: number;
  let decay: number;

  switch (intensity) {
    case 'subtle':
      particleCount = 50;
      spread = 60;
      decay = 0.94;
      break;
    case 'medium':
      particleCount = 150;
      spread = 90;
      decay = 0.92;
      break;
    case 'intense':
      particleCount = 300;
      spread = 120;
      decay = 0.90;
      break;
    default:
      return;
  }

  // Single burst
  confetti({
    particleCount,
    spread,
    origin,
    colors,
    decay,
    ticks: duration / 10,
    gravity: 1.2,
    scalar: 1.0,
  });
}

/**
 * Trigger fireworks animation (for milestones)
 *
 * @param count - Number of fireworks to launch
 */
export function triggerFireworks(count: number = 3): void {
  // Respect accessibility preference
  if (prefersReducedMotion()) {
    return;
  }

  const colors = [
    ['#FF006E', '#8338EC'], // Magenta/Purple
    ['#00F5FF', '#3A86FF'], // Cyan/Blue
    ['#FFBE0B', '#FB5607'], // Yellow/Orange
  ];

  let fired = 0;

  function launchFirework() {
    if (fired >= count) return;

    const colorSet = colors[fired % colors.length];

    // Launch from random position at bottom
    const x = 0.2 + (Math.random() * 0.6); // Between 0.2 and 0.8

    confetti({
      particleCount: 100,
      spread: 100,
      origin: { x, y: 0.9 },
      colors: colorSet,
      decay: 0.91,
      gravity: 1.5,
      ticks: 300,
      scalar: 1.2,
      angle: 90 - (Math.random() * 20 - 10), // Slight variation in angle
    });

    fired++;

    // Stagger next firework
    if (fired < count) {
      setTimeout(launchFirework, 200);
    }
  }

  launchFirework();
}

/**
 * Animate checkmark with bounce and glow
 *
 * @param element - Checkbox element to animate
 */
export function triggerCheckmarkAnimation(element: HTMLElement): void {
  // Respect accessibility preference
  if (prefersReducedMotion()) {
    return;
  }

  // Add CSS animation class
  element.classList.add('checkmark-bounce');

  // Remove class after animation completes
  setTimeout(() => {
    element.classList.remove('checkmark-bounce');
  }, 500);
}

/**
 * Celebrate task card with pulse and badge
 *
 * @param taskElement - Task card element to animate
 */
export function triggerTaskCardCelebration(taskElement: HTMLElement): void {
  // Respect accessibility preference
  if (prefersReducedMotion()) {
    return;
  }

  // Add pulse animation class
  taskElement.classList.add('task-celebrate');

  // Create "Done!" badge overlay
  const badge = document.createElement('div');
  badge.className = 'task-done-badge';
  badge.textContent = '✓ Done!';
  badge.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: #10B981;
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    z-index: 10;
    animation: fadeInOut 1s ease-in-out;
  `;

  taskElement.style.position = 'relative';
  taskElement.appendChild(badge);

  // Remove animations after completion
  setTimeout(() => {
    taskElement.classList.remove('task-celebrate');
    badge.remove();
  }, 1000);
}

/**
 * Add CSS animations to document (call once on app init)
 */
export function injectCelebrationStyles(): void {
  // Check if styles already injected
  if (document.getElementById('celebration-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'celebration-styles';
  style.textContent = `
    @keyframes checkmark-bounce {
      0% { transform: scale(1); }
      25% { transform: scale(1.3); filter: drop-shadow(0 0 8px #10B981); }
      50% { transform: scale(1.1); }
      75% { transform: scale(1.2); }
      100% { transform: scale(1); filter: none; }
    }

    .checkmark-bounce {
      animation: checkmark-bounce 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    @keyframes task-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
      50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
      100% { transform: scale(1); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
    }

    .task-celebrate {
      animation: task-pulse 600ms ease-in-out;
    }

    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(-4px); }
      20% { opacity: 1; transform: translateY(0); }
      80% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-4px); }
    }

    /* Respect prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .checkmark-bounce,
      .task-celebrate {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}
