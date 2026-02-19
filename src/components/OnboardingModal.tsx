/**
 * OnboardingModal Component
 *
 * First-time user onboarding experience
 * - Step 1: Welcome screen with product intro and privacy statement
 * - Step 2: Features tour (Notes, Tasks, Calendar, Time Tracking)
 * - Step 3: Setup (display name, default folder, backup reminder)
 * - Step 4: Completion with CTA to create first note/task
 */

import { useState, lazy, Suspense } from 'react';
import { Modal } from './Modal';

// Lazy load SupportModal to prevent bundle bloat
const SupportModal = lazy(() => import('./SupportModal').then(m => ({ default: m.SupportModal })));
import { useSettingsStore } from '../stores/useSettingsStore';
import { useThemeStore } from '../stores/useThemeStore';
import { isFileSystemAccessSupported } from '../services/brainBackup';
import { BackupOnboardingModal } from './BackupOnboardingModal';
import {
  FileText,
  CheckSquare,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Info,
  Wifi,
  Database,
  LayoutDashboard,
  Zap,
  Heart,
  HelpCircle,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { THEME_REGISTRY } from '../config/themes/registry';
import type { ColorMode } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<'in-7-days' | 'monthly' | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const setOnboardingComplete = useSettingsStore((state) => state.setOnboardingComplete);
  const setDisplayNameInStore = useSettingsStore((state) => state.setDisplayName);
  const updateBackupPreferences = useThemeStore((state) => state.updateBackupPreferences);
  const mode = useThemeStore((s) => s.mode);
  const brandTheme = useThemeStore((s) => s.brandTheme);
  const colorMode = useThemeStore((s) => s.colorMode);
  const setBrandTheme = useThemeStore((s) => s.setBrandTheme);
  const setColorMode = useThemeStore((s) => s.setColorMode);
  const logoSrc = mode === 'dark' ? '/images/logos/logo_white.png' : '/images/logos/logo_black.png';

  // Build theme list from registry (exclude default since we're migrating away from it)
  const themes = Object.values(THEME_REGISTRY).filter((t) => t.id !== 'default');

  const isFSASupported = isFileSystemAccessSupported();

  const totalSteps = 4;

  /**
   * Handle skip tour - mark onboarding complete and close
   */
  const handleSkipTour = () => {
    setOnboardingComplete(true);
    onClose();
  };

  /**
   * Handle completion - save preferences and close
   */
  const handleComplete = () => {
    // Save display name if provided
    if (displayName.trim()) {
      setDisplayNameInStore(displayName.trim());
    }
    setOnboardingComplete(true);
    onClose();
  };

  /**
   * Navigate to next step
   */
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Open backup setup modal
   */
  const handleSetupBackup = () => {
    setShowBackupModal(true);
  };

  /**
   * Handle backup modal completion
   */
  const handleBackupComplete = () => {
    setShowBackupModal(false);
    handleComplete();
  };

  /**
   * Handle skip with reminder preference
   */
  const handleSkipWithReminder = () => {
    if (selectedReminder) {
      const nextReminderDate =
        selectedReminder === 'in-7-days'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

      updateBackupPreferences({
        reminderPreference: selectedReminder,
        nextReminderDate,
      });
    }
    handleComplete();
  };

  /**
   * Handle skip forever (never remind)
   */
  const handleSkipForever = () => {
    updateBackupPreferences({
      reminderPreference: 'never',
      nextReminderDate: null,
    });
    handleComplete();
  };

  /**
   * Step 1: Welcome - Privacy and platform intro
   */
  const renderWelcomeStep = () => (
    <div className="space-y-4">
      {/* Tagline */}
      <p className="text-center text-lg text-text-light-secondary dark:text-text-dark-secondary italic">
        Your Brain. Your Data. Your Device.
      </p>

      {/* Core principles */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-accent-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              100% Local-First
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              All your data stays on your device. No accounts, no servers, no tracking.
              Your information never leaves your computer unless you choose to export it.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Database className="h-6 w-6 text-accent-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              You Own Your Data
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Export everything anytime. No subscriptions, no vendor lock-in.
              Full data portability is built in from day one.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Wifi className="h-6 w-6 text-accent-blue shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              Works Offline
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              No internet required. Your productivity tools work anywhere, anytime.
              Perfect for focused work without distractions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Step 2: Features Tour - What's included
   */
  const renderFeaturesTourStep = () => (
    <div className="space-y-4">
      {/* Core features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Notes
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Rich text editor with folders, tags, slash commands, and full-text search
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Tasks
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Kanban boards with subtasks, dependencies, priorities, and due dates
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-accent-blue" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Calendar
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Month, week, day views with recurring events and ICS import/export
          </p>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-accent-primary" />
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Time Tracking
            </h3>
          </div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Timer with projects, daily/weekly stats, reports, and CSV export
          </p>
        </div>
      </div>

      {/* Additional features */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
            44+ Dashboard Widgets
          </h3>
        </div>
        <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Weather, news, calculator, world clock, pomodoro timer, and more.
          Drag-and-drop to customize your perfect workspace.
        </p>
      </div>
    </div>
  );

  /**
   * Step 3: Setup - Personalization options
   */
  const renderSetupStep = () => (
    <div className="space-y-4">
      {/* Theme picker */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-5 w-5 text-accent-primary" />
          <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary">
            Choose Your Look
          </h3>
        </div>

        {/* Color mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          {(
            [
              { id: 'light' as ColorMode, icon: Sun, label: 'Light' },
              { id: 'dark' as ColorMode, icon: Moon, label: 'Dark' },
              { id: 'system' as ColorMode, icon: Monitor, label: 'System' },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setColorMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                colorMode === id
                  ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                  : 'border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary hover:border-accent-primary/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Theme cards — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setBrandTheme(theme.id)}
              className={`flex-shrink-0 w-20 rounded-lg border p-2 transition-all text-center ${
                brandTheme === theme.id
                  ? 'border-accent-primary ring-1 ring-accent-primary'
                  : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
              }`}
              aria-label={`Select ${theme.name} theme`}
            >
              {/* Color swatches */}
              <div className="flex gap-1 justify-center mb-1.5">
                <div
                  className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                  style={{ backgroundColor: theme.preview.primary }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                  style={{ backgroundColor: theme.preview.secondary }}
                />
                <div
                  className="w-4 h-4 rounded-full border border-border-light dark:border-border-dark"
                  style={{ backgroundColor: theme.preview.accent }}
                />
              </div>
              {/* Theme name */}
              <span className="text-[10px] leading-tight text-text-light-primary dark:text-text-dark-primary block truncate">
                {theme.name}
              </span>
              {/* Active indicator */}
              {brandTheme === theme.id && (
                <Check className="h-3 w-3 text-accent-primary mx-auto mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Display name input */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <label
          htmlFor="display-name"
          className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2"
        >
          Display Name (Optional)
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded-lg text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
        <p className="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
          This is just for you - stored locally and never shared
        </p>
      </div>

      {/* Backup info */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              Keep Your Data Safe
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Your data is stored in your browser. Regular backups ensure you never lose your work.
            </p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Set up automatic backups anytime in Settings → Backup & Sync
            </p>
          </div>
        </div>
      </div>

      {/* Quick tips */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-accent-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
              Quick Tip
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Press <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">F1</kbd> for help anytime. Use <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-surface-light-elevated dark:bg-surface-dark-elevated border border-border-light dark:border-border-dark rounded text-xs font-mono">B</kbd> to toggle the sidebar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Step 4: Completion - Ready to start
   */
  const renderCompletionStep = () => (
    <div className="space-y-4">
      {/* Backup Section - Only show if FSA supported */}
      {isFSASupported && (
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-6 w-6 text-accent-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
                Enable Auto-Save Backups
              </h3>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Auto-save to a cloud folder (Dropbox, Google Drive, etc.) for seamless backups.
              </p>
            </div>
          </div>

          <button
            onClick={handleSetupBackup}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors font-medium"
          >
            <Shield className="h-4 w-4" />
            <span>Setup Auto-Save Now</span>
          </button>

          {/* Skip Options */}
          {!showSkipOptions ? (
            <button
              onClick={() => setShowSkipOptions(true)}
              className="w-full mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            >
              Maybe later...
            </button>
          ) : (
            <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-2">
                When should we remind you?
              </p>
              <div className="flex gap-2">
                {[
                  { id: 'in-7-days' as const, label: 'In 7 days' },
                  { id: 'monthly' as const, label: 'Monthly' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedReminder(option.id)}
                    className={`flex-1 p-2 text-center text-sm rounded border transition-all ${
                      selectedReminder === option.id
                        ? 'border-accent-primary bg-accent-primary/10 text-text-light-primary dark:text-text-dark-primary'
                        : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSkipWithReminder}
                  disabled={!selectedReminder}
                  className="flex-1 px-3 py-2 bg-accent-primary text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
                <button
                  onClick={handleSkipForever}
                  className="px-3 py-2 text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-status-error transition-colors"
                >
                  Never remind
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Non-FSA Browser Message */}
      {!isFSASupported && (
        <div className="bg-status-info/10 border border-status-info rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-status-info shrink-0 mt-0.5" />
            <p className="text-sm text-text-light-primary dark:text-text-dark-primary">
              <strong>Note:</strong> Auto-save requires Chrome, Edge, or Brave.
              You can manually export your data anytime from Settings.
            </p>
          </div>
        </div>
      )}

      {/* Get Started Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-5">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary text-center mb-4">
          Ready to Get Started?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">Create Your First Note</span>
          </button>

          <button
            onClick={handleComplete}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
          >
            <CheckSquare className="h-4 w-4" />
            <span className="font-medium">Create Your First Task</span>
          </button>
        </div>

        <p className="text-xs text-center text-text-light-secondary dark:text-text-dark-secondary mt-4">
          All features are accessible from the sidebar
        </p>
      </div>

      {/* Built with care message */}
      <div className="text-center pt-2">
        <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary flex items-center justify-center gap-1">
          <Heart className="h-3 w-3 text-accent-primary" />
          Built with care for privacy, productivity, and open source
        </p>
      </div>

      {/* Backup Modal (inline) */}
      <BackupOnboardingModal
        isOpen={showBackupModal}
        onClose={handleBackupComplete}
      />
    </div>
  );

  /**
   * Render current step content
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderWelcomeStep();
      case 2:
        return renderFeaturesTourStep();
      case 3:
        return renderSetupStep();
      case 4:
        return renderCompletionStep();
      default:
        return null;
    }
  };

  /**
   * Get step-specific subtitle text
   */
  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return 'Your privacy-first productivity platform';
      case 2:
        return 'Everything you need to stay organized';
      case 3:
        return 'Personalize your experience';
      case 4:
        return "You're all set!";
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to NeumanOS" maxWidth="lg" hideHeader>
      <div className="flex flex-col">
        {/* Persistent Header: Logo + Title + Subtitle + Progress + Close */}
        <div className="flex-shrink-0 pb-4 border-b border-border-light dark:border-border-dark">
          {/* Close button - top right */}
          <div className="flex justify-end mb-2">
            <button
              onClick={handleSkipTour}
              className="p-1 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Logo + Title + Subtitle */}
          <div className="text-center mb-4">
            <img
              src={logoSrc}
              alt="NeumanOS"
              className="w-2/3 h-auto mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Welcome to NeumanOS
            </h2>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
              {getStepSubtitle()}
            </p>
          </div>

          {/* Progress indicator - with visible border in both modes */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-2 w-10 rounded-full transition-colors border border-border-light dark:border-border-dark ${
                  index + 1 === currentStep
                    ? 'bg-accent-primary'
                    : index + 1 < currentStep
                    ? 'bg-accent-primary'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content - fixed height for consistent modal size (sized to fit page 4) */}
        <div className="py-5 min-h-[480px]">
          {renderStepContent()}
        </div>

        {/* Navigation Footer - fixed 3-column layout: Back/FAQ | Skip | Next */}
        <div className="flex-shrink-0 grid grid-cols-3 items-center pt-4 border-t border-border-light dark:border-border-dark">
          {/* Left column: FAQ button on step 1, Back button on other steps */}
          <div className="justify-self-start">
            {currentStep === 1 ? (
              <button
                onClick={() => setShowFaqModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>FAQ</span>
              </button>
            ) : (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Skip tour - always centered */}
          <div className="justify-self-center">
            <button
              onClick={handleSkipTour}
              className="text-sm text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors"
            >
              Skip tour
            </button>
          </div>

          {/* Next button - always present, changes to "Done" on last step */}
          <div className="justify-self-end">
            <button
              onClick={currentStep < totalSteps ? handleNext : handleComplete}
              className="flex items-center gap-2 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover transition-colors"
            >
              <span>{currentStep < totalSteps ? 'Next' : 'Done'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Modal - opens to Help tab with FAQs */}
      {showFaqModal && (
        <Suspense fallback={null}>
          <SupportModal
            isOpen={showFaqModal}
            onClose={() => setShowFaqModal(false)}
            initialTab="help"
          />
        </Suspense>
      )}
    </Modal>
  );
}
