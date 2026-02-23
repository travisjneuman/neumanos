/**
 * Sound Effects System
 *
 * Optional audio feedback for task completions and achievements.
 * Users must opt-in via Settings.
 *
 * Sound file requirements:
 * - Format: MP3 (universal browser support)
 * - Size: <50KB each
 * - License: Public domain or CC0
 *
 * Recommended sources:
 * - https://freesound.org/ (CC0 sounds)
 * - https://pixabay.com/sound-effects/ (free sounds)
 * - https://www.zapsplat.com/ (free with attribution)
 *
 * Sound files needed in public/sounds/:
 * - task-complete.mp3 - Satisfying "ding" or "pop" (200-500ms)
 * - achievement.mp3 - Triumphant fanfare for milestones (1-2s)
 * - checklist-item.mp3 - Subtle "tick" sound (100ms)
 */

// Sound cache to avoid re-fetching
const soundCache = new Map<string, HTMLAudioElement>();

/**
 * Load sound file into Audio element
 *
 * @param soundName - Name of sound file (without extension)
 * @returns HTMLAudioElement or null if loading fails
 */
function loadSound(soundName: string): HTMLAudioElement | null {
  // Check cache first
  if (soundCache.has(soundName)) {
    return soundCache.get(soundName)!;
  }

  try {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.preload = 'auto';
    soundCache.set(soundName, audio);
    return audio;
  } catch (error) {
    console.warn(`Failed to load sound: ${soundName}`, error);
    return null;
  }
}

/**
 * Play sound effect
 *
 * @param soundName - Name of sound file (without extension)
 * @param volume - Volume level (0.0 - 1.0)
 * @param enabled - Whether sounds are enabled in settings
 */
export async function playSound(
  soundName: string,
  volume: number = 0.5,
  enabled: boolean = false
): Promise<void> {
  // Respect user preference
  if (!enabled) {
    return;
  }

  const audio = loadSound(soundName);
  if (!audio) {
    return;
  }

  try {
    // Reset to start if already playing
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));

    // Play (handle autoplay policy)
    await audio.play();
  } catch (error) {
    // Browser autoplay policy may block sound
    // This is expected on first interaction, silent fail
    if (import.meta.env.DEV) {
      console.debug('Sound play blocked (autoplay policy):', error);
    }
  }
}

/**
 * Preload all sound files
 *
 * Call this on app init to prevent delay on first play.
 * Only preloads if sounds are enabled.
 *
 * @param enabled - Whether sounds are enabled in settings
 */
export function preloadSounds(enabled: boolean = false): void {
  if (!enabled) {
    return;
  }

  const sounds = ['task-complete', 'achievement', 'checklist-item'];

  sounds.forEach((soundName) => {
    loadSound(soundName);
  });

  if (import.meta.env.DEV) {
    console.debug('Sound effects preloaded');
  }
}

/**
 * Play task completion sound
 */
export function playTaskCompleteSound(volume: number, enabled: boolean): void {
  playSound('task-complete', volume, enabled);
}

/**
 * Play achievement unlocked sound
 */
export function playAchievementSound(volume: number, enabled: boolean): void {
  playSound('achievement', volume, enabled);
}

/**
 * Play checklist item checked sound
 */
export function playChecklistItemSound(volume: number, enabled: boolean): void {
  playSound('checklist-item', volume, enabled);
}

/**
 * Clear sound cache (cleanup on settings change)
 */
export function clearSoundCache(): void {
  soundCache.clear();
}
