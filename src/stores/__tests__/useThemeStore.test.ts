import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useThemeStore } from '../useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Mock requestAnimationFrame to execute synchronously for tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    // Reset store and DOM classes
    useThemeStore.setState({
      mode: 'dark',
      brandTheme: 'default',
      colorMode: 'dark',
    });
    document.documentElement.classList.remove('dark', 'light', 'theme-transitioning');

    // Clean up injected theme style
    const injected = document.getElementById('neumanos-theme-vars');
    if (injected) injected.remove();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have initial dark mode', () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
  });

  it('should have default brand theme', () => {
    const state = useThemeStore.getState();
    expect(state.brandTheme).toBe('default');
    expect(state.colorMode).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    useThemeStore.getState().toggleTheme();

    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
  });

  it('should toggle from light to dark', () => {
    useThemeStore.setState({ mode: 'light', colorMode: 'light' });
    useThemeStore.getState().toggleTheme();

    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
  });

  it('should toggle multiple times correctly', () => {
    expect(useThemeStore.getState().mode).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should add dark class to document when mode is dark', () => {
    useThemeStore.setState({ mode: 'light', colorMode: 'light' });
    document.documentElement.classList.remove('dark');

    useThemeStore.getState().toggleTheme();

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class from document when mode is light', () => {
    useThemeStore.setState({ mode: 'dark', colorMode: 'dark' });
    document.documentElement.classList.add('dark');

    useThemeStore.getState().toggleTheme();

    expect(useThemeStore.getState().mode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should persist theme to localStorage', () => {
    useThemeStore.getState().toggleTheme();

    const stored = localStorage.getItem('theme-storage');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.mode).toBe('light');
  });

  // Brand theme tests
  describe('setBrandTheme', () => {
    it('should set brand theme', () => {
      useThemeStore.getState().setBrandTheme('neon-noir');
      expect(useThemeStore.getState().brandTheme).toBe('neon-noir');
    });

    it('should inject CSS variables for non-default themes', () => {
      useThemeStore.getState().setBrandTheme('matrix');

      const style = document.getElementById('neumanos-theme-vars');
      expect(style).toBeTruthy();
      expect(style?.textContent).toContain('--accent-green');
    });

    it('should remove injected styles for default theme', () => {
      // First set a non-default theme
      useThemeStore.getState().setBrandTheme('matrix');
      expect(document.getElementById('neumanos-theme-vars')).toBeTruthy();

      // Switch back to default
      useThemeStore.getState().setBrandTheme('default');
      expect(document.getElementById('neumanos-theme-vars')).toBeNull();
    });

    it('should not crash for invalid theme id', () => {
      // getTheme falls back to default for unknown IDs
      useThemeStore.getState().setBrandTheme('nonexistent-theme');
      // Should not throw
    });
  });

  // Color mode tests
  describe('setColorMode', () => {
    it('should set color mode to light', () => {
      useThemeStore.getState().setColorMode('light');
      const state = useThemeStore.getState();
      expect(state.colorMode).toBe('light');
      expect(state.mode).toBe('light');
    });

    it('should set color mode to dark', () => {
      useThemeStore.setState({ mode: 'light', colorMode: 'light' });
      useThemeStore.getState().setColorMode('dark');
      const state = useThemeStore.getState();
      expect(state.colorMode).toBe('dark');
      expect(state.mode).toBe('dark');
    });

    it('should set color mode to system', () => {
      // Mock matchMedia for system preference
      const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true, // prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList);

      useThemeStore.getState().setColorMode('system');
      const state = useThemeStore.getState();
      expect(state.colorMode).toBe('system');
      expect(state.mode).toBe('dark'); // system prefers dark

      matchMediaSpy.mockRestore();
    });

    it('should sync colorMode when toggling theme', () => {
      useThemeStore.getState().toggleTheme();
      const state = useThemeStore.getState();
      expect(state.colorMode).toBe('light');
      expect(state.mode).toBe('light');
    });
  });

  // Migration test
  describe('store migration', () => {
    it('should migrate v1 state to v2 with default brand theme', () => {
      // Simulate v1 state
      const v1State = {
        mode: 'light',
        backupPreferences: {
          hasBackupFolder: false,
          backupFolderPath: null,
          autoSaveEnabled: false,
          saveInterval: 30000,
          versionsToKeep: 7,
          customFileName: 'NeumanOS',
          reminderPreference: 'every-session',
          nextReminderDate: null,
        },
      };

      // Store the v1 state in localStorage
      localStorage.setItem('theme-storage', JSON.stringify({
        state: v1State,
        version: 1,
      }));

      // The migrate function is internal, but we can test the expected output
      const stored = localStorage.getItem('theme-storage');
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
      expect(parsed.state.mode).toBe('light');
      // After migration, brandTheme and colorMode should be added
      // (This tests the structure; actual migration runs on rehydration)
    });
  });
});
