import type { PomodoroMode } from '../stores/usePomodoroStore';

/** Window with vendor-prefixed AudioContext for older Safari */
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * Pomodoro Notification Utilities
 *
 * Handles browser notifications and audio alerts for Pomodoro timer.
 */

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    if (import.meta.env.DEV) {
      console.warn('This browser does not support desktop notifications');
    }
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show a desktop notification for Pomodoro timer
 */
export function showPomodoroNotification(mode: PomodoroMode) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const titles = {
    focus: 'Focus Session Complete!',
    shortBreak: 'Break Complete!',
    longBreak: 'Long Break Complete!',
  };

  const bodies = {
    focus: 'Great work! Time for a break.',
    shortBreak: 'Break time is over. Ready to focus?',
    longBreak: 'Long break finished. Feeling refreshed?',
  };

  // Emoji icons for different timer types (currently unused but available for future use)
  // const icons = {
  //   focus: '🎯',
  //   shortBreak: '☕',
  //   longBreak: '🌟',
  // };

  const notification = new Notification(titles[mode], {
    body: bodies[mode],
    icon: `/favicon.ico`, // Use your app's icon
    badge: `/favicon.ico`,
    tag: 'pomodoro-timer', // Replaces previous notification
    requireInteraction: false,
    silent: false,
  });

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);

  // Focus window when clicked
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Play notification sound
 */
export function playPomodoroSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as WindowWithWebkit).webkitAudioContext!)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3; // Volume

    // Play beep pattern (3 short beeps)
    const beepDuration = 0.1; // seconds
    const beepInterval = 0.15; // seconds

    oscillator.start(audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + beepDuration);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + beepInterval);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + beepInterval + beepDuration);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + beepInterval * 2);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + beepInterval * 2 + beepDuration);

    oscillator.stop(audioContext.currentTime + beepInterval * 2 + beepDuration);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
}

/**
 * Send Pomodoro completion notification
 */
export async function notifyPomodoroComplete(
  mode: PomodoroMode,
  soundEnabled: boolean,
  notificationsEnabled: boolean
) {
  if (soundEnabled) {
    playPomodoroSound();
  }

  if (notificationsEnabled) {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      showPomodoroNotification(mode);
    }
  }
}

/**
 * Check if browser supports notifications
 */
export function supportsNotifications(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
